// Risk color system (exact spec):
//   Stable #16A34A (green) · Watch #2563EB (blue) · Review today #D97706 (amber) · Escalate #DC2626 (red)
// Risk colors are used ONLY for statuses/alerts — never to paint the whole UI.

import type { AlertStatus, Severity } from "./types";

export interface SeverityStyle {
  label: string;
  /** badge classes (bg + text + border) */
  badge: string;
  /** subtle row / card tint */
  tint: string;
  /** solid dot */
  dot: string;
  /** hex for charts / inline styles */
  hex: string;
}

export const SEVERITY_STYLE: Record<Severity, SeverityStyle> = {
  stable: {
    label: "Stable",
    badge: "bg-green-50 text-green-700 border-green-200",
    tint: "bg-green-50/40",
    dot: "bg-green-600",
    hex: "#16a34a",
  },
  watch: {
    label: "Watch",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    tint: "bg-blue-50/40",
    dot: "bg-blue-600",
    hex: "#2563eb",
  },
  review_today: {
    label: "Review today",
    badge: "bg-amber-50 text-amber-800 border-amber-200",
    tint: "bg-amber-50/50",
    dot: "bg-amber-600",
    hex: "#d97706",
  },
  escalate: {
    label: "Escalate",
    badge: "bg-red-50 text-red-700 border-red-200",
    tint: "bg-red-50/50",
    dot: "bg-red-600",
    hex: "#dc2626",
  },
};

export function severityStyle(s: Severity): SeverityStyle {
  return SEVERITY_STYLE[s];
}

export const REASON_TAG_STYLE: Record<string, string> = {
  "weight gain": "bg-amber-50 text-amber-800 border-amber-200",
  "symptoms reported": "bg-red-50 text-red-700 border-red-200",
  "missed meds": "bg-slate-100 text-slate-700 border-slate-200",
  "high BP": "bg-red-50 text-red-700 border-red-200",
  "low activity": "bg-blue-50 text-blue-700 border-blue-200",
};

export const ALERT_STATUS_STYLE: Record<AlertStatus, string> = {
  new: "bg-red-50 text-red-700 border-red-200",
  acknowledged: "bg-amber-50 text-amber-800 border-amber-200",
  family_contacted: "bg-blue-50 text-blue-700 border-blue-200",
  clinician_review_requested: "bg-teal-50 text-teal-700 border-teal-200",
  resolved: "bg-green-50 text-green-700 border-green-200",
};
