import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import { buildFhirBundle } from "./fhirService";
import { parseVitalsCsv } from "./csv";
import { buildSeed } from "./seed";
import {
  getAlerts,
  getAuditEvents,
  getPatientRows,
  getTimeline,
  resetDemo,
  runRiskyCheckIn,
  updateAlert,
} from "./store";
import type { VitalType } from "./types";
import { toDailyVitals } from "./vitals";

// The store is a globalThis singleton — start every test from a clean seed.
beforeEach(() => resetDemo());

const VITAL_TYPES: VitalType[] = [
  "weight",
  "blood_pressure_systolic",
  "blood_pressure_diastolic",
  "heart_rate",
  "steps",
  "sleep_hours",
];

// --- minimal FHIR shapes for typed assertions (avoid `any`) ---
interface FhirResource {
  resourceType: string;
  id: string;
  subject?: { reference: string };
  gender?: string;
  birthDate?: string;
}
interface FhirBundle {
  resourceType: string;
  id: string;
  type: string;
  timestamp: string;
  entry: { fullUrl: string; resource: FhirResource }[];
}

describe("seed integrity", () => {
  const seed = buildSeed();
  const byId = Object.fromEntries(seed.patients.map((p) => [p.id, p]));

  it("has 5 patients with the exact baselines, nurses, and conditions", () => {
    expect(seed.patients).toHaveLength(5);

    const chan = byId["patient-mrs-chan"];
    expect(chan.age).toBe(78);
    expect(chan.baseline_weight).toBe(62.0);
    expect(chan.baseline_steps).toBe(3500);
    expect(chan.assigned_nurse).toBe("Nurse Lee");
    expect(chan.conditions).toEqual(["heart failure", "hypertension"]);

    expect(byId["patient-mr-lee"].baseline_steps).toBe(4200);
    expect(byId["patient-mr-lee"].assigned_nurse).toBe("Nurse Wong");
    expect(byId["patient-mrs-wong"].baseline_steps).toBe(2800);
    expect(byId["patient-mr-ho"].baseline_steps).toBe(3000);
    expect(byId["patient-mr-ho"].assigned_nurse).toBe("Nurse Chan");
    expect(byId["patient-mrs-lam"].baseline_steps).toBe(2200);

    for (const p of seed.patients) {
      expect(p.caregiver_name).toBeTruthy();
      expect(p.assigned_nurse).toBeTruthy();
      expect(p.baseline_steps).toBeGreaterThan(0);
    }
  });

  it("gives every patient 7 days of each vital type", () => {
    for (const p of seed.patients) {
      const v = seed.vitals.filter((x) => x.patient_id === p.id);
      for (const type of VITAL_TYPES) {
        expect(v.filter((x) => x.type === type)).toHaveLength(7);
      }
    }
  });

  it("Mr. Lee is missing today's check-in (6 records); others have 7", () => {
    expect(seed.checkins.filter((c) => c.patient_id === "patient-mr-lee")).toHaveLength(6);
    expect(seed.checkins.filter((c) => c.patient_id === "patient-mrs-chan")).toHaveLength(7);
  });

  it("references only synthetic, known patient ids", () => {
    const ids = new Set(seed.patients.map((p) => p.id));
    expect(seed.vitals.every((v) => ids.has(v.patient_id))).toBe(true);
    expect(seed.checkins.every((c) => ids.has(c.patient_id))).toBe(true);
  });
});

describe("demo reset is deterministic and reproducible", () => {
  it("restores the same dashboard state every time", () => {
    resetDemo();
    const a = getPatientRows().map((r) => [r.patient.id, r.risk.severity]);
    resetDemo();
    const b = getPatientRows().map((r) => [r.patient.id, r.risk.severity]);
    expect(b).toEqual(a);

    const sev = Object.fromEntries(getPatientRows().map((r) => [r.patient.id, r.risk.severity]));
    expect(sev["patient-mrs-chan"]).toBe("escalate");
    expect(sev["patient-mr-lee"]).toBe("watch");
    expect(sev["patient-mrs-wong"]).toBe("stable");
    expect(sev["patient-mr-ho"]).toBe("watch");
    expect(sev["patient-mrs-lam"]).toBe("stable");
  });

  it("shows 4 check-ins today (Mr. Lee missed his)", () => {
    const rows = getPatientRows();
    const dates = rows.map((r) => r.last_checkin_date).filter(Boolean).sort() as string[];
    const latest = dates[dates.length - 1];
    expect(rows.filter((r) => r.last_checkin_date === latest)).toHaveLength(4);
    const lee = rows.find((r) => r.patient.id === "patient-mr-lee")!;
    expect(lee.last_checkin_date).not.toBe(latest);
  });
});

