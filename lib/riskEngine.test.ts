import { describe, expect, it } from "vitest";
import { evaluateRisk } from "./riskEngine";
import { buildSeed } from "./seed";
import type { DailyCheckIn, Patient, VitalReading } from "./types";

// --- test helpers --------------------------------------------------------

function patient(overrides: Partial<Patient> = {}): Patient {
  return {
    id: "patient-test",
    name: "Test Patient",
    age: 75,
    gender: "female",
    language: "Cantonese",
    living_status: "lives alone",
    conditions: ["heart failure"],
    caregiver_name: "Caregiver",
    caregiver_phone: "+852 0000 0000",
    assigned_nurse: "Nurse Test",
    baseline_weight: 60,
    baseline_steps: 3000,
    ...overrides,
  };
}

interface Row {
  date: string;
  weight?: number;
  sys?: number;
  dia?: number;
  hr?: number;
  steps?: number;
}

function vitalsFrom(pid: string, rows: Row[]): VitalReading[] {
  const out: VitalReading[] = [];
  for (const r of rows) {
    const add = (type: VitalReading["type"], value: number | undefined, unit: string) => {
      if (value !== undefined)
        out.push({
          id: `${pid}-${r.date}-${type}`,
          patient_id: pid,
          timestamp: `${r.date}T09:00:00Z`,
          type,
          value,
          unit,
          source: "mock",
        });
    };
    add("weight", r.weight, "kg");
    add("blood_pressure_systolic", r.sys, "mmHg");
    add("blood_pressure_diastolic", r.dia, "mmHg");
    add("heart_rate", r.hr, "bpm");
    add("steps", r.steps, "steps");
  }
  return out;
}

function checkin(pid: string, date: string, o: Partial<DailyCheckIn> = {}): DailyCheckIn {
  return {
    id: `c-${pid}-${date}`,
    patient_id: pid,
    date,
    mood: "ok",
    shortness_of_breath: false,
    swelling: false,
    dizziness: false,
    chest_discomfort: false,
    medication_taken: true,
    free_text_note: null,
    source: "web_form",
    ...o,
  };
}

const D = ["2026-06-01", "2026-06-02", "2026-06-03", "2026-06-04"];

function codes(result: ReturnType<typeof evaluateRisk>): string[] {
  return result.matched_rules.map((m) => m.code).sort();
}

// --- spec test cases -----------------------------------------------------

