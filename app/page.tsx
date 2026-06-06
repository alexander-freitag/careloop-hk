import Link from "next/link";
import {
  HeartPulse,
  ListChecks,
  FileJson,
  ArrowRight,
  Activity,
  Bell,
  Users,
  ClipboardList,
  Share2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { SafetyBanner } from "@/components/SafetyLabels";

const PROOF = [
  {
    icon: Activity,
    title: "Elderly chronic-care monitoring",
    body: "Daily Cantonese check-ins and wearable/vital data for heart-failure, hypertension, and other chronic conditions — between clinic visits.",
  },
  {
    icon: ListChecks,
    title: "Rule-based escalation",
    body: "Deterministic, explainable rules decide severity and matched evidence. The risk engine is auditable — never an LLM.",
  },
  {
    icon: FileJson,
    title: "FHIR-style export",
    body: "Clinician-ready weekly summaries, PDF, and FHIR-style JSON bundles designed to fit into healthcare workflows.",
  },
];

const FLOW = [
  { icon: ClipboardList, label: "Daily check-in" },
  { icon: Activity, label: "Vital signals" },
  { icon: ListChecks, label: "Risk rules" },
  { icon: Bell, label: "Nurse review" },
  { icon: Users, label: "Caregiver alert" },
  { icon: Share2, label: "Clinician summary" },
];

export default function Landing() {
  return (
    <div className="flex-1">
      {/* minimal top bar */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <HeartPulse className="size-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">CareLoop HK</span>
        </div>
        <Link
          href="/honesty"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          View HONESTY.md
        </Link>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-12 pt-8 sm:pt-14">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-accent/50 px-3 py-1 text-xs font-medium text-accent-foreground">
            <HeartPulse className="size-3.5" /> HealthTech × AI · Hong Kong elderly chronic care
          </span>
          <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Remote chronic-care monitoring for elderly patients between visits
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-balance text-lg text-muted-foreground">
            Daily Cantonese check-ins + wearable/vital signals + deterministic escalation rules +
            nurse dashboard + weekly clinician summary.
          </p>

          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              Start demo <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/honesty"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-card px-6 text-sm font-semibold transition-colors hover:bg-accent"
            >
              View HONESTY.md
            </Link>
          </div>

          <SafetyBanner className="mx-auto mt-7 max-w-xl text-left" />
        </div>

        {/* opening line */}
        <p className="mx-auto mt-12 max-w-2xl border-l-2 border-primary/40 pl-4 text-balance text-lg italic text-foreground/80">
          “Elderly chronic-care patients do not deteriorate only during clinic visits. CareLoop
          watches the gaps between visits.”
        </p>

        {/* flow strip */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
          {FLOW.map((step, i) => (
            <div key={step.label} className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5">
                <step.icon className="size-4 text-primary" />
                {step.label}
              </span>
              {i < FLOW.length - 1 && <ArrowRight className="size-3.5 opacity-40" />}
            </div>
          ))}
        </div>

        {/* proof cards */}
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {PROOF.map((card) => (
            <Card key={card.title} className="p-5">
              <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <card.icon className="size-5" />
              </span>
              <h3 className="mt-3 font-semibold">{card.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{card.body}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
