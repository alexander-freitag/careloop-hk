import { TrendingUp, Wind, Droplets, Pill } from "lucide-react";
import { RiskBadge } from "@/components/RiskBadge";

const SIGNALS = [
  { icon: TrendingUp, label: "+2.3 kg in 3 days" },
  { icon: Wind, label: "Shortness of breath" },
  { icon: Droplets, label: "Leg swelling" },
  { icon: Pill, label: "Medication missed" },
];

/**
 * Compact, static product preview shown on the landing page. It explains the
 * whole product — signals → matched rules → escalation — before any click.
 */
export function PreviewCard() {
  return (
    <div className="rounded-3xl border border-border bg-card p-2 shadow-xl shadow-slate-900/[0.04]">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-xs font-medium text-muted-foreground">Patient · CareLoop HK</span>
        <RiskBadge severity="escalate" />
      </div>

      <div className="rounded-2xl border border-border bg-background/70 p-5">
        <h3 className="text-lg font-semibold">Mrs. Chan, 78</h3>
        <p className="text-sm text-muted-foreground">Heart failure + hypertension · lives alone</p>

        <p className="mt-5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Latest signals
        </p>
        <ul className="mt-2 space-y-2">
          {SIGNALS.map((s) => (
            <li key={s.label} className="flex items-center gap-2.5 text-sm text-foreground">
              <span className="flex size-7 items-center justify-center rounded-lg bg-red-50 text-red-600">
                <s.icon className="size-4" />
              </span>
              {s.label}
            </li>
          ))}
        </ul>

        <p className="mt-5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Matched rules
        </p>
        <div className="mt-2 flex gap-1.5">
          {["HF-001", "HF-002"].map((code) => (
            <span
              key={code}
              className="rounded-md border border-border bg-muted px-2 py-0.5 font-mono text-xs font-semibold text-foreground"
            >
              {code}
            </span>
          ))}
        </div>

        <div className="mt-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700">
          <span className="size-1.5 rounded-full bg-red-600" />
          Escalate — nurse review recommended
        </div>

        <p className="mt-3 text-[11px] text-muted-foreground">
          Not diagnosis · for professional review
        </p>
      </div>
    </div>
  );
}
