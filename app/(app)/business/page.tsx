import { Users, TrendingUp, Target, AlertTriangle, ShieldCheck } from "lucide-react";

export const metadata = { title: "Business case — CareLoop HK" };

const SECTIONS: { icon: React.ElementType; title: string; items: string[]; tone?: "warn" }[] = [
  {
    icon: Users,
    title: "Who pays?",
    items: [
      "Elderly-care operators",
      "Home-care agencies",
      "Private clinics",
      "Insurers",
      "NGOs running elderly chronic-care programs",
      "Care coordination providers",
    ],
  },
  {
    icon: TrendingUp,
    title: "Why they pay",
    items: [
      "Earlier nurse review",
      "Fewer missed deteriorations",
      "Better caregiver coordination",
      "Better follow-up adherence",
      "Clinician-ready summaries",
      "Structured export for healthcare workflows",
    ],
  },
  {
    icon: Target,
    title: "Key KPIs",
    items: [
      "Time to nurse review",
      "High-risk patients reviewed",
      "Missed check-ins",
      "Medication adherence",
      "Caregiver response time",
      "Avoidable escalation signals",
    ],
  },
  {
    icon: AlertTriangle,
    title: "What breaks at scale?",
    tone: "warn",
    items: [
      "False alarms",
      "Incomplete data",
      "Device fragmentation",
      "Caregiver trust",
      "Clinical liability",
      "Workflow adoption",
    ],
  },
  {
    icon: ShieldCheck,
    title: "How CareLoop handles it",
    items: [
      "Conservative rules",
      "Data completeness score",
      "Human-in-the-loop nurse review",
      "Audit trail",
      "Clear disclaimers",
      "FHIR-style export",
      "No diagnosis or treatment recommendation",
    ],
  },
];

export default function BusinessPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Business case</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          CareLoop turns between-visit monitoring into an operational workflow. Here is who buys it,
          why, and how it stays safe at scale.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((s) => (
          <section
            key={s.title}
            className="rounded-2xl border border-border bg-card p-6 last:sm:col-span-2"
          >
            <div className="flex items-center gap-2">
              <span
                className={
                  s.tone === "warn"
                    ? "flex size-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700"
                    : "flex size-9 items-center justify-center rounded-xl bg-accent text-accent-foreground"
                }
              >
                <s.icon className="size-5" />
              </span>
              <h2 className="text-lg font-semibold">{s.title}</h2>
            </div>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {s.items.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-foreground/90">
                  <span className="mt-2 size-1 shrink-0 rounded-full bg-primary/60" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
