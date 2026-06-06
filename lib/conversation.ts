// Conversational daily check-in agent — state + policy (server-only).
//
// Holds the WhatsApp message thread and the in-progress check-in "session" per
// patient/day. The agent POLICY (which fields are required, when the check-in is
// complete, when to escalate) is DETERMINISTIC. AI is used only for language
// (symptom extraction + follow-up wording). The risk engine is untouched — it
// still only ever sees structured check-ins.

import { getPatient } from "./store";
import type { ExtractedCheckIn } from "./symptomExtraction";
import type { Severity } from "./types";

export type Lang = "zh" | "en";
export type Direction = "inbound" | "outbound";
export type MessageKind = "text" | "voice" | "system";
export type FieldKey = "mood" | "sob" | "swelling" | "dizziness" | "chest" | "meds";

export interface Message {
  id: string;
  patient_id: string;
  created_at: string;
  direction: Direction;
  channel: "whatsapp";
  kind: MessageKind;
  body: string;
  language: Lang;
  transcript_source?: "text" | "stt" | "pinned";
  extracted?: ExtractedCheckIn;
  severity_after?: Severity;
}

export interface Collected {
  mood: string | null;
  shortness_of_breath: boolean | null;
  swelling: boolean | null;
  dizziness: boolean | null;
  chest_discomfort: boolean | null;
  medication_taken: boolean | null;
  weight_kg: number | null;
}

export interface CheckInSession {
  patient_id: string;
  date: string;
  status: "in_progress" | "complete" | "escalated";
  collected: Collected;
  required: FieldKey[];
  pending_field: FieldKey | null;
  updated_at: string;
}

interface ConvoState {
  sessions: Record<string, CheckInSession>;
  messages: Message[];
  phones: Record<string, string>; // patientId -> last-seen WhatsApp number
  senders: Record<string, string>; // WhatsApp number -> assigned patientId
}

const g = globalThis as unknown as { __careloopConvo?: ConvoState };
function state(): ConvoState {
  if (!g.__careloopConvo)
    g.__careloopConvo = { sessions: {}, messages: [], phones: {}, senders: {} };
  return g.__careloopConvo;
}

/** Clear conversation state for a clean demo. Keeps captured phone numbers so
 * the outbound "send check-in" still works after a reset. */
export function resetConversations(): void {
  const phones = g.__careloopConvo?.phones ?? {};
  g.__careloopConvo = { sessions: {}, messages: [], phones, senders: {} };
}

// Map an inbound WhatsApp number to a patient. If CARELOOP_WHATSAPP_PATIENT is
// set, everyone maps to it (focused presenter demo). Otherwise each new sender
// is stickily assigned to a different demo patient — judge self-serve, no
// collisions.
const ASSIGN_POOL = [
  "patient-mrs-chan",
  "patient-mr-lee",
  "patient-mrs-wong",
  "patient-mr-ho",
  "patient-mrs-lam",
];
export function assignPatientForSender(from: string): string {
  const fixed = process.env.CARELOOP_WHATSAPP_PATIENT;
  if (fixed) return fixed;
  const s = state();
  if (from && s.senders[from]) return s.senders[from];
  const used = new Set(Object.values(s.senders));
  const next =
    ASSIGN_POOL.find((p) => !used.has(p)) ??
    ASSIGN_POOL[Object.keys(s.senders).length % ASSIGN_POOL.length];
  if (from) s.senders[from] = next;
  return next;
}

// --- field metadata -------------------------------------------------------

const CONDITION_SYMPTOMS: Record<string, FieldKey[]> = {
  "heart failure": ["sob", "swelling"],
  COPD: ["sob"],
  diabetes: ["dizziness"],
  "post-stroke recovery": ["dizziness"],
  "kidney disease": ["swelling"],
  hypertension: [],
};

const COLLECTED_KEY: Record<FieldKey, keyof Collected> = {
  mood: "mood",
  sob: "shortness_of_breath",
  swelling: "swelling",
  dizziness: "dizziness",
  chest: "chest_discomfort",
  meds: "medication_taken",
};

