// CareLoop — Synthetic seed data (teammate-1 zone)
//
// All data is SYNTHETIC. No real patients. Five elderly Hong Kong chronic-care
// patients with 7 days of vitals + daily check-ins. The numbers are tuned so
// the DETERMINISTIC risk engine independently computes each patient's intended
// state — severity is never hard-coded, it falls out of lib/riskEngine.ts.
//
//   Mrs. Chan  → Escalate  (HF-001 + HF-002, missed meds, low activity)
//   Mr. Lee    → Watch     (ACT-001 sustained activity drop)
//   Mrs. Wong  → Stable
//   Mr. Ho     → Watch     (ACT-001 sustained activity drop)
//   Mrs. Lam   → Stable

import type {
  DailyCheckIn,
  Patient,
  VitalReading,
  VitalType,
} from "./types";

/** Seven consecutive demo days ending "today" (2026-06-06). */
export const DEMO_DATES = [
  "2026-05-31",
  "2026-06-01",
  "2026-06-02",
  "2026-06-03",
  "2026-06-04",
  "2026-06-05",
  "2026-06-06",
] as const;

export const WEEK_START: string = DEMO_DATES[0];
export const WEEK_END: string = DEMO_DATES[DEMO_DATES.length - 1];

export interface SeedDataset {
  patients: Patient[];
  vitals: VitalReading[];
  checkins: DailyCheckIn[];
}

interface DayRow {
  w: number; // weight kg
  sys: number; // systolic mmHg
  dia: number; // diastolic mmHg
  hr: number; // heart rate bpm
  steps: number;
  sleep: number; // hours
  med: boolean; // medication taken
  sob: boolean; // shortness of breath
  sw: boolean; // swelling
  dz: boolean; // dizziness
  ch: boolean; // chest discomfort
  mood: string;
  note?: string;
  skipCheckin?: boolean; // patient missed the daily check-in that day
}

interface PatientDef {
  patient: Patient;
  rows: DayRow[]; // exactly 7, aligned with DEMO_DATES
}

const UNIT: Record<VitalType, string> = {
  weight: "kg",
  blood_pressure_systolic: "mmHg",
  blood_pressure_diastolic: "mmHg",
  heart_rate: "bpm",
  steps: "steps",
  sleep_hours: "h",
};

