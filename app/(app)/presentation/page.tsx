import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata = { title: "Presentation — CareLoop HK" };

interface Slide {
  n: number;
  title: string;
  subtitle?: string;
  lines: string[];
}

const SLIDES: Slide[] = [
  {
    n: 1,
    title: "CareLoop HK",
    subtitle: "Remote chronic-care monitoring for elderly patients between visits",
    lines: ["Daily check-ins, vital signals, rule-based escalation, and nurse review."],
  },
  {
    n: 2,
    title: "Problem",
    lines: [
      "Elderly chronic-care patients deteriorate between visits.",
      "Families and care teams often miss early signals until urgent care is needed.",
      "Signals: weight gain · shortness of breath · missed medication · low activity · high blood pressure.",
    ],
  },
  {
    n: 3,
    title: "Product",
    lines: [
      "CareLoop turns daily signals into nurse action:",
      "1. Daily Cantonese check-in",
      "2. Wearable / vital data",
      "3. Rule-based risk alerts",
      "4. Nurse review queue",
      "5. Caregiver alert",
      "6. Weekly clinician summary",
      "7. FHIR-style export",
    ],
  },
  {
    n: 4,
    title: "Demo case",
    lines: [
      "Mrs. Chan, 78 — heart failure + hypertension.",
      "Signals: +2.3kg in 3 days · shortness of breath · swelling · missed medication.",
      "Result: HF-001 and HF-002 matched → Escalate to nurse review.",
    ],
  },
  {
    n: 5,
    title: "Business",
    lines: [
      "Who pays: elderly-care operators · care agencies · private clinics · insurers · NGOs.",
      "KPIs: earlier nurse review · fewer missed deteriorations · better follow-up adherence.",
    ],
  },
  {
    n: 6,
    title: "Why Hong Kong / Why now",
    lines: [
      "Hong Kong faces ageing and chronic-care pressure.",
      "CareLoop supports between-visit monitoring and eHealth-style interoperability without replacing clinicians.",
      "Closing: CareLoop watches the gaps between visits.",
    ],
  },
];

const VIDEO_SCRIPT = [
  "Hong Kong's population is ageing, and chronic disease management is becoming a system-level pressure. But many elderly patients are only reviewed months later, unless they deteriorate badly enough to seek urgent care.",
  "The dangerous part is the gap between visits.",
  "CareLoop HK monitors that gap. It combines daily Cantonese check-ins, wearable or vital-sign data, and deterministic escalation rules into a nurse dashboard.",
  "It is not an AI doctor. It does not diagnose or prescribe. It flags monitoring risks for nurse or clinician review.",
  "In our demo, Mrs. Chan is a 78-year-old heart-failure and hypertension patient. She reports shortness of breath and swelling, her weight has increased by more than 2 kg in three days, and she missed medication.",
  "CareLoop matches explainable rules, creates an alert, and moves her into the nurse review queue.",
  "The nurse can acknowledge the alert, notify family, and generate a weekly clinician summary. The platform also exports a PDF and a FHIR-style JSON bundle, so the information can fit into clinical workflows.",
  "Our first buyers would be elderly-care operators, care agencies, private clinics, insurers, and NGOs managing chronic-care populations.",
  "CareLoop is built around one idea: earlier signals, fewer missed deteriorations, and safer chronic-care follow-up.",
];

const DEMO_FLOW = [
  "Show intro page.",
  "Open nurse dashboard.",
  "Open Mrs. Chan.",
  "Show worsening charts.",
  "Run risky check-in.",
  "Show matched rules.",
  "Open nurse alert queue.",
  "Show caregiver alert.",
  "Generate weekly summary.",
  "Export FHIR JSON.",
  "Open HONESTY.md.",
];

const DEMO_SCRIPT = [
  "CareLoop HK is a remote chronic-care monitoring platform for elderly Hong Kong patients. We are focusing first on heart-failure and hypertension patients between clinic visits.",
  "This is the nurse dashboard. It shows elderly patients, their latest check-in, risk state, and the top reason for review.",
  "Mrs. Chan is flagged because her recent monitoring data suggests possible deterioration.",
  "The product is not waiting for one dramatic emergency event. It combines small signals over time: weight, symptoms, medication adherence, and activity.",
  "Now Mrs. Chan reports shortness of breath and swelling, and her weight has increased by more than 2 kg in three days.",
  "CareLoop does not ask an LLM to decide severity. The rule engine matched HF-001 and HF-002, so the case is escalated for nurse review.",
  "The alert enters the nurse queue with the matched rules, evidence, and suggested operational action.",
  "The family gets a plain-language alert. It does not recommend treatment; it tells them what changed and that nurse review is recommended.",
  "At the end of the week, CareLoop generates a clinician-ready summary and exports a FHIR-style bundle. This is designed to fit into healthcare workflows, not become another isolated app.",
  "Our HONESTY.md explains what is real, what is mocked, and the safety boundaries. This is monitoring support, not diagnosis.",
];

