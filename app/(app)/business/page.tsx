import { AlertTriangle, ShieldCheck, TrendingUp, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SafetyLabels } from "@/components/SafetyLabels";

export const metadata = { title: "Business case — CareLoop HK" };

interface Section {
  icon: typeof Users;
  title: string;
  bullets: string[];
  tint: string;
  iconTint: string;
}

const SECTIONS: Section[] = [
  {
    icon: Users,
    title: "Who pays",
    tint: "bg-sky-50/60",
    iconTint: "bg-sky-100 text-sky-700",
    bullets: [
      "elderly-care operators",
      "home-care agencies",
      "private clinics",
      "insurers",
      "NGOs running elderly chronic-care programs",
      "care coordination providers",
    ],
  },
  {
    icon: TrendingUp,
    title: "Why they pay",
    tint: "bg-emerald-50/60",
    iconTint: "bg-emerald-100 text-emerald-700",
    bullets: [
      "earlier nurse review",
      "fewer missed deteriorations",
      "better caregiver coordination",
      "better follow-up adherence",
      "less avoidable urgent escalation",
      "clinician-ready summaries",
      "structured export for healthcare workflows",
    ],
  },
  {
    icon: AlertTriangle,
    title: "What breaks at scale",
    tint: "bg-amber-50/60",
    iconTint: "bg-amber-100 text-amber-800",
    bullets: [
      "false alarms",
      "incomplete data",
      "device fragmentation",
      "caregiver trust",
      "clinical liability",
      "workflow adoption",
    ],
  },
  {
    icon: ShieldCheck,
    title: "How we handle it",
    tint: "bg-primary/5",
    iconTint: "bg-primary/10 text-primary",
    bullets: [
      "conservative rules",
      "human-in-the-loop nurse review",
      "audit trail",
      "clear disclaimers",
      "FHIR-style export",
      "no diagnosis or treatment recommendation",
    ],
  },
];

export default function BusinessPage() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Business case</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Who pays, why they pay, what breaks at scale, and how CareLoop HK handles it — the buyer
            and risk picture behind between-visit chronic-care monitoring.
          </p>
        </div>
        <SafetyLabels />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((section) => (
          <Card key={section.title} className={`p-5 ${section.tint}`}>
            <div className="flex items-center gap-3">
              <span
                className={`flex size-10 items-center justify-center rounded-lg ${section.iconTint}`}
              >
                <section.icon className="size-5" />
              </span>
              <h2 className="text-lg font-semibold">{section.title}</h2>
            </div>
            <ul className="mt-4 space-y-1.5 text-sm text-foreground/90">
              {section.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-2">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-foreground/40" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <p className="border-l-2 border-primary/40 pl-4 text-sm italic text-muted-foreground">
        CareLoop watches the gaps between visits.
      </p>
    </div>
  );
}
