// CareLoop — Deterministic Risk Engine (CORE)
//
// This is the heart of CareLoop. Risk severity is decided HERE by explicit,
// auditable rules — never by an LLM. AI is used elsewhere only to reword the
// summary for humans. Every matched rule carries the data evidence that fired
// it, so a nurse can see exactly why a patient was flagged.
//
// Rules (from the build spec):
//   HF-001  weight ↑ ≥ 2 kg over 3 days                      → review_today
//   HF-002  weight gain (≥1.5 kg/3d) + SOB + swelling         → escalate
//   MED-001 medication missed 2 days in a row                 → review_today
//   BP-001  systolic > 180 OR diastolic > 110                 → escalate
//   ACT-001 steps > 40% below baseline for 3 days             → watch
//   SYM-001 patient reports breathlessness / swelling / chest → review_today
//
// Windows are CALENDAR-DATE aware (not array-index based) and thresholds compare
// the true value (rounding is only for the human-readable evidence string), so
// the rules behave correctly on sparse, gapped, or imported data.

import { addDays, diffDays } from "./dates";
import type {
  DailyCheckIn,
  DailyVitals,
  MatchedRule,
  Patient,
  RiskResult,
  Severity,
  VitalReading,
} from "./types";
import { SEVERITY_ORDER } from "./types";
import { series, toDailyVitals } from "./vitals";

const HF001_WEIGHT_GAIN_KG = 2.0;
const HF002_WEIGHT_GAIN_KG = 1.5;
const BP_SYSTOLIC_MAX = 180;
const BP_DIASTOLIC_MAX = 110;
const ACT_DROP_FRACTION = 0.4; // >40% below baseline
const ACT_DAYS = 3;
const WEIGHT_WINDOW_DAYS = 3;
const WINDOW_GAP_TOLERANCE = 1; // allow one missing day inside a window

const REASON_TAG: Record<string, string> = {
  "HF-001": "weight gain",
  "HF-002": "symptoms reported",
  "MED-001": "missed meds",
  "BP-001": "high BP",
  "ACT-001": "low activity",
  "SYM-001": "symptoms reported",
};

const RECOMMENDED_ACTION: Record<Severity, string> = {
  escalate:
    "Nurse review recommended today and notify family. If symptoms are severe, contact emergency services.",
  review_today:
    "Nurse review recommended today. Consider booking a clinic follow-up.",
  watch: "Continue monitoring. Nurse review if the trend continues.",
  stable: "No action needed. Continue routine monitoring.",
};

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * Weight change over the trailing `days` calendar days. Anchors on the most
 * recent reading taken at least `days` ago (tolerating one missing day). Returns
 * the RAW gain (compare against this; round only for display). Null when there
 * isn't a genuine ~`days`-old baseline reading.
 */
function weightChangeOverDays(
  weights: { date: string; value: number }[],
  days: number,
): { gain: number; from: number; to: number; spanDays: number } | null {
  if (weights.length < 2) return null;
  const last = weights[weights.length - 1];
  const targetDate = addDays(last.date, -days);
  let anchor: { date: string; value: number } | null = null;
  for (let i = weights.length - 2; i >= 0; i--) {
    if (weights[i].date <= targetDate) {
      anchor = weights[i];
      break;
    }
  }
  // Fall back to the oldest reading if everything is newer than the target,
  // but only if it is still close enough to the intended window.
  if (!anchor) anchor = weights[0];
  if (anchor.date >= last.date) return null;
  if (diffDays(anchor.date, last.date) > days + WINDOW_GAP_TOLERANCE) return null;

  return {
    gain: last.value - anchor.value,
    from: anchor.value,
    to: last.value,
    spanDays: diffDays(anchor.date, last.date),
  };
}

/** Raw 3-day weight gain (kg) for reuse by summary/caregiver display. */
export function weightGain3d(daily: DailyVitals[]): number | null {
  const wc = weightChangeOverDays(series(daily, "weight"), WEIGHT_WINDOW_DAYS);
  return wc ? wc.gain : null;
}

/** Are the given dated points on consecutive calendar days (oldest→newest)? */
function areConsecutiveDays(points: { date: string }[]): boolean {
  for (let i = 1; i < points.length; i++) {
    if (diffDays(points[i - 1].date, points[i].date) !== 1) return false;
  }
  return true;
}

/**
 * Evaluate a patient's monitoring data against the deterministic rules.
 * Pure function — same input always yields the same result.
 */