describe("risk engine — spec test cases", () => {
  it("Stable: normal vitals, no symptoms, medication taken → stable, no rules", () => {
    const p = patient({ baseline_steps: 3000 });
    const vitals = vitalsFrom(p.id, [
      { date: D[0], weight: 60.0, sys: 122, dia: 78, hr: 72, steps: 3000 },
      { date: D[1], weight: 60.1, sys: 124, dia: 79, hr: 73, steps: 3050 },
      { date: D[2], weight: 60.0, sys: 121, dia: 77, hr: 72, steps: 2950 },
      { date: D[3], weight: 60.1, sys: 123, dia: 78, hr: 74, steps: 3010 },
    ]);
    const checkins = D.map((d) => checkin(p.id, d));
    const r = evaluateRisk(p, vitals, checkins);
    expect(r.severity).toBe("stable");
    expect(r.matched_rules).toHaveLength(0);
  });

  it("Watch: activity down ~45% for 3 days → watch, ACT-001", () => {
    const p = patient({ baseline_steps: 4000 });
    const vitals = vitalsFrom(p.id, [
      { date: D[0], weight: 60.0, sys: 122, dia: 78, hr: 72, steps: 4000 },
      { date: D[1], weight: 60.0, sys: 123, dia: 79, hr: 73, steps: 2200 },
      { date: D[2], weight: 60.1, sys: 121, dia: 77, hr: 72, steps: 2100 },
      { date: D[3], weight: 60.0, sys: 123, dia: 78, hr: 74, steps: 2000 },
    ]);
    const checkins = D.map((d) => checkin(p.id, d));
    const r = evaluateRisk(p, vitals, checkins);
    expect(r.severity).toBe("watch");
    expect(codes(r)).toEqual(["ACT-001"]);
  });

  it("Review today: weight up ≥2kg in 3 days → review_today, HF-001", () => {
    const p = patient({ baseline_steps: 3000 });
    const vitals = vitalsFrom(p.id, [
      { date: D[0], weight: 60.0, sys: 122, dia: 78, hr: 72, steps: 3000 },
      { date: D[1], weight: 60.2, sys: 123, dia: 79, hr: 73, steps: 3050 },
      { date: D[2], weight: 60.8, sys: 121, dia: 77, hr: 72, steps: 2950 },
      { date: D[3], weight: 62.1, sys: 123, dia: 78, hr: 74, steps: 3010 },
    ]);
    const checkins = D.map((d) => checkin(p.id, d));
    const r = evaluateRisk(p, vitals, checkins);
    expect(r.severity).toBe("review_today");
    expect(codes(r)).toEqual(["HF-001"]);
  });

  it("Escalate: weight up ≥2kg + SOB + swelling → escalate, HF-001 + HF-002", () => {
    const p = patient({ baseline_steps: 3000 });
    const vitals = vitalsFrom(p.id, [
      { date: D[0], weight: 60.0, sys: 122, dia: 78, hr: 72, steps: 3000 },
      { date: D[1], weight: 60.2, sys: 123, dia: 79, hr: 73, steps: 3050 },
      { date: D[2], weight: 60.8, sys: 121, dia: 77, hr: 72, steps: 2950 },
      { date: D[3], weight: 62.1, sys: 123, dia: 78, hr: 74, steps: 3010 },
    ]);
    const checkins = D.map((d, i) =>
      i === D.length - 1
        ? checkin(p.id, d, { shortness_of_breath: true, swelling: true })
        : checkin(p.id, d),
    );
    const r = evaluateRisk(p, vitals, checkins);
    expect(r.severity).toBe("escalate");
    expect(codes(r)).toEqual(["HF-001", "HF-002", "SYM-001"]);
  });

  it("Reported symptoms without weight gain → review_today, SYM-001", () => {
    const p = patient({ conditions: ["COPD"], baseline_steps: 2800 });
    const vitals = vitalsFrom(p.id, [
      { date: D[0], weight: 58, sys: 128, dia: 78, hr: 76, steps: 2800 },
      { date: D[1], weight: 58, sys: 128, dia: 78, hr: 76, steps: 2800 },
      { date: D[2], weight: 58.1, sys: 128, dia: 78, hr: 76, steps: 2800 },
      { date: D[3], weight: 58, sys: 128, dia: 78, hr: 76, steps: 2800 },
    ]);
    const checkins = D.map((d, i) =>
      i === D.length - 1
        ? checkin(p.id, d, { shortness_of_breath: true, swelling: true })
        : checkin(p.id, d),
    );
    const r = evaluateRisk(p, vitals, checkins);
    expect(r.severity).toBe("review_today");
    expect(codes(r)).toContain("SYM-001");
  });

  it("High BP: systolic > 180 → escalate, BP-001", () => {
    const p = patient({ baseline_steps: 3000 });
    const vitals = vitalsFrom(p.id, [
      { date: D[0], weight: 60.0, sys: 130, dia: 82, hr: 72, steps: 3000 },
      { date: D[1], weight: 60.0, sys: 135, dia: 84, hr: 73, steps: 3050 },
      { date: D[2], weight: 60.1, sys: 150, dia: 90, hr: 72, steps: 2950 },
      { date: D[3], weight: 60.0, sys: 185, dia: 98, hr: 74, steps: 3010 },
    ]);
    const checkins = D.map((d) => checkin(p.id, d));
    const r = evaluateRisk(p, vitals, checkins);
    expect(r.severity).toBe("escalate");
    expect(codes(r)).toContain("BP-001");
  });

  it("High BP: diastolic > 110 → escalate, BP-001", () => {
    const p = patient();
    const vitals = vitalsFrom(p.id, [
      { date: D[2], weight: 60.1, sys: 150, dia: 100, hr: 72, steps: 3000 },
      { date: D[3], weight: 60.0, sys: 160, dia: 112, hr: 74, steps: 3010 },
    ]);
    const r = evaluateRisk(p, vitals, [checkin(p.id, D[3])]);
    expect(r.severity).toBe("escalate");
    expect(codes(r)).toContain("BP-001");
  });

  it("Medication missed 2 days in a row → review_today, MED-001", () => {
    const p = patient({ baseline_steps: 3000 });
    const vitals = vitalsFrom(p.id, [
      { date: D[0], weight: 60.0, sys: 122, dia: 78, hr: 72, steps: 3000 },
      { date: D[1], weight: 60.0, sys: 123, dia: 79, hr: 73, steps: 3050 },
      { date: D[2], weight: 60.1, sys: 121, dia: 77, hr: 72, steps: 2950 },
      { date: D[3], weight: 60.0, sys: 123, dia: 78, hr: 74, steps: 3010 },
    ]);
    const checkins = [
      checkin(p.id, D[0]),
      checkin(p.id, D[1]),
      checkin(p.id, D[2], { medication_taken: false }),
      checkin(p.id, D[3], { medication_taken: false }),
    ];
    const r = evaluateRisk(p, vitals, checkins);
    expect(r.severity).toBe("review_today");
    expect(codes(r)).toEqual(["MED-001"]);
  });
});

