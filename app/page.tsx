import Link from "next/link";
import { ArrowRight, ClipboardList, ListChecks, FileJson, HeartPulse, ShieldCheck } from "lucide-react";
import { PreviewCard } from "@/components/PreviewCard";

const PROOF = [
  {
    icon: ClipboardList,
    title: "Daily check-ins",
    body: "Cantonese-friendly symptom and medication check-ins for elderly patients.",
  },
  {
    icon: ListChecks,
    title: "Rule-based escalation",
    body: "Risk alerts are deterministic and explainable, not LLM-made diagnoses.",
  },
  {
    icon: FileJson,
    title: "FHIR-style export",
    body: "Clinician summaries and structured data exports for healthcare workflows.",
  },
];

export default function Landing() {
  return (
    <div className="flex-1">
      {/* minimal top bar */}
      <header className="mx-auto flex max-w-[1180px] items-center justify-between px-6 py-5">
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

      {/* hero split */}
      <section className="mx-auto grid max-w-[1180px] items-center gap-12 px-6 pb-16 pt-10 lg:grid-cols-2 lg:gap-16 lg:pt-16">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
            <HeartPulse className="size-3.5" /> Hong Kong elderly chronic-care monitoring
          </span>

          <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl">
            CareLoop watches the gaps between visits.
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-relaxed text-secondary-foreground/80">
            Daily Cantonese check-ins and vital signals become explainable nurse-review alerts,
            caregiver updates, and clinician-ready summaries.
          </p>

          <div className="mt-5 flex items-start gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            <p>
              CareLoop does not diagnose or prescribe. It flags monitoring risks for professional
              review.
            </p>
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              Start demo <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/honesty"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-card px-6 text-sm font-semibold transition-colors hover:bg-muted"
            >
              View HONESTY.md
            </Link>
          </div>
        </div>

        <div className="lg:pl-6">
          <PreviewCard />
        </div>
      </section>

      {/* proof cards */}
      <section className="mx-auto max-w-[1180px] px-6 pb-20">
        <div className="grid gap-4 sm:grid-cols-3">
          {PROOF.map((card) => (
            <div key={card.title} className="rounded-2xl border border-border bg-card p-6">
              <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <card.icon className="size-5" />
              </span>
              <h3 className="mt-4 font-semibold">{card.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{card.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
