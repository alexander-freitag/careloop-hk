# HONESTY.md — CareLoop

CareLoop is a **prototype** for remote chronic-care monitoring among elderly
patients in Hong Kong. It uses daily check-ins, vital/wearable sample
data, and **deterministic** escalation rules to identify patients who may need
nurse review.

AI is used **only** for summarisation and caregiver-friendly wording.

**CareLoop does not diagnose, prescribe, or replace clinical judgement.**

---

## What is real (implemented in this prototype)

- Nurse dashboard with 5 synthetic patients, filters, and risk/reason badges
- Patient detail timeline — weight, blood pressure, heart rate, activity charts
- Daily check-in simulation (Cantonese + English) that creates check-in records
- **Deterministic, rule-based risk engine** (`lib/riskEngine.ts`) — see rules below
- Matched-rule explanations with the data evidence that triggered each rule
- Nurse review queue with acknowledge, status workflow, and nurse notes
- Bilingual caregiver alert (English + Traditional Chinese 繁體中文)
- Weekly clinician summary generation
- PDF export of the weekly summary (server-rendered)
- FHIR-style JSON export (Patient, Observations, QuestionnaireResponse, ServiceRequest)
- Append-only audit events for every monitoring action
- Demo reset and a one-click "risky check-in" replay
- CSV import of wearable/vital data

The rule engine is covered by unit tests (`lib/riskEngine.test.ts`) that assert
every severity outcome — severity is computed, never hard-coded.

## What is mocked or simulated

- **Real Twilio phone calls** — the daily call is a simulated on-screen flow
- **Real Apple Health / Fitbit / Garmin device integration** — sample CSV / seed data is used instead
- **Real Hong Kong eHealth+ integration**
- **Real hospital EHR integration**
- **Real clinical validation** of the thresholds
- **Real Cantonese clinical review**
- **Real emergency escalation** and nurse staffing workflow
- **Production identity, access control, and security review**
- **The data store is in-memory demo state.** It is seeded deterministically and
  resets on server restart / serverless cold start. It is not a production
  database. Because the seed and the demo actions are deterministic, the demo is
  reproducible (and always start a demo with "Reset demo data").

## AI usage

AI (Anthropic Claude) is used **only** to reword the weekly clinician summary
into plainer prose. It is gated behind `ANTHROPIC_API_KEY`. If no key is set, or
the call fails, CareLoop returns a **deterministic template** instead — so the
product never depends on AI to function.

AI is **never** used for:

- Diagnosis
- Treatment or medication recommendations
- Emergency triage
- **Risk severity classification** (this is deterministic and auditable)

The AI prompt is constrained: no diagnosis, no medication changes, no invented
data, keep all figures and rule codes, and always frame output as monitoring
data for professional review.

## Risk engine (deterministic, demonstration only)

| Rule | Condition | Severity |
| --- | --- | --- |
| HF-001 | weight increase ≥ 2 kg over 3 days | Review today |
| HF-002 | weight gain (≥ 1.5 kg/3d) + shortness of breath + swelling | Escalate |
| MED-001 | medication missed 2 days in a row | Review today |
| BP-001 | systolic > 180 OR diastolic > 110 mmHg | Escalate |
| ACT-001 | activity > 40% below baseline for 3 days | Watch |

These thresholds are for demonstration and are **not clinically validated**.

## Safety boundaries

- CareLoop is **not a medical device**.
- It does **not** diagnose disease or prescribe treatment.
- It does **not** replace a doctor, nurse, pharmacist, or emergency service.
- All alerts are monitoring prompts for **professional review**.
- If a patient has severe symptoms, they should seek urgent medical care
  according to local emergency guidance.

## Data

All demo patient data is **synthetic**. No real patient, hospital, or eHealth+
data is included. No secrets are committed; AI is configured via environment
variables (`.env.example`).

## FHIR export

The FHIR-style JSON export is a prototype that demonstrates interoperability
thinking. It is **not certified** for production clinical exchange.

## Known limitations

- Synthetic demo data only; in-memory store
- Limited chronic-care rule set
- Limited patient population
- No clinical validation, regulatory approval, or production security review
- No real device or health-system integration unless separately implemented
- Not suitable for live patient care

## Why this is still useful

It demonstrates a narrow, safe, operational workflow:

```
daily elderly check-in
+ vital / wearable monitoring
+ deterministic risk rules
+ nurse review
+ caregiver alert
+ clinician summary
+ FHIR-style export
```

The goal is to show how between-visit chronic-care monitoring could become
safer, more explainable, and more operational for Hong Kong elderly care.