// --- seed integration: severities must fall out of the engine ------------

describe("seed dataset drives the intended dashboard states", () => {
  const seed = buildSeed();
  const evalFor = (pid: string) => {
    const p = seed.patients.find((x) => x.id === pid)!;
    return evaluateRisk(
      p,
      seed.vitals.filter((v) => v.patient_id === pid),
      seed.checkins.filter((c) => c.patient_id === pid),
    );
  };

  it("Mrs. Chan → escalate, matching HF-001 and HF-002", () => {
    const r = evalFor("patient-mrs-chan");
    expect(r.severity).toBe("escalate");
    expect(codes(r)).toContain("HF-001");
    expect(codes(r)).toContain("HF-002");
  });

  it("Mr. Lee → watch (ACT-001)", () => {
    const r = evalFor("patient-mr-lee");
    expect(r.severity).toBe("watch");
    expect(codes(r)).toContain("ACT-001");
  });

  it("Mr. Ho → watch (ACT-001)", () => {
    const r = evalFor("patient-mr-ho");
    expect(r.severity).toBe("watch");
    expect(codes(r)).toContain("ACT-001");
  });

  it("Mrs. Wong → stable", () => {
    expect(evalFor("patient-mrs-wong").severity).toBe("stable");
  });

  it("Mrs. Lam → stable", () => {
    expect(evalFor("patient-mrs-lam").severity).toBe("stable");
  });
});

// --- date-aware windows & raw-threshold comparison (audit fixes) ----------

describe("risk engine — date-aware windows & raw thresholds", () => {
  it("a 1.95 kg gain over 3 days does NOT fire HF-001 (compares raw, not rounded)", () => {
    const p = patient({ baseline_steps: 3000 });
    const v = vitalsFrom(p.id, [
      { date: "2026-06-01", weight: 60.0, steps: 3000 },
      { date: "2026-06-02", weight: 60.5, steps: 3000 },
      { date: "2026-06-03", weight: 61.0, steps: 3000 },
      { date: "2026-06-04", weight: 61.95, steps: 3000 },
    ]);
    const c = ["2026-06-01", "2026-06-02", "2026-06-03", "2026-06-04"].map((d) => checkin(p.id, d));
    expect(codes(evaluateRisk(p, v, c))).not.toContain("HF-001");
  });

  it("a 2.0 kg gain over 3 days DOES fire HF-001", () => {
    const p = patient({ baseline_steps: 3000 });
    const v = vitalsFrom(p.id, [
      { date: "2026-06-01", weight: 60.0, steps: 3000 },
      { date: "2026-06-02", weight: 60.5, steps: 3000 },
      { date: "2026-06-03", weight: 61.0, steps: 3000 },
      { date: "2026-06-04", weight: 62.0, steps: 3000 },
    ]);
    const c = ["2026-06-01", "2026-06-02", "2026-06-03", "2026-06-04"].map((d) => checkin(p.id, d));
    expect(codes(evaluateRisk(p, v, c))).toContain("HF-001");
  });

  it("a big weight jump across a 7-day gap does NOT fire HF-001 (no ~3-day anchor)", () => {
    const p = patient({ baseline_steps: 3000 });
    const v = vitalsFrom(p.id, [
      { date: "2026-06-01", weight: 60.0 },
      { date: "2026-06-08", weight: 62.5 },
    ]);
    expect(codes(evaluateRisk(p, v, [checkin(p.id, "2026-06-08")]))).not.toContain("HF-001");
  });

  it("missed meds on NON-consecutive days does NOT fire MED-001", () => {
    const p = patient({ baseline_steps: 3000 });
    const v = vitalsFrom(p.id, [
      { date: "2026-06-01", weight: 60.0 },
      { date: "2026-06-03", weight: 60.0 },
    ]);
    const c = [
      checkin(p.id, "2026-06-01", { medication_taken: false }),
      checkin(p.id, "2026-06-03", { medication_taken: false }),
    ];
    expect(codes(evaluateRisk(p, v, c))).not.toContain("MED-001");
  });

  it("low activity on NON-consecutive days does NOT fire ACT-001", () => {
    const p = patient({ baseline_steps: 4000 });
    const v = vitalsFrom(p.id, [
      { date: "2026-06-01", weight: 60.0, steps: 2000 },
      { date: "2026-06-02", weight: 60.0, steps: 2000 },
      { date: "2026-06-04", weight: 60.0, steps: 2000 },
    ]);
    const c = ["2026-06-01", "2026-06-02", "2026-06-04"].map((d) => checkin(p.id, d));
    expect(codes(evaluateRisk(p, v, c))).not.toContain("ACT-001");
  });
});
