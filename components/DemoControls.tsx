"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Zap, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useApp } from "@/components/AppProvider";
import { api } from "@/lib/api";

const DEMO_PATIENT = "patient-mrs-chan";

/** Polished demo-reliability controls (not debug buttons). */
export function DemoControls() {
  const router = useRouter();
  const { busy, resetDemo, runRiskyCheckIn } = useApp();
  const [genBusy, setGenBusy] = useState(false);

  async function risky() {
    const id = await runRiskyCheckIn();
    if (id) router.push(`/patients/${id}`);
  }

  async function summary() {
    setGenBusy(true);
    try {
      const s = await api.weeklySummary(DEMO_PATIENT);
      toast.success(
        `Weekly summary ready (${s.generated_by === "ai" ? "AI-assisted" : "template"})`,
        { description: "Open Mrs. Chan → Export & audit to view and download." },
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not generate summary");
    } finally {
      setGenBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-card p-1.5">
      <span className="px-1.5 text-xs font-medium text-muted-foreground">Demo</span>
      <Button variant="outline" size="sm" onClick={resetDemo} disabled={busy} className="gap-1.5">
        <RotateCcw className="size-4" /> Reset
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={summary}
        disabled={busy || genBusy}
        className="gap-1.5"
      >
        <FileText className="size-4" /> Generate summary
      </Button>
      <Button size="sm" onClick={risky} disabled={busy} className="gap-1.5">
        <Zap className="size-4" /> Run risky check-in
      </Button>
    </div>
  );
}
