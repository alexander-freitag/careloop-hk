// Conversational check-in ingestion (server-only).
//
//   message (text or voice note)
//     -> [STT if audio]            lib/stt.ts
//     -> context-aware extraction  lib/symptomExtraction.ts   (AI = language)
//     -> merge into the day's session   lib/conversation.ts   (deterministic)
//     -> submitCheckIn             lib/store.ts               (engine = severity)
//     -> decide reply: follow-up question if info missing,
//        or a confirmation (complete / escalated)
//
// One pipeline shared by the Twilio webhook today and any future entry point.

import {
  appendMessage,
  getOrCreateSession,
  mergeExtraction,
  missingFields,
  questionFor,
  saveSession,
  type Lang,
} from "./conversation";
import { generateConfirmation, generateFollowUp } from "./followup";
import { WEEK_END } from "./seed";
import { getPatient, submitCheckIn } from "./store";
import { extractSymptoms } from "./symptomExtraction";
import { SEVERITY_ORDER, type RiskResult } from "./types";
import { transcribeAudio } from "./stt";

// Used only when a voice note arrives but no STT provider is configured.
export const PINNED_DEMO_TRANSCRIPT =
  "今日有啲氣促，行幾步就要抖，對腳同腳踝腫咗，今日又唔記得食藥。";

export interface IngestInput {
  patientId: string;
  text?: string | null;
  audioUrl?: string | null;
  audioContentType?: string | null;
}

export interface IngestResult {
  reply: string;
  transcript: string;
  transcript_source: "text" | "stt" | "pinned";
  language: Lang;
  status: "in_progress" | "complete" | "escalated";
  risk: RiskResult;
}

function detectLang(text: string): Lang {
  return /[一-鿿]/.test(text) ? "zh" : "en";
}

export async function ingestCheckInMessage(input: IngestInput): Promise<IngestResult | null> {
  const patient = await getPatient(input.patientId);
  if (!patient) return null;
  const date = WEEK_END;

  // 1. resolve transcript (text, or STT for a voice note, or pinned fallback)
  let transcript = (input.text ?? "").trim();
  let transcript_source: IngestResult["transcript_source"] = "text";
  let kind: "text" | "voice" = "text";
  if (!transcript && input.audioUrl) {
    kind = "voice";
    const stt = await transcribeAudio(input.audioUrl, input.audioContentType ?? undefined);
    if (stt) {
      transcript = stt;
      transcript_source = "stt";
    } else {
      transcript = PINNED_DEMO_TRANSCRIPT;
      transcript_source = "pinned";
    }
  }
  if (!transcript) return null;
  const language = detectLang(transcript);

  // 2. session + context-aware extraction (knows what we last asked)
  const session = await getOrCreateSession(input.patientId, date);
  const context = session.pending_field ? questionFor(session.pending_field, language) : undefined;
  const extracted = await extractSymptoms(transcript, context);
  mergeExtraction(session, extracted);

  // 3. derive the structured check-in from the accumulated session, run engine
  const c = session.collected;
  const result = await submitCheckIn(
    input.patientId,
    {
      date,
      mood: c.mood ?? undefined,
      shortness_of_breath: c.shortness_of_breath ?? undefined,
      swelling: c.swelling ?? undefined,
      dizziness: c.dizziness ?? undefined,
      chest_discomfort: c.chest_discomfort ?? undefined,
      medication_taken: c.medication_taken ?? undefined,
      weight: c.weight_kg ?? undefined,
      free_text_note: transcript,
      source: "web_form",
    },
    "WhatsApp (patient)",
  );
  if (!result) return null;

  // 4. log the inbound message (with what was extracted + the resulting risk)
  await appendMessage({
    patient_id: input.patientId,
    direction: "inbound",
    channel: "whatsapp",
    kind,
    body: transcript,
    language,
    transcript_source,
    extracted,
    severity_after: result.risk.severity,
  });

  // 5. policy: finish the WHOLE check-in first. Keep asking the still-missing
  // required fields (empathetically), and only close once the form is complete.
  // Severity is recomputed every message, so the nurse alert fires immediately
  // regardless — but the conversation keeps its red thread and gathers everything
  // before wrapping up, instead of cutting off after the first red-flag symptom.
  let reply: string;
  const missing = missingFields(session);
  if (missing.length > 0) {
    const field = missing[0];
    session.pending_field = field;
    session.status = "in_progress";
    reply = await generateFollowUp(field, language, patient.name, transcript);
  } else {
    const redFlag = SEVERITY_ORDER[result.risk.severity] >= SEVERITY_ORDER.review_today;
    session.status = redFlag ? "escalated" : "complete";
    session.pending_field = null;
    reply = await generateConfirmation(
      redFlag ? "escalated" : "complete",
      language,
      patient.name,
      result.risk.reason_tags,
    );
  }

  // 6. persist the updated session, then log the outbound reply
  await saveSession(session);
  await appendMessage({
    patient_id: input.patientId,
    direction: "outbound",
    channel: "whatsapp",
    kind: "text",
    body: reply,
    language,
  });

  return { reply, transcript, transcript_source, language, status: session.status, risk: result.risk };
}
