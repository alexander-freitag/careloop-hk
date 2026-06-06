"use client";

import { useState } from "react";
import { FileJson, Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { api, fhirUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

export function FhirExportPanel({ patientId }: { patientId: string }) {
  const [bundle, setBundle] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false);

  const entryCount = Array.isArray(bundle?.entry) ? (bundle!.entry as unknown[]).length : 0;

  async function exportBundle() {
    setBusy(true);
    try {
      const b = await api.fhirExport(patientId);
      setBundle(b);
      toast.success("FHIR-style bundle exported");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not export bundle");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!bundle) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(bundle, null, 2));
      toast.success("FHIR bundle copied");
    } catch {
      toast.error("Could not copy");
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FileJson className="size-4 text-primary" />
          <h2 className="font-semibold">FHIR-style export</h2>
        </div>
        {bundle && (
          <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
            {entryCount} resources
          </span>
        )}
      </div>

      {!bundle ? (
        <>
          <p className="mt-2 text-sm text-muted-foreground">
            Generate a FHIR-style JSON bundle — Patient, Observations, QuestionnaireResponse, and a
            nurse-review ServiceRequest — designed to fit healthcare workflows.
          </p>
          <Button size="sm" className="mt-3 gap-1.5" onClick={exportBundle} disabled={busy}>
            <FileJson className="size-4" /> {busy ? "Exporting…" : "Export FHIR bundle"}
          </Button>
        </>
      ) : (
        <>
          <pre className="mt-3 max-h-72 overflow-auto rounded-lg border border-border bg-muted/40 p-3 font-mono text-[11px] leading-relaxed">
            {JSON.stringify(bundle, null, 2)}
          </pre>
          <div className="mt-3 flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={copy}>
              <Copy className="size-4" /> Copy
            </Button>
            <a
              href={`${fhirUrl(patientId)}?download=1`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
            >
              <Download className="size-4" /> Download .json
            </a>
          </div>
        </>
      )}
    </div>
  );
}