export const FIELD_QUESTION: Record<FieldKey, { zh: string; en: string }> = {
  mood: { zh: "今日覺得點呀？", en: "How are you feeling today?" },
  sob: { zh: "今日有冇覺得氣促？", en: "Any shortness of breath today?" },
  swelling: { zh: "對腳或腳踝有冇腫？", en: "Any swelling in your legs or feet?" },
  dizziness: { zh: "有冇頭暈？", en: "Any dizziness?" },
  chest: { zh: "胸口有冇唔舒服？", en: "Any chest discomfort?" },
  meds: { zh: "今日食咗藥未？", en: "Have you taken your medicine today?" },
};

/** Condition-aware required field set: mood + condition symptoms + medication. */
export function requiredFields(conditions: string[]): FieldKey[] {
  const set = new Set<FieldKey>(["mood"]);
  for (const c of conditions) (CONDITION_SYMPTOMS[c] ?? []).forEach((k) => set.add(k));
  if (set.size === 1) {
    set.add("sob");
    set.add("swelling");
  }
  set.add("meds");
  const order: FieldKey[] = ["mood", "sob", "swelling", "dizziness", "chest", "meds"];
  return order.filter((k) => set.has(k));
}

export function questionFor(field: FieldKey, lang: Lang): string {
  return FIELD_QUESTION[field][lang];
}

// --- sessions -------------------------------------------------------------

function nowIso(): string {
  return new Date().toISOString();
}
function genId(prefix: string): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `${prefix}-${rand}`;
}
function emptyCollected(): Collected {
  return {
    mood: null,
    shortness_of_breath: null,
    swelling: null,
    dizziness: null,
    chest_discomfort: null,
    medication_taken: null,
    weight_kg: null,
  };
}

export function getOrCreateSession(patientId: string, date: string): CheckInSession {
  const s = state();
  const key = `${patientId}:${date}`;
  if (!s.sessions[key]) {
    const patient = getPatient(patientId);
    s.sessions[key] = {
      patient_id: patientId,
      date,
      status: "in_progress",
      collected: emptyCollected(),
      required: requiredFields(patient?.conditions ?? []),
      pending_field: null,
      updated_at: nowIso(),
    };
  }
  return s.sessions[key];
}

export function getSession(patientId: string, date: string): CheckInSession | undefined {
  return state().sessions[`${patientId}:${date}`];
}

/** Merge an extraction into the session — only fields the patient actually
 * mentioned (non-null) update; nothing previously reported is erased. */
export function mergeExtraction(session: CheckInSession, ex: ExtractedCheckIn): void {
  const c = session.collected;
  if (ex.mood !== null) c.mood = ex.mood;
  if (ex.shortness_of_breath !== null) c.shortness_of_breath = ex.shortness_of_breath;
  if (ex.swelling !== null) c.swelling = ex.swelling;
  if (ex.dizziness !== null) c.dizziness = ex.dizziness;
  if (ex.chest_discomfort !== null) c.chest_discomfort = ex.chest_discomfort;
  if (ex.medication_taken !== null) c.medication_taken = ex.medication_taken;
  if (ex.weight_kg !== null) c.weight_kg = ex.weight_kg;
  session.updated_at = nowIso();
}

export function missingFields(session: CheckInSession): FieldKey[] {
  return session.required.filter((f) => session.collected[COLLECTED_KEY[f]] === null);
}

// --- message log ----------------------------------------------------------

export function appendMessage(m: Omit<Message, "id" | "created_at">): Message {
  const msg: Message = { ...m, id: genId("msg"), created_at: nowIso() };
  state().messages.push(msg);
  return msg;
}

export function getThread(patientId: string): Message[] {
  return state().messages.filter((m) => m.patient_id === patientId);
}

export function getAllMessages(): Message[] {
  return [...state().messages];
}

// --- patient phone capture + agent-initiated session ----------------------

export function setPatientPhone(patientId: string, phone: string): void {
  if (phone) state().phones[patientId] = phone;
}
export function getPatientPhone(patientId: string): string | undefined {
  return state().phones[patientId];
}

/** Start a fresh daily check-in session — used when the agent sends the morning
 * prompt. Resets today's collected data and waits on the mood answer. */
export function beginSession(patientId: string, date: string): CheckInSession {
  const s = state();
  const patient = getPatient(patientId);
  const session: CheckInSession = {
    patient_id: patientId,
    date,
    status: "in_progress",
    collected: emptyCollected(),
    required: requiredFields(patient?.conditions ?? []),
    pending_field: "mood",
    updated_at: nowIso(),
  };
  s.sessions[`${patientId}:${date}`] = session;
  return session;
}
