# CareLoop — 3-Minute Demo Script

**Before you start:** click **Reset demo** in the header so the demo always begins from the same
clean state.

Flow:

1. Intro page → 2. Nurse dashboard → 3. Open Mrs. Chan → 4. Worsening charts →
5. Run risky check-in → 6. Matched rules → 7. Nurse alert queue → 8. Caregiver alert →
9. Weekly summary → 10. FHIR export → 11. Honesty.

---

### 0:00–0:20 — Intro

> "CareLoop is a remote chronic-care monitoring platform for elderly Hong Kong patients. We focus
> first on heart-failure and hypertension patients between clinic visits."

Show the landing page. Click **Start demo**.

### 0:20–0:50 — Nurse dashboard

> "This is the nurse dashboard. It shows elderly patients, their latest check-in, risk state, and the
> top reason for review. The colours and severity come from a deterministic rule engine."

Point to Mrs. Chan (Escalate). Use the filter tabs to show Stable / Watch / Escalate.

### 0:50–1:25 — Patient timeline

Open Mrs. Chan.

> "CareLoop isn't waiting for one dramatic emergency. It combines small signals over time — weight,
> blood pressure, symptoms, medication adherence, and activity."

Show the weight chart rising toward the baseline line, activity dropping below the −40% line.

### 1:25–2:00 — Run risky check-in

Click **Run risky check-in** in the header (jumps to Mrs. Chan).

> "Now Mrs. Chan reports shortness of breath and swelling, and her weight is up more than 2 kg in
> three days. CareLoop does not ask an LLM to decide severity — the rule engine matched HF-001 and
> HF-002, so the case is escalated."

Show the Risk assessment card with matched rules + evidence.

### 2:00–2:30 — Nurse queue & caregiver alert

Go to **Alerts**.

> "The alert enters the nurse queue with the matched rules, evidence, and suggested owner. The nurse
> can acknowledge it and add a note."

Acknowledge it. Back on Mrs. Chan, show the **Caregiver alert** — toggle EN / 繁中.

> "The family gets a plain-language message in English or Traditional Chinese. It says what changed
> and that nurse review is recommended — no treatment instructions."

### 2:30–2:50 — Summary & FHIR

Click **Generate summary**, then **Download PDF**. Then **Export FHIR bundle**.

> "At the end of the week, CareLoop generates a clinician-ready summary, exports a PDF, and a
> FHIR-style bundle — designed to fit healthcare workflows, not become another isolated app."

### 2:50–3:00 — Honesty

Open **Honesty**.

> "Our Honesty page explains what's real, what's mocked, and the safety boundaries. This is
> monitoring support — not diagnosis."
