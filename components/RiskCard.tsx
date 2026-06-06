import { ListChecks, ArrowRightCircle } from "lucide-react";
import { RiskBadge } from "@/components/RiskBadge";
import { SafetyNote } from "@/components/SafetyLabels";
import { severityStyle } from "@/lib/severity";
import type { RiskResult } from "@/lib/types";
import { cn } from "@/lib/utils";

export function RiskCard({ risk }: { risk: RiskResult }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ListChecks className="size-4 text-primary" />
          <h2 className="font-semibold">Risk assessment</h2>
        </div>
        <RiskBadge severity={risk.severity} />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Severity is decided by the deterministic rule engine — not by AI.
      </p>

      {risk.matched_rules.length === 0 ? (
        <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50/50 px-3 py-2 text-sm text-emerald-800">
          No monitoring rules triggered. Vitals, symptoms, and adherence are within the expected
          range.
        </p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {risk.matched_rules.map((rule) => {
            const s = severityStyle(rule.severity);
            return (
              <li key={rule.code} className={cn("rounded-lg border p-3", s.badge)}>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-white/70 px-1.5 py-0.5 font-mono text-xs font-semibold">
                    {rule.code}
                  </span>
                  <span className="text-sm font-medium">{rule.description}</span>
                </div>
                <p className="mt-1 text-xs opacity-90">{rule.evidence}</p>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-4 flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
        <ArrowRightCircle className="mt-0.5 size-4 shrink-0 text-primary" />
        <div>
          <p className="text-xs font-medium text-muted-foreground">Recommended operational action</p>
          <p className="text-sm">{risk.recommended_action}</p>
        </div>
      </div>

      <SafetyNote className="mt-3" />
    </div>
  );
}
