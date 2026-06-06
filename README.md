# CareLoop

**Remote chronic-care monitoring for elderly Hong Kong patients — between clinic visits.**

> CareLoop watches the gaps between visits.

CareLoop turns daily Cantonese check-ins, wearable/vital data, and **deterministic** escalation
rules into a nurse dashboard, caregiver alerts, weekly clinician summaries, and FHIR-style exports.

It is **not** an AI doctor. It does **not** diagnose or prescribe. It flags monitoring risks for
professional review. AI is used **only** to reword summaries for humans — severity is always decided
by an explainable, auditable rule engine.

Built for the EuroTech × HKTE HealthTech × AI Hackathon.

```
elderly patient dashboard
→ daily Cantonese check-in
→ wearable / vital data
→ deterministic risk rules
→ nurse review queue
→ caregiver alert (EN + 繁體中文)
→ weekly clinician PDF
→ FHIR-style export
→ HONESTY.md
```

---

## Quick start

```bash
npm install
npm run dev            # http://localhost:3000
```

Then click **Start demo** → **Reset demo** → open **Mrs. Chan** → **Run risky check-in**.

```bash
npm test               # risk-engine unit tests (Vitest)
npm run build          # production build
```

Optional — enable AI-assisted summary wording (the app works fully without it):

```bash
cp .env.example .env.local
# set ANTHROPIC_API_KEY=...   (otherwise a deterministic template is used)
```

## What's in the box

- **Nurse dashboard** — 5 synthetic patients, filters, risk + reason badges
- **Patient timeline** — weight / BP / heart-rate / activity charts, risk trend, check-in history
- **Daily check-in simulator** — bilingual (Cantonese + English) phone-call flow
- **Deterministic risk engine** — `lib/riskEngine.ts`, unit-tested
- **Nurse review queue** — matched rules, evidence, acknowledge + notes, statuses
- **Caregiver alert** — plain-language English + Traditional Chinese
- **Weekly clinician summary** — AI-assisted wording with deterministic fallback, **PDF export**
- **FHIR-style export** — Patient, Observations, QuestionnaireResponse, ServiceRequest
- **Audit trail**, **demo reset**, **risky check-in replay**, **CSV import**

## Architecture

Single **Next.js (App Router) + TypeScript** app — one deploy, no external database.

- **UI:** React, Tailwind CSS, shadcn/ui, Recharts
- **API:** Next.js route handlers under `app/api/*`, backed by an in-memory, deterministically-seeded
  store (`lib/store.ts`) — so the demo is reproducible and Vercel-friendly
- **Risk engine:** pure, deterministic rules (`lib/riskEngine.ts`) — never an LLM
- **AI:** Anthropic Claude, **only** for summary wording, gated behind `ANTHROPIC_API_KEY` with a
  deterministic template fallback (`lib/summaryService.ts`)
- **PDF:** server-rendered via `@react-pdf/renderer`
- **FHIR:** `lib/fhirService.ts`

### Deterministic rules

| Rule | Condition | Severity |
| --- | --- | --- |
| HF-001 | weight ↑ ≥ 2 kg over 3 days | Review today |
| HF-002 | weight gain + shortness of breath + swelling | Escalate |
| MED-001 | medication missed 2 days in a row | Review today |
| BP-001 | systolic > 180 or diastolic > 110 mmHg | Escalate |
| ACT-001 | activity > 40% below baseline for 3 days | Watch |

### API routes

```
GET   /api/patients                      GET   /api/patients/:id
GET   /api/patients/:id/timeline         POST  /api/patients/:id/checkins
POST  /api/patients/:id/vitals           POST  /api/patients/:id/evaluate-risk
POST  /api/patients/:id/weekly-summary   GET   /api/patients/:id/pdf
GET   /api/patients/:id/fhir-export      POST  /api/patients/:id/caregiver-alert
GET   /api/alerts                        PATCH /api/alerts/:id
GET   /api/audit-events
POST  /api/demo/reset                    POST  /api/demo/run-risky-checkin
POST  /api/demo/import-csv
```

## Project structure & ownership

This repo is a complete, demo-ready baseline. Teammates refine their zones:

- **Core (lead):** app scaffold, risk engine, dashboard, timeline, check-in, alert queue, summary
- **Teammate 1 — data / FHIR / audit / demo reliability:** `lib/seed.ts`, `lib/store.ts`,
  `lib/fhirService.ts`, audit events, `sample_data/`, demo reset & replay, `HONESTY.md`
- **Teammate 2 — UI polish / presentation:** theme & landing page, safety copy, and `docs/`
  (`pitch_slides.md`, `business_video_script.md`, `demo_script.md`, `judge_qa.md`)

The original build pack ships under `docs/build_pack/` for provenance.

## Business Case

**Who pays:** elderly-care operators · home-care agencies · private clinics · insurers · NGOs
running elderly chronic-care programs · care-coordination providers.

**Why they pay:** earlier nurse review · fewer missed deteriorations · better caregiver coordination
· better follow-up adherence · less avoidable urgent escalation · clinician-ready summaries ·
structured export for healthcare workflows.

**KPIs:** time to nurse review · high-risk patients reviewed · missed check-ins · medication
adherence · avoidable escalation signals · caregiver response time.

**What breaks at scale:** false alarms · incomplete data · device fragmentation · caregiver trust ·
clinical liability · workflow adoption.

**How we handle it:** conservative, explainable rules · data-completeness score · human-in-the-loop
nurse review · audit trail · clear disclaimers · FHIR-style export · no diagnosis or treatment
recommendation.

## Deployment

Deploys to **Vercel** as a single Next.js app. Set `ANTHROPIC_API_KEY` in the project's environment
variables to enable AI-assisted summary wording (optional).

## Safety & honesty

CareLoop is monitoring support — **not** a medical device, diagnosis, or treatment tool. See
[`HONESTY.md`](./HONESTY.md) and the in-app **Honesty** page for exactly what is real vs mocked.

All demo data is synthetic. No secrets are committed.
