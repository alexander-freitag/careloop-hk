// FHIR-style export (teammate-1 zone).
//
// Not certified production FHIR, but intentionally structured and plausible:
// a collection Bundle with Patient, Observations (weight / BP / heart rate /
// activity), a QuestionnaireResponse for the latest daily check-in, and a
// ServiceRequest for the nurse-review follow-up task.

import type { DailyVitals, PatientTimeline } from "./types";
import { series } from "./vitals";

type Json = Record<string, unknown>;

const LOINC = "http://loinc.org";
const UCUM = "http://unitsofmeasure.org";

function vitalCategory(): Json {
  return {
    coding: [
      {
        system: "http://terminology.hl7.org/CodeSystem/observation-category",
        code: "vital-signs",
        display: "Vital Signs",
      },
    ],
  };
}

export function buildFhirBundle(timeline: PatientTimeline): Json {
  const { patient, daily, checkins, risk } = timeline;
  const pid = patient.id;
  const short = pid.replace(/^patient-/, "");
  const ref = `Patient/${pid}`;
  const birthYear = 2026 - patient.age;
  const checkin = [...checkins].sort((a, b) => a.date.localeCompare(b.date)).pop();

  const entries: Json[] = [];

  entries.push({
    fullUrl: ref,
    resource: {
      resourceType: "Patient",
      id: pid,
      name: [{ text: patient.name }],
      gender: patient.gender,
      birthDate: `${birthYear}-01-01`,
      extension: [
        {
          url: "https://careloop.hk/fhir/StructureDefinition/conditions",
          valueString: patient.conditions.join(", "),
        },
        {
          url: "https://careloop.hk/fhir/StructureDefinition/assigned-nurse",
          valueString: patient.assigned_nurse,
        },
      ],
    },
  });

  // Latest reading (value + its own date) for a single-value vital.
  const lastOf = (key: "weight" | "heart_rate" | "steps") => {
    const s = series(daily, key);
    return s.length ? s[s.length - 1] : null;
  };
  const eff = (date: string) => `${date}T09:00:00Z`;

  const observation = (
    idSuffix: string,
    code: string,
    display: string,
    point: { date: string; value: number },
    unit: string,
    ucum: string,
  ): Json => ({
    fullUrl: `Observation/obs-${idSuffix}-${short}`,
    resource: {
      resourceType: "Observation",
      id: `obs-${idSuffix}-${short}`,
      status: "final",
      category: [vitalCategory()],
      code: { coding: [{ system: LOINC, code, display }], text: display },
      subject: { reference: ref },
      effectiveDateTime: eff(point.date),
      valueQuantity: { value: point.value, unit, system: UCUM, code: ucum },
    },
  });

  const weight = lastOf("weight");
  if (weight) entries.push(observation("weight", "29463-7", "Body weight", weight, "kg", "kg"));

  // Blood pressure from the most recent day that recorded it (paired, same day).
  let bpDay: DailyVitals | null = null;
  for (let i = daily.length - 1; i >= 0; i--) {
    if (daily[i].systolic !== null || daily[i].diastolic !== null) {
      bpDay = daily[i];
      break;
    }
  }
  if (bpDay) {
    entries.push({
      fullUrl: `Observation/obs-bp-${short}`,
      resource: {
        resourceType: "Observation",
        id: `obs-bp-${short}`,
        status: "final",
        category: [vitalCategory()],
        code: { coding: [{ system: LOINC, code: "85354-9", display: "Blood pressure panel" }], text: "Blood pressure" },
        subject: { reference: ref },
        effectiveDateTime: eff(bpDay.date),
        component: [
          bpDay.systolic !== null && {
            code: { coding: [{ system: LOINC, code: "8480-6", display: "Systolic blood pressure" }] },
            valueQuantity: { value: bpDay.systolic, unit: "mmHg", system: UCUM, code: "mm[Hg]" },
          },
          bpDay.diastolic !== null && {
            code: { coding: [{ system: LOINC, code: "8462-4", display: "Diastolic blood pressure" }] },
            valueQuantity: { value: bpDay.diastolic, unit: "mmHg", system: UCUM, code: "mm[Hg]" },
          },
        ].filter(Boolean),
      },
    });
  }

  const hr = lastOf("heart_rate");
  if (hr) entries.push(observation("hr", "8867-4", "Heart rate", hr, "beats/min", "/min"));

  const steps = lastOf("steps");
  if (steps)
    entries.push(observation("steps", "41950-7", "Number of steps in 24 hour Measured", steps, "steps", "{steps}"));

  if (checkin) {
    entries.push({
      fullUrl: `QuestionnaireResponse/qr-checkin-${short}`,
      resource: {
        resourceType: "QuestionnaireResponse",
        id: `qr-checkin-${short}`,
        status: "completed",
        subject: { reference: ref },
        authored: `${checkin.date}T09:00:00Z`,
        item: [
          { linkId: "mood", text: "How are you feeling today?", answer: [{ valueString: checkin.mood || "n/a" }] },
          { linkId: "shortness_of_breath", text: "Any shortness of breath?", answer: [{ valueBoolean: checkin.shortness_of_breath }] },
          { linkId: "swelling", text: "Any swelling in legs or feet?", answer: [{ valueBoolean: checkin.swelling }] },
          { linkId: "dizziness", text: "Any dizziness?", answer: [{ valueBoolean: checkin.dizziness }] },
          { linkId: "chest_discomfort", text: "Any chest discomfort?", answer: [{ valueBoolean: checkin.chest_discomfort }] },
          { linkId: "medication_taken", text: "Did you take your medicine today?", answer: [{ valueBoolean: checkin.medication_taken }] },
        ],
      },
    });
  }

  const priority =
    risk.severity === "escalate" ? "urgent" : risk.severity === "review_today" ? "asap" : "routine";
  entries.push({
    fullUrl: `ServiceRequest/sr-review-${short}`,
    resource: {
      resourceType: "ServiceRequest",
      id: `sr-review-${short}`,
      status: "active",
      intent: "plan",
      priority,
      code: {
        text:
          risk.severity === "stable"
            ? "Continue routine remote monitoring"
            : "Nurse review (remote monitoring escalation)",
      },
      subject: { reference: ref },
      reasonCode: [{ text: risk.reason }],
      note: [{ text: risk.recommended_action }],
      requester: { display: "CareLoop monitoring" },
      performer: [{ display: patient.assigned_nurse }],
    },
  });

  return {
    resourceType: "Bundle",
    id: `bundle-${short}`,
    type: "collection",
    timestamp: new Date().toISOString(),
    meta: { tag: [{ system: "https://careloop.hk/fhir", code: "demo", display: "Synthetic demo data" }] },
    entry: entries,
  };
}
