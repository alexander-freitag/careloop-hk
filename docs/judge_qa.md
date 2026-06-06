# CareLoop HK — Judge Q&A

### Is this diagnosis?

No. CareLoop does not diagnose or prescribe. It uses deterministic monitoring rules to flag when a
nurse or clinician should review a patient.

### What is real?

The dashboard, check-in simulation, rule engine, alert queue, summary generation, PDF export, and
FHIR-style export are real. Hospital/eHealth integration is mocked. See `HONESTY.md` and the
in-app Honesty page for the full split.

### Who pays?

Care agencies, elderly-care operators, private clinics, NGOs, and insurers.

### What breaks at scale?

False alarms, incomplete data, device fragmentation, and clinical liability.

### How do we handle it?

Conservative rules, nurse review, data completeness scoring, audit logs, and no diagnosis or
treatment recommendations.

### Why Hong Kong?

Hong Kong has strong ageing and chronic-disease pressure, and its health system is moving toward
stronger primary-care and eHealth infrastructure. CareLoop fits that direction by turning
between-visit monitoring into a workflow.

### Why not just a phone call?

Phone calls are unstructured and easy to miss. CareLoop turns check-ins into structured monitoring
data, matched rules, nurse tasks, caregiver alerts, and clinician-ready summaries.

### Why is this AI — and is the AI safe?

AI is used where it is safe: summarising monitoring data and rewording it for caregivers and
clinicians. The risk logic is deterministic and auditable. The summary prompt forbids diagnosis,
medication changes, and inventing data — and if no API key is present, a deterministic template is
used instead, so the product never depends on the model.

### How do you avoid alarm fatigue?

Conservative, explainable thresholds; severity tiers (Stable / Watch / Review today / Escalate);
every alert shows the matched rule and the evidence so a nurse can triage quickly.
