import { Info, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const LABELS = [
  "Not diagnosis",
  "For nurse / clinician review",
  "No treatment recommendation",
  "Demo data",
];

/** Row of small safety chips for risky screens. */
export function SafetyLabels({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {LABELS.map((label) => (
        <span
          key={label}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
        >
          <ShieldCheck className="size-3" />
          {label}
        </span>
      ))}
    </div>
  );
}

/** Primary product disclaimer line. */
export function SafetyBanner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-lg border border-primary/20 bg-accent/40 px-3 py-2 text-sm text-accent-foreground",
        className,
      )}
    >
      <Info className="mt-0.5 size-4 shrink-0" />
      <p>
        CareLoop does not diagnose or prescribe. It flags monitoring risks for professional review.
      </p>
    </div>
  );
}

/** Compact inline note for alert cards. */
export function SafetyNote({ className }: { className?: string }) {
  return (
    <p className={cn("text-xs text-muted-foreground", className)}>
      This alert is not a diagnosis or treatment recommendation. It is a monitoring prompt for
      professional review.
    </p>
  );
}
