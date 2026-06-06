"use client";

import { useState } from "react";
import { FileText, Download, PenLine, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { api, pdfUrl } from "@/lib/api";
import type { WeeklySummary } from "@/lib/types";
import { cn } from "@/lib/utils";

export function WeeklySummaryPanel({
  patientId,
  onChanged,
}: {
  patientId: string;
  onChanged?: () => void;
}) {
  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [busy, setBusy] = useState(false);

  async function generate() {
    setBusy(true);
    try {
      const s = await api.weeklySummary(patientId);
      setSummary(s);
      onChanged?.();
      toast.success(
        s.generated_by === "ai" ? "Weekly summary generated (AI-assisted)" : "Weekly summary generated",
        {
          description:
            s.generated_by === "ai"
              ? "Wording polished by Claude; figures are deterministic."
              : "Deterministic template (set ANTHROPIC_API_KEY to enable AI wording).",
        },
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not generate summary");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-primary" />
          <h2 className="font-semibold">Weekly clinician summary</h2>
          {summary && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                summary.generated_by === "ai"
                  ? "border-primary/30 bg-accent text-accent-foreground"
                  : "border-border bg-muted text-muted-foreground",
              )}
            >
              {summary.generated_by === "ai" && <PenLine className="size-3" />}
              {summary.generated_by === "ai" ? "AI-assisted wording" : "Deterministic template"}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={generate} disabled={busy} className="gap-1.5">
            {summary ? <RefreshCw className="size-4" /> : <PenLine className="size-4" />}
            {busy ? "Generating…" : summary ? "Regenerate" : "Generate summary"}
          </Button>
          <a
            href={pdfUrl(patientId)}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
          >
            <Download className="size-4" /> Download PDF
          </a>
        </div>
      </div>

      {summary ? (
        <div className="mt-3 space-y-3">
          <p className="rounded-lg border border-border bg-muted/30 p-3 text-sm leading-relaxed">
            {summary.generated_text}
          </p>
          <p className="text-xs text-muted-foreground">
            Data completeness: {Math.round(summary.data_completeness * 100)}% · AI is used only for
            wording; severity and figures are deterministic.
          </p>
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          Generate a one-page, clinician-ready summary of this week’s monitoring data — risk trend,
          vitals, symptoms, adherence, matched rules, and recommended review items. Export it as a
          PDF for the care team.
        </p>
      )}
    </div>
  );
}