const QA: { q: string; a: string }[] = [
  {
    q: "Is this diagnosis?",
    a: "No. CareLoop does not diagnose or prescribe. It uses deterministic monitoring rules to flag when a nurse or clinician should review a patient.",
  },
  {
    q: "What is real?",
    a: "The dashboard, check-in simulation, rule engine, alert queue, summary generation, PDF export, and FHIR-style export are real. Hospital/eHealth integration is mocked for the hackathon.",
  },
  {
    q: "Who pays?",
    a: "Initial buyers are care agencies, elderly-care operators, private clinics, NGOs, and insurers managing chronic-care populations.",
  },
  {
    q: "What breaks at scale?",
    a: "False alarms, incomplete data, device fragmentation, and clinical liability. We handle this with conservative thresholds, data completeness scoring, human-in-the-loop nurse review, audit logs, and no diagnosis or treatment recommendations.",
  },
  {
    q: "Why Hong Kong?",
    a: "Hong Kong has strong ageing and chronic-disease pressure, and its health system is moving toward stronger primary-care and eHealth infrastructure. CareLoop fits that direction by turning between-visit monitoring into a workflow.",
  },
  {
    q: "Why not just a phone call?",
    a: "Phone calls are unstructured and easy to miss. CareLoop turns check-ins into structured monitoring data, matched rules, nurse tasks, caregiver alerts, and clinician-ready summaries.",
  },
  {
    q: "Why is this AI?",
    a: "AI is used where it is safe: summarising monitoring data and rewriting it for caregivers and clinicians. The actual risk logic is deterministic and auditable.",
  },
];

export default function PresentationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Presentation</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Everything to rehearse the pitch and demo — slides, the 2-minute business video, the
          3-minute demo walkthrough, and judge Q&amp;A.
        </p>
      </div>

      <Tabs defaultValue="pitch" className="w-full">
        <TabsList>
          <TabsTrigger value="pitch">Pitch deck</TabsTrigger>
          <TabsTrigger value="video">Video script</TabsTrigger>
          <TabsTrigger value="demo">Demo script</TabsTrigger>
          <TabsTrigger value="qa">Judge Q&amp;A</TabsTrigger>
        </TabsList>

        <TabsContent value="pitch" className="pt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {SLIDES.map((s) => (
              <div key={s.n} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                    {s.n}
                  </span>
                  <h2 className="text-lg font-semibold">{s.title}</h2>
                </div>
                {s.subtitle && <p className="mt-2 text-sm font-medium">{s.subtitle}</p>}
                <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                  {s.lines.map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="video" className="pt-4">
          <article className="mx-auto max-w-2xl space-y-3 rounded-2xl border border-border bg-card p-6">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              ~2 minutes · read at a calm pace
            </p>
            {VIDEO_SCRIPT.map((p, i) => (
              <p key={i} className="text-sm leading-relaxed text-foreground/90">
                {p}
              </p>
            ))}
          </article>
        </TabsContent>

        <TabsContent value="demo" className="pt-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-sm font-semibold">Flow</h2>
              <ol className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                {DEMO_FLOW.map((step, i) => (
                  <li key={step} className="flex gap-2">
                    <span className="font-mono text-xs text-primary">{i + 1}.</span>
                    {step}
                  </li>
                ))}
              </ol>
              <p className="mt-4 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                Tip: click <span className="font-medium text-foreground">Reset demo</span> first so it
                always starts clean.
              </p>
            </div>
            <article className="space-y-3 rounded-2xl border border-border bg-card p-6 lg:col-span-2">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                ~3 minutes · spoken script
              </p>
              {DEMO_SCRIPT.map((p, i) => (
                <p key={i} className="text-sm leading-relaxed text-foreground/90">
                  {p}
                </p>
              ))}
            </article>
          </div>
        </TabsContent>

        <TabsContent value="qa" className="pt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {QA.map((item) => (
              <div key={item.q} className="rounded-2xl border border-border bg-card p-5">
                <h3 className="font-semibold">{item.q}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
