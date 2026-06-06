"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, AlertTriangle, Eye, ClipboardCheck, ChevronRight, ArrowRight } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { ReasonTags, RiskBadge } from "@/components/RiskBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SEVERITY_ORDER, type PatientRow, type Severity } from "@/lib/types";
import { severityStyle } from "@/lib/severity";
import { formatDay } from "@/lib/format";
import { cn } from "@/lib/utils";

type Filter = "all" | Severity;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "stable", label: "Stable" },
  { key: "watch", label: "Watch" },
  { key: "review_today", label: "Review today" },
  { key: "escalate", label: "Escalate" },
];

const NEXT_ACTION: Record<Severity, string> = {
  escalate: "Nurse review today",
  review_today: "Review today",
  watch: "Monitor",
  stable: "Routine monitoring",
};

export function Dashboard() {
  const { rows } = useApp();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");

  const sortedAll = useMemo(
    () =>
      [...rows].sort((a, b) => {
        const d = SEVERITY_ORDER[b.risk.severity] - SEVERITY_ORDER[a.risk.severity];
        return d !== 0 ? d : a.patient.name.localeCompare(b.patient.name);
      }),
    [rows],
  );

  const stats = useMemo(() => {
    const escalate = rows.filter((r) => r.risk.severity === "escalate").length;
    const watchReview = rows.filter(
      (r) => r.risk.severity === "watch" || r.risk.severity === "review_today",
    ).length;
    const dates = (rows.map((r) => r.last_checkin_date).filter(Boolean) as string[]).sort();
    const latest = dates[dates.length - 1] ?? null;
    const checkinsToday = latest ? rows.filter((r) => r.last_checkin_date === latest).length : 0;
    return { monitored: rows.length, escalate, watchReview, checkinsToday };
  }, [rows]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows.length, stable: 0, watch: 0, review_today: 0, escalate: 0 };
    for (const r of rows) c[r.risk.severity]++;
    return c;
  }, [rows]);

  const focus = sortedAll.find((r) => r.risk.severity !== "stable") ?? null;
  const visible = filter === "all" ? sortedAll : sortedAll.filter((r) => r.risk.severity === filter);

  return (
    <div className="space-y-5">
      {/* summary row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={Users} label="Monitored patients" value={stats.monitored} />
        <Stat icon={AlertTriangle} label="Escalate" value={stats.escalate} tone="escalate" />
        <Stat icon={Eye} label="Watch / review" value={stats.watchReview} tone="watch" />
        <Stat icon={ClipboardCheck} label="Check-ins today" value={stats.checkinsToday} />
      </div>

      {/* focused high-risk patient */}
      {focus && <FocusedCard row={focus} />}

      {/* filter segmented control */}
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          const accent = f.key !== "all" ? severityStyle(f.key as Severity).dot : "bg-foreground";
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              aria-pressed={active}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted",
              )}
            >
              {f.key !== "all" && <span className={cn("size-1.5 rounded-full", accent)} />}
              {f.label}
              <span
                className={cn(
                  "rounded-full px-1.5 text-xs",
                  active ? "bg-primary/15 text-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                {counts[f.key]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Patient</TableHead>
              <TableHead>Condition</TableHead>
              <TableHead>Last check-in</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Next action</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  No patients in this view.
                </TableCell>
              </TableRow>
            )}
            {visible.map((row) => (
              <TableRow
                key={row.patient.id}
                onClick={() => router.push(`/patients/${row.patient.id}`)}
                className={cn("cursor-pointer", severityStyle(row.risk.severity).tint)}
              >
                <TableCell>
                  <Link
                    href={`/patients/${row.patient.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-medium text-foreground outline-none hover:text-primary hover:underline focus-visible:text-primary focus-visible:underline"
                  >
                    {row.patient.name}
                  </Link>
                  <div className="text-xs text-muted-foreground">
                    {row.patient.age} · {row.patient.gender}
                  </div>
                </TableCell>
                <TableCell className="max-w-[170px] whitespace-normal text-muted-foreground">
                  {row.patient.conditions.join(", ")}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDay(row.last_checkin_date)}
                </TableCell>
                <TableCell>
                  <RiskBadge severity={row.risk.severity} />
                </TableCell>
                <TableCell className="max-w-[200px] whitespace-normal">
                  <ReasonTags tags={row.risk.reason_tags} />
                </TableCell>
                <TableCell className="text-muted-foreground">{row.patient.assigned_nurse}</TableCell>
                <TableCell className="text-foreground">{NEXT_ACTION[row.risk.severity]}</TableCell>
                <TableCell>
                  <ChevronRight aria-hidden className="size-4 text-muted-foreground" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  tone?: "escalate" | "watch";
}) {
  const toneCls =
    tone === "escalate" ? "text-red-600" : tone === "watch" ? "text-blue-600" : "text-foreground";
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <Icon className={cn("size-4", tone ? toneCls : "text-muted-foreground")} />
      </div>
      <div className={cn("mt-2 text-3xl font-semibold tracking-tight", toneCls)}>{value}</div>
    </div>
  );
}

function FocusedCard({ row }: { row: PatientRow }) {
  const s = severityStyle(row.risk.severity);
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-5", s.tint)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <span className={cn("size-1.5 rounded-full", s.dot)} />
            Highest priority
          </div>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">{row.patient.name}</h2>
          <p className="text-sm text-muted-foreground">
            {row.patient.age} · {row.patient.conditions.join(", ")}
          </p>
        </div>
        <RiskBadge severity={row.risk.severity} />
      </div>

      <ul className="mt-3 space-y-1.5 text-sm">
        {row.risk.matched_rules.slice(0, 4).map((m) => (
          <li key={m.code} className="flex gap-2 text-foreground/90">
            <span className="mt-2 size-1 shrink-0 rounded-full bg-muted-foreground/60" />
            {m.evidence}
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">
          Assigned to <span className="font-medium text-foreground">{row.patient.assigned_nurse}</span>
        </span>
        <Link
          href={`/patients/${row.patient.id}`}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Open patient <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
