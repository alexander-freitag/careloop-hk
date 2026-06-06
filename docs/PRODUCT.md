# CareLoop — Product & Architecture (team brief)

_Last updated for the WhatsApp check-in agent. Read this to understand what the
product is, how it works, and how to run the demo._

## 1. What CareLoop is

Remote chronic-care monitoring for elderly Hong Kong patients, between clinic
visits. The insight: **the problem isn't monitoring — it's adherence.** Most
tools expect an 80-year-old to open another app and fill a form every day. They
won't. So CareLoop meets them where they already talk to family: **WhatsApp**.

> Patient replies to a daily WhatsApp (text or Cantonese voice note) → AI turns
> it into structured data → deterministic rules decide if a nurse should review →
> caregiver alert + nurse queue. **Normal days stay quiet. Concerning patterns
> become review tasks.**

**Not** an AI doctor: no diagnosis, no prescription, no triage. AI handles
language; deterministic rules decide severity (see `HONESTY.md`).

## 2. End-to-end flow

```
CareLoop sends daily check-in (WhatsApp, scheduled or button)
        ↓
Patient replies — text or Cantonese voice note
        ↓
[voice] Whisper STT → text                         lib/stt.ts
        ↓
Claude extracts symptoms → JSON (no severity!)     lib/symptomExtraction.ts
        ↓
Merge into the day's session; ask AI-written        lib/conversation.ts
follow-up if info is still missing (multi-turn)     lib/followup.ts
        ↓
Deterministic risk engine decides severity          lib/riskEngine.ts
        ↓
Nurse review queue · caregiver alert · audit · FHIR export · weekly summary
```

The agent **accumulates the check-in step by step** until the required fields are
filled, or **escalates immediately** on a red-flag symptom. Replies go back in
the patient's language. Confirmations and follow-ups are **written by Claude**
(fixed templates only as a crash-safe fallback).

## 3. AI vs deterministic (the safety line)

| AI (language) | Deterministic (decisions) |
| --- | --- |
| Whisper: voice → text | Extraction schema (which fields exist) |
| Claude: text → structured symptoms (JSON) | Risk engine: severity + matched rules |
| Claude: follow-up + confirmation wording | Policy: required fields, completeness, red-flag |

Severity is **never** AI-decided — it's auditable rules, so every alert shows the
rule + evidence.

## 4. Risk rules (`lib/riskEngine.ts`)

| Rule | Condition | Severity |
| --- | --- | --- |
| HF-001 | weight ↑ ≥ 2 kg / 3 days | Review today |
| HF-002 | weight gain + breathlessness + swelling | Escalate |
| MED-001 | medication missed 2 days in a row | Review today |
| BP-001 | systolic > 180 or diastolic > 110 | Escalate |
| ACT-001 | activity > 40% below baseline / 3 days | Watch |
| SYM-001 | reports breathlessness / swelling / chest discomfort | Review today |

`SYM-001` ensures a symptomatic patient always reaches the queue even when the
weight/BP rules don't fire (e.g. a COPD patient reporting breathlessness).

## 5. Key files

```
lib/
  whatsapp.ts          outbound send via Twilio REST
  agent.ts             sendDailyCheckIn(patient) + sendDailyCheckInRound()
  scheduler.ts         in-process daily scheduler (instrumentation.ts boots it)
  stt.ts               Whisper STT (Groq / OpenAI), pinned fallback
  symptomExtraction.ts Claude: message → structured JSON (+ keyword fallback)
  conversation.ts      sessions, message thread, required-fields, sender→patient
  followup.ts          Claude: follow-up questions + closing messages
  ingest.ts            the pipeline that ties it all together
  riskEngine.ts        deterministic severity (unit-tested)
app/api/
  whatsapp/inbound     Twilio inbound webhook
  agent/send-checkin   trigger one patient's daily check-in (POST {patientId})
  agent/send-round     "morning round": message every known number
  patients/[id]/messages   the conversation thread (polled by the panel)
components/
  ConversationPanel.tsx   live WhatsApp thread + extraction chips
  DemoControls.tsx        Reset · Daily check-in · Generate summary · Run risky
```

## 6. Run the demo locally

```bash
npm install
npm run dev            # http://localhost:3000  (use -p 3002 if 3000 is taken)
npm test               # risk-engine unit tests
```

**Env (`.env.local`, gitignored — never commit keys):**

| Var | Purpose |
| --- | --- |
| `ANTHROPIC_API_KEY` | extraction + agent message wording (required for the smart agent) |
| `GROQ_API_KEY` | Cantonese STT for voice notes (else pinned fallback) |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` | download voice media + outbound send |
| `CARELOOP_DEMO_PATIENT_PHONE` | outbound target if a patient's number isn't captured |
| `CARELOOP_WHATSAPP_PATIENT` | pin ALL inbound to one patient (presenter demo). Unset → sticky auto-assign per number (multi-judge) |
| `CARELOOP_CHECKIN_TIME` / `CARELOOP_TZ` | scheduler time (e.g. `08:00`, `Asia/Hong_Kong`); unset = off |

**Wire WhatsApp (Twilio sandbox):**
1. Expose the app: `cloudflared tunnel --url http://localhost:3000`
2. Twilio console → Messaging → WhatsApp sandbox settings → **When a message comes in** = `https://<tunnel>/api/whatsapp/inbound`, method **POST**.
3. From your phone, send `join <your-sandbox-code>` to the Twilio WhatsApp number.
4. Message it (e.g. "今日有啲氣促，對腳腫咗，冇食藥") → watch the dashboard.

**Important:** the live agent needs the app reachable from one shared instance
(the tunnel). It does **not** work on multi-instance Vercel without a shared
store (in-memory state isn't shared across lambdas).

## 7. Demo runbook (on stage)

1. Reset demo. Open the nurse dashboard (exception-first).
2. Click **Daily check-in** (or per-patient **Send check-in**) → patient's
   WhatsApp gets the morning prompt.
3. Reply on the phone (text or Cantonese voice note) describing symptoms.
4. Agent processes → confirmation back in WhatsApp; dashboard lights up live
   (Escalate / Review today), with the conversation panel + matched-rule evidence.
5. Show caregiver alert (EN / 繁中), weekly summary + PDF, FHIR export, Honesty page.

> For escalation, demo with **Mrs. Chan** (weight-driven). For the conversational
> follow-up loop, use a stable patient (e.g. Mrs. Wong).

## 8. What's mocked / limitations

See **`HONESTY.md`** — Twilio sandbox (not WhatsApp Business API), pinned STT
fallback without a key, in-memory store (single instance), no real device/EHR
integration, no clinical validation. Severity stays deterministic and auditable.
