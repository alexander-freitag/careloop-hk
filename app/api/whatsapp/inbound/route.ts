import { assignPatientForSender, setPatientPhone } from "@/lib/conversation";
import { ingestCheckInMessage } from "@/lib/ingest";

export const dynamic = "force-dynamic";

const XML_ESCAPE: Record<string, string> = {
  "<": "&lt;",
  ">": "&gt;",
  "&": "&amp;",
  "'": "&apos;",
  '"': "&quot;",
};
function twiml(message: string): Response {
  const safe = message.replace(/[<>&'"]/g, (c) => XML_ESCAPE[c] ?? c);
  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${safe}</Message></Response>`;
  return new Response(xml, { headers: { "Content-Type": "text/xml; charset=utf-8" } });
}

// POST /api/whatsapp/inbound — Twilio WhatsApp inbound webhook.
//
// The conversational check-in agent (lib/ingest -> lib/conversation) handles the
// message: STT if it's a voice note, AI symptom extraction, the deterministic
// engine, and it decides the reply — a follow-up question when info is still
// missing, or a confirmation (complete / escalated). The reply is returned as
// TwiML, closing the loop right back in the patient's WhatsApp chat.
export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return twiml("多謝！我哋暫時處理唔到你嘅訊息，請再試一次。");
  }

  const body = (form.get("Body")?.toString() ?? "").trim();
  const numMedia = Number.parseInt(form.get("NumMedia")?.toString() ?? "0", 10) || 0;

  // Map the sender to a patient (sticky), and remember the number so the agent
  // can message them first next time.
  const from = form.get("From")?.toString() ?? "";
  const patientId = assignPatientForSender(from);
  if (from) setPatientPhone(patientId, from);

  let audioUrl: string | null = null;
  let audioContentType: string | null = null;
  if (numMedia > 0) {
    const ct = form.get("MediaContentType0")?.toString() ?? "";
    if (ct.startsWith("audio")) {
      audioUrl = form.get("MediaUrl0")?.toString() ?? null;
      audioContentType = ct;
    }
  }

  const result = await ingestCheckInMessage({
    patientId,
    text: body,
    audioUrl,
    audioContentType,
  });
  if (!result) {
    return twiml("多謝！我哋收到咗你嘅訊息。Thank you — we've received your message.");
  }
  return twiml(result.reply);
}