const PATIENT_DEFS: PatientDef[] = [
  {
    patient: {
      id: "patient-mrs-chan",
      name: "Mrs. Chan",
      age: 78,
      gender: "female",
      language: "Cantonese",
      living_status: "lives alone",
      conditions: ["heart failure", "hypertension"],
      caregiver_name: "Daughter (Ms. Chan)",
      caregiver_phone: "+852 9123 4567",
      assigned_nurse: "Nurse Lee",
      baseline_weight: 62.0,
      baseline_steps: 3500,
    },
    rows: [
      { w: 61.6, sys: 138, dia: 84, hr: 76, steps: 3400, sleep: 6.5, med: true, sob: false, sw: false, dz: false, ch: false, mood: "okay" },
      { w: 61.8, sys: 140, dia: 85, hr: 77, steps: 3250, sleep: 6.3, med: true, sob: false, sw: false, dz: false, ch: false, mood: "okay" },
      { w: 61.9, sys: 142, dia: 86, hr: 78, steps: 3000, sleep: 6.2, med: true, sob: false, sw: false, dz: false, ch: false, mood: "a little tired" },
      { w: 62.0, sys: 148, dia: 88, hr: 80, steps: 2600, sleep: 6.0, med: true, sob: false, sw: false, dz: false, ch: false, mood: "tired" },
      { w: 62.8, sys: 152, dia: 90, hr: 82, steps: 2050, sleep: 5.8, med: false, sob: true, sw: false, dz: false, ch: false, mood: "breathless at times", note: "Short of breath after walking to the kitchen." },
      { w: 63.6, sys: 156, dia: 92, hr: 85, steps: 1900, sleep: 5.5, med: false, sob: true, sw: true, dz: false, ch: false, mood: "breathless", note: "Ankles look swollen this evening." },
      { w: 64.3, sys: 158, dia: 94, hr: 88, steps: 1750, sleep: 5.4, med: false, sob: true, sw: true, dz: false, ch: false, mood: "very tired", note: "Breathless climbing stairs, feet and ankles puffy, did not take evening medicine." },
    ],
  },
  {
    patient: {
      id: "patient-mr-lee",
      name: "Mr. Lee",
      age: 72,
      gender: "male",
      language: "Cantonese, English",
      living_status: "lives with spouse",
      conditions: ["diabetes"],
      caregiver_name: "Wife (Mrs. Lee)",
      caregiver_phone: "+852 9234 5678",
      assigned_nurse: "Nurse Wong",
      baseline_weight: 70.0,
      baseline_steps: 4200,
    },
    rows: [
      { w: 70.1, sys: 132, dia: 80, hr: 74, steps: 4100, sleep: 6.8, med: true, sob: false, sw: false, dz: false, ch: false, mood: "good" },
      { w: 70.0, sys: 130, dia: 79, hr: 73, steps: 4000, sleep: 6.9, med: true, sob: false, sw: false, dz: false, ch: false, mood: "good" },
      { w: 69.9, sys: 131, dia: 80, hr: 75, steps: 3800, sleep: 6.7, med: false, sob: false, sw: false, dz: false, ch: false, mood: "ok", note: "Forgot morning tablet." },
      { w: 70.0, sys: 133, dia: 81, hr: 74, steps: 3000, sleep: 6.5, med: true, sob: false, sw: false, dz: false, ch: false, mood: "ok" },
      { w: 69.8, sys: 132, dia: 80, hr: 76, steps: 2400, sleep: 6.4, med: true, sob: false, sw: false, dz: false, ch: false, mood: "a bit tired" },
      { w: 69.9, sys: 134, dia: 82, hr: 77, steps: 2200, sleep: 6.2, med: true, sob: false, sw: false, dz: false, ch: false, mood: "tired", note: "Staying in more, knees sore." },
      { w: 70.0, sys: 133, dia: 81, hr: 76, steps: 2000, sleep: 6.3, med: true, sob: false, sw: false, dz: false, ch: false, mood: "tired", skipCheckin: true },
    ],
  },
  {
    patient: {
      id: "patient-mrs-wong",
      name: "Mrs. Wong",
      age: 81,
      gender: "female",
      language: "Cantonese",
      living_status: "lives with family",
      conditions: ["COPD"],
      caregiver_name: "Son (Mr. Wong)",
      caregiver_phone: "+852 9345 6789",
      assigned_nurse: "Nurse Lee",
      baseline_weight: 58.0,
      baseline_steps: 2800,
    },
    rows: [
      { w: 58.0, sys: 128, dia: 78, hr: 76, steps: 2750, sleep: 7.1, med: true, sob: false, sw: false, dz: false, ch: false, mood: "good" },
      { w: 58.1, sys: 126, dia: 77, hr: 75, steps: 2800, sleep: 7.0, med: true, sob: false, sw: false, dz: false, ch: false, mood: "good" },
      { w: 57.9, sys: 129, dia: 79, hr: 77, steps: 2700, sleep: 7.2, med: true, sob: false, sw: false, dz: false, ch: false, mood: "good" },
      { w: 58.0, sys: 127, dia: 78, hr: 76, steps: 2850, sleep: 7.0, med: true, sob: false, sw: false, dz: false, ch: false, mood: "good" },
      { w: 58.2, sys: 128, dia: 78, hr: 78, steps: 2800, sleep: 6.9, med: true, sob: false, sw: false, dz: false, ch: false, mood: "good" },
      { w: 58.0, sys: 130, dia: 80, hr: 77, steps: 2750, sleep: 7.1, med: true, sob: false, sw: false, dz: false, ch: false, mood: "good" },
      { w: 58.1, sys: 128, dia: 79, hr: 76, steps: 2820, sleep: 7.0, med: true, sob: false, sw: false, dz: false, ch: false, mood: "good" },
    ],
  },
  {
    patient: {
      id: "patient-mr-ho",
      name: "Mr. Ho",
      age: 76,
      gender: "male",
      language: "Cantonese",
      living_status: "lives with spouse",
      conditions: ["post-stroke recovery"],
      caregiver_name: "Wife (Mrs. Ho)",
      caregiver_phone: "+852 9456 7890",
      assigned_nurse: "Nurse Chan",
      baseline_weight: 68.0,
      baseline_steps: 3000,
    },
    rows: [
      { w: 68.0, sys: 132, dia: 80, hr: 72, steps: 2900, sleep: 6.8, med: true, sob: false, sw: false, dz: false, ch: false, mood: "ok" },
      { w: 68.1, sys: 131, dia: 79, hr: 73, steps: 2800, sleep: 6.7, med: true, sob: false, sw: false, dz: false, ch: false, mood: "ok" },
      { w: 67.9, sys: 133, dia: 81, hr: 74, steps: 2500, sleep: 6.6, med: true, sob: false, sw: false, dz: false, ch: false, mood: "ok" },
      { w: 68.0, sys: 132, dia: 80, hr: 73, steps: 2000, sleep: 6.5, med: true, sob: false, sw: false, dz: false, ch: false, mood: "tired" },
      { w: 68.0, sys: 134, dia: 81, hr: 75, steps: 1700, sleep: 6.4, med: true, sob: false, sw: false, dz: false, ch: false, mood: "tired", note: "Less steady walking today." },
      { w: 68.1, sys: 133, dia: 80, hr: 74, steps: 1600, sleep: 6.5, med: true, sob: false, sw: false, dz: false, ch: false, mood: "tired" },
      { w: 68.0, sys: 132, dia: 81, hr: 76, steps: 1500, sleep: 6.3, med: true, sob: false, sw: false, dz: false, ch: false, mood: "low energy" },
    ],
  },
  {
    patient: {
      id: "patient-mrs-lam",
      name: "Mrs. Lam",
      age: 84,
      gender: "female",
      language: "Cantonese",
      living_status: "lives in care home",
      conditions: ["kidney disease", "hypertension"],
      caregiver_name: "Care home staff",
      caregiver_phone: "+852 9567 8901",
      assigned_nurse: "Nurse Wong",
      baseline_weight: 54.0,
      baseline_steps: 2200,
    },
    rows: [
      { w: 54.0, sys: 142, dia: 84, hr: 74, steps: 2150, sleep: 7.0, med: true, sob: false, sw: false, dz: false, ch: false, mood: "good" },
      { w: 54.1, sys: 140, dia: 83, hr: 73, steps: 2200, sleep: 7.1, med: true, sob: false, sw: false, dz: false, ch: false, mood: "good" },
      { w: 53.9, sys: 144, dia: 85, hr: 75, steps: 2100, sleep: 6.9, med: true, sob: false, sw: false, dz: false, ch: false, mood: "good" },
      { w: 54.0, sys: 138, dia: 82, hr: 74, steps: 2250, sleep: 7.0, med: true, sob: false, sw: false, dz: false, ch: false, mood: "good" },
      { w: 54.2, sys: 146, dia: 86, hr: 76, steps: 2200, sleep: 7.2, med: true, sob: false, sw: false, dz: false, ch: false, mood: "good" },
      { w: 54.0, sys: 143, dia: 84, hr: 75, steps: 2180, sleep: 7.0, med: true, sob: false, sw: false, dz: false, ch: false, mood: "good" },
      { w: 54.1, sys: 141, dia: 83, hr: 74, steps: 2210, sleep: 7.1, med: true, sob: false, sw: false, dz: false, ch: false, mood: "good" },
    ],
  },
];