export function evaluateRisk(
  patient: Patient,
  vitals: VitalReading[],
  checkins: DailyCheckIn[],
): RiskResult {
  const daily = toDailyVitals(vitals);
  const sortedCheckins = [...checkins].sort((a, b) => a.date.localeCompare(b.date));
  const latestCheckin = sortedCheckins[sortedCheckins.length - 1];
  const matched: MatchedRule[] = [];

  // --- HF-001 / HF-002: weight & fluid-retention signals ---
  const wc = weightChangeOverDays(series(daily, "weight"), WEIGHT_WINDOW_DAYS);

  if (wc && wc.gain >= HF001_WEIGHT_GAIN_KG) {
    matched.push({
      code: "HF-001",
      severity: "review_today",
      description: "Rapid weight gain can indicate fluid retention in heart-failure monitoring.",
      evidence: `Weight increased ${round1(wc.gain)} kg over ${wc.spanDays} days (${wc.from} → ${wc.to} kg).`,
    });
  }

  if (
    wc &&
    wc.gain >= HF002_WEIGHT_GAIN_KG &&
    latestCheckin?.shortness_of_breath === true &&
    latestCheckin?.swelling === true
  ) {
    matched.push({
      code: "HF-002",
      severity: "escalate",
      description: "Weight gain combined with shortness of breath and swelling requires review.",
      evidence: `+${round1(wc.gain)} kg over ${wc.spanDays} days with reported shortness of breath and leg/feet swelling.`,
    });
  }

  // --- MED-001: medication missed two CONSECUTIVE days ---
  if (sortedCheckins.length >= 2) {
    const lastTwo = sortedCheckins.slice(-2);
    if (
      lastTwo.every((c) => c.medication_taken === false) &&
      diffDays(lastTwo[0].date, lastTwo[1].date) === 1
    ) {
      matched.push({
        code: "MED-001",
        severity: "review_today",
        description: "Repeated missed medication increases chronic-care risk.",
        evidence: `Medication reported missed on ${lastTwo[0].date} and ${lastTwo[1].date}.`,
      });
    }
  }

  // --- BP-001: very high blood pressure (systolic & diastolic from one day) ---
  const bpDay = latestBpDay(daily);
  if (bpDay) {
    const { systolic, diastolic } = bpDay;
    if (
      (systolic !== null && systolic > BP_SYSTOLIC_MAX) ||
      (diastolic !== null && diastolic > BP_DIASTOLIC_MAX)
    ) {
      matched.push({
        code: "BP-001",
        severity: "escalate",
        description: "Very high blood pressure should be reviewed urgently.",
        evidence: `Latest blood pressure ${systolic ?? "?"}/${diastolic ?? "?"} mmHg on ${bpDay.date}.`,
      });
    }
  }

  // --- ACT-001: sustained activity drop over 3 CONSECUTIVE days ---
  const steps = series(daily, "steps");
  if (steps.length >= ACT_DAYS && patient.baseline_steps > 0) {
    const threshold = patient.baseline_steps * (1 - ACT_DROP_FRACTION);
    const lastN = steps.slice(-ACT_DAYS);
    if (areConsecutiveDays(lastN) && lastN.every((s) => s.value < threshold)) {
      const avg = Math.round(lastN.reduce((sum, s) => sum + s.value, 0) / lastN.length);
      const dropPct = Math.round((1 - avg / patient.baseline_steps) * 100);
      matched.push({
        code: "ACT-001",
        severity: "watch",
        description: "Reduced activity may signal deterioration or frailty risk.",
        evidence: `Activity averaged ${avg} steps over ${ACT_DAYS} days, ~${dropPct}% below the ${patient.baseline_steps} baseline.`,
      });
    }
  }

  // --- SYM-001: patient reports a red-flag symptom (any condition) ---
  // Catches symptomatic patients whose other rules (weight/BP/activity) don't
  // fire — e.g. a COPD patient reporting breathlessness with stable weight.
  if (latestCheckin) {
    const reported: string[] = [];
    if (latestCheckin.shortness_of_breath) reported.push("shortness of breath");
    if (latestCheckin.swelling) reported.push("swelling in legs/feet");
    if (latestCheckin.chest_discomfort) reported.push("chest discomfort");
    if (reported.length > 0) {
      matched.push({
        code: "SYM-001",
        severity: "review_today",
        description:
          "Patient reported symptoms that warrant nurse review, regardless of condition.",
        evidence: `Reported ${reported.join(", ")} on ${latestCheckin.date}.`,
      });
    }
  }

  // --- combine ---
  const severity = highestSeverity(matched);
  const reason = buildReason(matched, severity);
  const reason_tags = [...new Set(matched.map((m) => REASON_TAG[m.code] ?? m.code))];

  return {
    severity,
    matched_rules: matched,
    reason,
    recommended_action: RECOMMENDED_ACTION[severity],
    reason_tags,
  };
}

/** Most recent day that has a blood-pressure reading (systolic or diastolic). */
function latestBpDay(daily: DailyVitals[]): DailyVitals | null {
  for (let i = daily.length - 1; i >= 0; i--) {
    if (daily[i].systolic !== null || daily[i].diastolic !== null) return daily[i];
  }
  return null;
}

function highestSeverity(matched: MatchedRule[]): Severity {
  let severity: Severity = "stable";
  for (const m of matched) {
    if (SEVERITY_ORDER[m.severity] > SEVERITY_ORDER[severity]) severity = m.severity;
  }
  return severity;
}

function buildReason(matched: MatchedRule[], severity: Severity): string {
  if (matched.length === 0) {
    return "No monitoring rules triggered. Vitals, symptoms, and adherence within expected range.";
  }
  const lead = matched.filter((m) => m.severity === severity);
  const rest = matched.filter((m) => m.severity !== severity);
  return [...lead, ...rest].map((m) => m.evidence).join(" ");
}

/** Per-day risk severity, recomputed cumulatively for the timeline chart. */
export function riskTrend(
  patient: Patient,
  vitals: VitalReading[],
  checkins: DailyCheckIn[],
): { date: string; score: number; severity: Severity }[] {
  const daily = toDailyVitals(vitals);
  return daily.map((d) => {
    const upToVitals = vitals.filter((v) => v.timestamp.slice(0, 10) <= d.date);
    const upToCheckins = checkins.filter((c) => c.date <= d.date);
    const r = evaluateRisk(patient, upToVitals, upToCheckins);
    return { date: d.date, score: SEVERITY_ORDER[r.severity], severity: r.severity };
  });
}
