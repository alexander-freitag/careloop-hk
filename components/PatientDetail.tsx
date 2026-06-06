"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Phone,
  Stethoscope,
  Home,
  Languages,
  Scale,
  HeartPulse,
  Footprints,
  Pill,
  Activity,
  CheckCircle2,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { TrendChart, type ChartRow } from "@/components/charts/TrendChart";
import { RiskCard } from "@/components/RiskCard";
import { RiskBadge } from "@/components/RiskBadge";
import { AuditDrawer } from "@/components/AuditDrawer";
import { CsvImport } from "@/components/CsvImport";
import { CaregiverAlert } from "@/components/CaregiverAlert";
import { ConversationPanel } from "@/components/ConversationPanel";
import { WeeklySummaryPanel } from "@/components/WeeklySummaryPanel";
import { FhirExportPanel } from "@/components/FhirExportPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useApp } from "@/components/AppProvider";
import { api } from "@/lib/api";
import { formatDay } from "@/lib/format";
import type { DailyCheckIn, PatientTimeline } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PatientDetail({
  patientId,
  initialTimeline,
}: {
  patientId: string;
  initialTimeline: PatientTimeline;
}) {
  const { refresh } = useApp();
  const [timeline, setTimeline] = useState<PatientTimeline>(initialTimeline);

  const reload = useCallback(async () => {
    try {
      setTimeline(await api.timeline(patientId));
    } catch {
      /* keep last good timeline */
    }
  }, [patientId]);

  const handleChanged = useCallback(async () => {
    await reload();
    await refresh();
  }, [reload, refresh]);

  const { patient, daily, checkins, risk, risk_trend } = timeline;

  const rows = (key: string): ChartRow[] =>
    daily.map((d) => ({ date: d.date, [key]: d[key as keyof typeof d] as number | null }));
  const bpRows: ChartRow[] = daily.map((d) => ({
    date: d.date,
    systolic: d.systolic,
    diastolic: d.diastolic,
  }));
  const trendRows: ChartRow[] = risk_trend.map((t) => ({ date: t.date, score: t.score }));
  const stepsThreshold = Math.round(patient.baseline_steps * 0.6);

  async function sendCheckin() {
    try {
      const res = await fetch("/api/agent/send-checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to send");
      toast.success(`Daily check-in sent to ${patient.name}'s WhatsApp`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send check-in");
    }
  }

  return (
    <div className="space-y-5">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Back to dashboard
      </Link>

      {/* Header */}
      <div className="cl-rise rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{patient.name}</h1>
              <RiskBadge severity={risk.severity} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {patient.age} years · {patient.gender} · {patient.conditions.join(", ")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Monitoring alert only. Not diagnosis or treatment advice.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={sendCheckin} className="gap-1.5">
              <MessageCircle className="size-4" /> Send check-in
            </Button>
            <CsvImport patientId={patientId} onImported={handleChanged} />
            <AuditDrawer patientId={patientId} />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Info icon={Stethoscope} label="Assigned nurse" value={patient.assigned_nurse} />
          <Info icon={Phone} label="Caregiver" value={patient.caregiver_name} sub={patient.caregiver_phone} />
          <Info icon={Home} label="Living" value={patient.living_status} />
          <Info icon={Languages} label="Language" value={patient.language} />
        </div>
      </div>

      {/* Lead: why flagged + human impact */}
      <div className="cl-rise grid gap-4 lg:grid-cols-3" style={{ animationDelay: "100ms" }}>
        <div className="lg:col-span-2">
          <RiskCard risk={risk} />
        </div>
        <div>
          {risk.severity !== "stable" ? (
            <CaregiverAlert timeline={timeline} onNotified={handleChanged} />
          ) : (
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="size-4 text-green-600" /> No active alert
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Monitoring is within the expected range. Continue daily check-ins.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* WhatsApp conversation — live thread + extraction */}
      <div className="cl-rise" style={{ animationDelay: "150ms" }}>
        <ConversationPanel patientId={patientId} onActivity={handleChanged} />
      </div>

      {/* Secondary detail behind tabs */}
      <Tabs defaultValue="trends" className="cl-rise w-full">
        <TabsList>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="checkins">Check-ins</TabsTrigger>
          <TabsTrigger value="export">Export &amp; audit</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="cl-fade pt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <ChartCard icon={Scale} title="Weight (kg)">
              <TrendChart
                data={rows("weight")}
                series={[{ key: "weight", name: "Weight", color: "var(--chart-1)" }]}
                unit="kg"
                refLines={[{ y: patient.baseline_weight, label: "baseline" }]}
              />
            </ChartCard>
            <ChartCard icon={HeartPulse} title="Blood pressure (mmHg)">
              <TrendChart
                data={bpRows}
                series={[
                  { key: "systolic", name: "Systolic", color: "var(--chart-2)" },
                  { key: "diastolic", name: "Diastolic", color: "var(--chart-5)" },
                ]}
                unit="mmHg"
              />
            </ChartCard>
            <ChartCard icon={Footprints} title="Activity (steps)">
              <TrendChart
                data={rows("steps")}
                series={[{ key: "steps", name: "Steps", color: "var(--chart-2)" }]}
                unit="steps"
                refLines={[
                  { y: patient.baseline_steps, label: "baseline" },
                  { y: stepsThreshold, label: "-40%", color: "var(--destructive)" },
                ]}
              />
            </ChartCard>
            <AdherenceStrip checkins={checkins} />
          </div>
          <div className="mt-4">
            <ChartCard icon={Activity} title="Risk level over time">
              <TrendChart
                data={trendRows}
                series={[{ key: "score", name: "Risk", color: "var(--chart-3)" }]}
                domain={[0, 3]}
                step
                yTickFormatter={(v) => ["Stable", "Watch", "Review", "Escalate"][v] ?? ""}
              />
            </ChartCard>
          </div>
        </TabsContent>

        <TabsContent value="checkins" className="cl-fade pt-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-2 text-sm font-medium">Daily check-in responses</h2>
            <CheckInTable checkins={checkins} />
          </div>
        </TabsContent>

        <TabsContent value="export" className="cl-fade pt-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <WeeklySummaryPanel patientId={patientId} onChanged={handleChanged} />
            </div>
            <div>
              <FhirExportPanel patientId={patientId} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Info({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 px-3 py-2">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </div>
      <div className="mt-0.5 font-medium">{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

function ChartCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium">
        <Icon className="size-4 text-primary" />
        {title}
      </div>
      {children}
    </div>
  );
}

function AdherenceStrip({ checkins }: { checkins: DailyCheckIn[] }) {
  const ordered = [...checkins].sort((a, b) => a.date.localeCompare(b.date));
  const taken = ordered.filter((c) => c.medication_taken).length;
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Pill className="size-4 text-primary" />
          Medication adherence
        </div>
        <span className="text-xs text-muted-foreground">
          {taken}/{ordered.length} days
        </span>
      </div>
      <div className="flex gap-1.5">
        {ordered.map((c) => (
          <div key={c.id} className="flex-1">
            <div
              className={cn(
                "h-12 rounded-md",
                c.medication_taken ? "bg-green-100" : "bg-red-100",
              )}
              title={`${c.date}: ${c.medication_taken ? "taken" : "missed"}`}
            />
            <div className="mt-1 text-center text-[10px] text-muted-foreground">
              {formatDay(c.date).split(" ")[0]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function YesNo({ value, kind }: { value: boolean; kind: "symptom" | "med" }) {
  const concerning = kind === "symptom" ? value : !value;
  const label = kind === "med" ? (value ? "Taken" : "Missed") : value ? "Yes" : "No";
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
        concerning ? "bg-red-50 text-red-700" : "bg-muted text-muted-foreground",
      )}
    >
      {label}
    </span>
  );
}

function CheckInTable({ checkins }: { checkins: DailyCheckIn[] }) {
  const ordered = [...checkins].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/40 hover:bg-muted/40">
          <TableHead>Date</TableHead>
          <TableHead>Mood</TableHead>
          <TableHead>Breathless</TableHead>
          <TableHead>Swelling</TableHead>
          <TableHead>Medication</TableHead>
          <TableHead>Note</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ordered.map((c) => (
          <TableRow key={c.id}>
            <TableCell className="font-medium">{formatDay(c.date)}</TableCell>
            <TableCell className="text-muted-foreground">{c.mood || "—"}</TableCell>
            <TableCell>
              <YesNo value={c.shortness_of_breath} kind="symptom" />
            </TableCell>
            <TableCell>
              <YesNo value={c.swelling} kind="symptom" />
            </TableCell>
            <TableCell>
              <YesNo value={c.medication_taken} kind="med" />
            </TableCell>
            <TableCell className="max-w-[260px] whitespace-normal text-xs text-muted-foreground">
              {c.free_text_note || "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
