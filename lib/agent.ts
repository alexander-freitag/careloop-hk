// Check-in agent — outbound initiation (server-only).
//
// sendDailyCheckIn() is the "we message first" step: it sends the bilingual
// morning prompt to a patient's WhatsApp and opens a fresh session waiting on
// their reply. Shared by the manual trigger (button / API) and the scheduler
// (lib/scheduler.ts), so both behave identically.

import { appendMessage, beginSession, getPatientPhone } from "./conversation";
import { WEEK_END } from "./seed";
import { getPatient, getPatients } from "./store";
import { sendWhatsApp } from "./whatsapp";

const ZH_SURNAME: Record<string, string> = { Chan: "陳", Lee: "李", Wong: "黃", Ho: "何", Lam: "林" };
function zhName(name: string): string {
  const m = name.match(/^(Mrs?\.)\s+(\w+)/);
  if (m) {
    const honorific = m[1].toLowerCase().startsWith("mrs") ? "女士" : "先生";
    const surname = ZH_SURNAME[m[2]];
    if (surname) return `${surname}${honorific}`;
  }
  return name;
}

export interface DailyCheckInResult {
  ok: boolean;
  to?: string;
  sid?: string;
  error?: string;
}

export async function sendDailyCheckIn(patientId: string): Promise<DailyCheckInResult> {
  const patient = await getPatient(patientId);
  if (!patient) return { ok: false, error: "Patient not found" };

  const to = (await getPatientPhone(patientId)) ?? process.env.CARELOOP_DEMO_PATIENT_PHONE;
  if (!to) {
    return {
      ok: false,
      error:
        "No patient phone known yet. Set CARELOOP_DEMO_PATIENT_PHONE in .env.local, or have the patient send one WhatsApp message first so we capture the number.",
    };
  }

  const zh = zhName(patient.name);
  const prompt =
    `早晨，${zh}。係時候做你今日嘅每日報到。今日覺得點呀？\n\n` +
    `Good morning, ${patient.name}. It is time for your daily check-in. How are you feeling today?`;

  const sent = await sendWhatsApp(to, prompt);
  if (!sent.ok) return { ok: false, error: sent.error };

  await beginSession(patientId, WEEK_END);
  await appendMessage({
    patient_id: patientId,
    direction: "outbound",
    channel: "whatsapp",
    kind: "text",
    body: prompt,
    language: "zh",
  });

  return { ok: true, to, sid: sent.sid };
}

/** The agent's daily "round": message every patient we have a WhatsApp number
 * for. The scheduler can call this; the demo triggers it with a button. */
export async function sendDailyCheckInRound(): Promise<{
  sent: number;
  total: number;
  results: (DailyCheckInResult & { patientId: string })[];
}> {
  const patients = await getPatients();
  const targets: typeof patients = [];
  for (const p of patients) {
    if (await getPatientPhone(p.id)) targets.push(p);
  }
  const results: (DailyCheckInResult & { patientId: string })[] = [];
  for (const p of targets) {
    results.push({ patientId: p.id, ...(await sendDailyCheckIn(p.id)) });
  }
  return { sent: results.filter((r) => r.ok).length, total: targets.length, results };
}
