// Daily check-in scheduler (server-only, in-process).
//
// Started once on server boot via instrumentation.ts. When CARELOOP_CHECKIN_TIME
// (24h "HH:MM", Hong Kong time by default) is set, it sends the agent's morning
// check-in at that time each day. OFF by default so dev/demo never auto-sends.
//
// This is the autonomous "agent reaches out every morning" mechanism. For a
// serverless production deploy you'd swap this for Vercel Cron hitting
// /api/agent/send-checkin; the agent logic (lib/agent.ts) is identical either way.

import { sendDailyCheckIn } from "./agent";

const DEMO_PATIENT = process.env.CARELOOP_WHATSAPP_PATIENT ?? "patient-mrs-chan";

export function startScheduler(): void {
  const g = globalThis as unknown as { __careloopScheduler?: boolean };
  if (g.__careloopScheduler) return; // guard against hot-reload double-start
  g.__careloopScheduler = true;

  const time = process.env.CARELOOP_CHECKIN_TIME; // e.g. "08:00"
  if (!time || !/^\d{2}:\d{2}$/.test(time)) {
    console.log("[careloop] scheduler off (set CARELOOP_CHECKIN_TIME=HH:MM to enable).");
    return;
  }
  const tz = process.env.CARELOOP_TZ ?? "Asia/Hong_Kong";

  let lastFiredDay = "";
  setInterval(async () => {
    const now = new Date();
    const hhmm = now.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: tz,
    });
    const day = now.toLocaleDateString("en-CA", { timeZone: tz });
    if (hhmm === time && lastFiredDay !== day) {
      lastFiredDay = day;
      const r = await sendDailyCheckIn(DEMO_PATIENT);
      console.log(
        `[careloop] scheduled daily check-in ${r.ok ? `sent to ${r.to}` : `skipped (${r.error})`}`,
      );
    }
  }, 30_000);

  console.log(`[careloop] daily check-in scheduled at ${time} (${tz}).`);
}
