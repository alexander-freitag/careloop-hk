// Follow-up wording for the check-in agent (server-only).
//
// When the deterministic policy decides a follow-up question is needed, Claude
// phrases ONE warm, natural question in the patient's language. If no API key /
// the call fails, a fixed template question is used — so the agent never stalls.
// The DECISION of what to ask is made deterministically in lib/conversation.

import Anthropic from "@anthropic-ai/sdk";
import { FIELD_QUESTION, type FieldKey, type Lang } from "./conversation";

export async function generateFollowUp(
  field: FieldKey,
  lang: Lang,
  patientName: string,
): Promise<string> {
  const fallback = FIELD_QUESTION[field][lang];
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return fallback;

  try {
    const client = new Anthropic({ apiKey });
    const model = process.env.CARELOOP_EXTRACT_MODEL ?? "claude-sonnet-4-6";
    const langName =
      lang === "zh"
        ? "natural spoken Hong Kong Cantonese (Traditional Chinese characters)"
        : "plain English";
    const msg = await client.messages.create({
      model,
      max_tokens: 120,
      system: [
        {
          type: "text",
          text: `You are CareLoop, a warm daily check-in assistant messaging an elderly Hong Kong patient on WhatsApp. Ask exactly ONE short, friendly follow-up question to learn the missing info. One sentence, caring tone, no medical advice, no diagnosis. Write in ${langName}. Output only the question.`,
        },
      ],
      messages: [
        {
          role: "user",
          content: `Patient: ${patientName}. We still need to know: "${FIELD_QUESTION[field].en}". Write the single follow-up question.`,
        },
      ],
    });
    const text = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    return text || fallback;
  } catch {
    return fallback;
  }
}

/** Closing confirmation, in the patient's language. */
export function confirmationReply(status: "escalated" | "complete", lang: Lang): string {
  if (status === "escalated") {
    return lang === "zh"
      ? "多謝你嘅報到！我哋會安排護士今日跟進，亦會通知你嘅家人。🙏"
      : "Thank you for checking in! We'll have a nurse follow up today and let your family know. 🙏";
  }
  return lang === "zh"
    ? "多謝你嘅報到！今日嘅報到完成，一切正常。💚"
    : "Thank you! Your check-in is complete and everything looks fine today. 💚";
}

/** Closing message written by Claude in the patient's language. Falls back to
 * the template above only if the API key is missing or the call fails, so the
 * agent never stalls — but in normal operation Claude writes every message. */
export async function generateConfirmation(
  status: "escalated" | "complete",
  lang: Lang,
  patientName: string,
  concerns: string[],
): Promise<string> {
  const fallback = confirmationReply(status, lang);
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return fallback;

  try {
    const client = new Anthropic({ apiKey });
    const model = process.env.CARELOOP_EXTRACT_MODEL ?? "claude-sonnet-4-6";
    const langName =
      lang === "zh"
        ? "natural spoken Hong Kong Cantonese (Traditional Chinese characters)"
        : "plain English";
    const situation =
      status === "escalated"
        ? `Their check-in is done and has been flagged for nurse review${concerns.length ? ` (noted: ${concerns.join(", ")})` : ""}. Reassure them warmly that a nurse will follow up today and their family will be told.`
        : `Their check-in is complete and nothing concerning came up. Thank them warmly and encourage them to keep checking in daily.`;
    const msg = await client.messages.create({
      model,
      max_tokens: 160,
      system: [
        {
          type: "text",
          text: `You are CareLoop, a warm daily check-in assistant on WhatsApp for an elderly Hong Kong patient. Write ONE short closing message (1-2 sentences), caring and human, in ${langName}. No diagnosis, no medical advice, no medication instructions. Output only the message.`,
        },
      ],
      messages: [{ role: "user", content: `Patient: ${patientName}. ${situation}` }],
    });
    const text = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    return text || fallback;
  } catch {
    return fallback;
  }
}