describe("risky check-in replay", () => {
  it("escalates Mrs. Chan with HF-001 + HF-002 and creates an alert", () => {
    const res = runRiskyCheckIn();
    expect(res).not.toBeNull();
    expect(res!.risk.severity).toBe("escalate");
    const codes = res!.risk.matched_rules.map((m) => m.code);
    expect(codes).toContain("HF-001");
    expect(codes).toContain("HF-002");
    expect(res!.checkin.shortness_of_breath).toBe(true);
    expect(res!.checkin.swelling).toBe(true);
    expect(res!.checkin.medication_taken).toBe(false);
    expect(
      getAlerts().some((a) => a.patient_id === "patient-mrs-chan" && a.severity === "escalate"),
    ).toBe(true);
  });
});

describe("sample CSV round-trips to the seed", () => {
  it("reproduces Mrs. Chan's seeded vitals and symptoms", () => {
    const csv = readFileSync("sample_data/mrs_chan_vitals.csv", "utf8");
    const rows = parseVitalsCsv(csv);
    expect(rows).toHaveLength(7);

    const seed = buildSeed();
    const daily = toDailyVitals(seed.vitals.filter((v) => v.patient_id === "patient-mrs-chan"));
    const dailyByDate = Object.fromEntries(daily.map((d) => [d.date, d]));
    const checkinsByDate = Object.fromEntries(
      seed.checkins.filter((c) => c.patient_id === "patient-mrs-chan").map((c) => [c.date, c]),
    );

    for (const r of rows) {
      const d = dailyByDate[r.date];
      expect(d).toBeTruthy();
      expect(r.weight_kg).toBe(d.weight);
      expect(r.systolic_bp).toBe(d.systolic);
      expect(r.diastolic_bp).toBe(d.diastolic);
      expect(r.heart_rate).toBe(d.heart_rate);
      expect(r.steps).toBe(d.steps);
      expect(r.sleep_hours).toBe(d.sleep_hours);

      const c = checkinsByDate[r.date];
      expect(r.medication_taken).toBe(c.medication_taken);
      expect(r.shortness_of_breath).toBe(c.shortness_of_breath);
      expect(r.swelling).toBe(c.swelling);
    }
  });
});

describe("FHIR-style export", () => {
  it("builds a credible, structurally consistent bundle", () => {
    const timeline = getTimeline("patient-mrs-chan")!;
    const bundle = buildFhirBundle(timeline) as unknown as FhirBundle;

    expect(bundle.resourceType).toBe("Bundle");
    expect(bundle.type).toBe("collection");
    expect(typeof bundle.id).toBe("string");
    expect(typeof bundle.timestamp).toBe("string");

    const resources = bundle.entry.map((e) => e.resource);
    const types = resources.map((r) => r.resourceType);
    expect(types).toContain("Patient");
    expect(types.filter((t) => t === "Observation").length).toBeGreaterThanOrEqual(4);
    expect(types).toContain("QuestionnaireResponse");
    expect(types).toContain("ServiceRequest");

    const patient = resources.find((r) => r.resourceType === "Patient")!;
    expect(patient.gender).toBe("female");
    expect(patient.birthDate).toBe("1948-01-01");

    // every subject reference resolves to the patient
    const patientRef = `Patient/${patient.id}`;
    for (const r of resources) {
      if (r.subject) expect(r.subject.reference).toBe(patientRef);
    }
    // fullUrl and resource.id stay consistent
    for (const e of bundle.entry) {
      expect(e.fullUrl.split("/").pop()).toBe(e.resource.id);
    }
  });
});

describe("audit events", () => {
  it("emits the required actions with the correct shape", () => {
    runRiskyCheckIn();
    const actions = getAuditEvents().map((e) => e.action);
    expect(actions).toContain("risk_evaluated");
    expect(actions).toContain("alert_created"); // from the reset/seed
    expect(actions).toContain("checkin_submitted");
    expect(actions).toContain("risky_checkin_replayed");

    const event = getAuditEvents()[0];
    for (const key of ["id", "actor", "action", "target_type", "target_id", "metadata", "created_at"]) {
      expect(event).toHaveProperty(key);
    }
  });

  it("logs alert_acknowledged when a nurse acknowledges", () => {
    const chanAlert = getAlerts().find((a) => a.patient_id === "patient-mrs-chan");
    expect(chanAlert).toBeTruthy();
    updateAlert(chanAlert!.id, { status: "acknowledged" });
    expect(getAuditEvents().map((e) => e.action)).toContain("alert_acknowledged");
  });
});