function shortId(patientId: string): string {
  return patientId.replace(/^patient-/, "");
}

function vital(
  patientId: string,
  date: string,
  type: VitalType,
  value: number,
): VitalReading {
  return {
    id: `vital-${shortId(patientId)}-${date}-${type}`,
    patient_id: patientId,
    timestamp: `${date}T09:00:00Z`,
    type,
    value,
    unit: UNIT[type],
    source: "mock",
  };
}

/** Build a fresh, deterministic copy of the full demo dataset. */
export function buildSeed(): SeedDataset {
  const patients: Patient[] = [];
  const vitals: VitalReading[] = [];
  const checkins: DailyCheckIn[] = [];

  for (const def of PATIENT_DEFS) {
    patients.push({ ...def.patient, conditions: [...def.patient.conditions] });
    def.rows.forEach((row, i) => {
      const date = DEMO_DATES[i];
      const pid = def.patient.id;
      vitals.push(
        vital(pid, date, "weight", row.w),
        vital(pid, date, "blood_pressure_systolic", row.sys),
        vital(pid, date, "blood_pressure_diastolic", row.dia),
        vital(pid, date, "heart_rate", row.hr),
        vital(pid, date, "steps", row.steps),
        vital(pid, date, "sleep_hours", row.sleep),
      );
      if (!row.skipCheckin) {
        checkins.push({
          id: `checkin-${shortId(pid)}-${date}`,
          patient_id: pid,
          date,
          mood: row.mood,
          shortness_of_breath: row.sob,
          swelling: row.sw,
          dizziness: row.dz,
          chest_discomfort: row.ch,
          medication_taken: row.med,
          free_text_note: row.note ?? null,
          source: "simulated_call",
        });
      }
    });
  }

  return { patients, vitals, checkins };
}

/** Canonical "risky check-in" scenario for the demo replay button. */
export const RISKY_CHECKIN_PATIENT_ID = "patient-mrs-chan";
