// Symptom extraction (server-only).
//
// Turns a free-text daily check-in message (Cantonese or English, e.g. from a
// WhatsApp message or a transcribed voice note) into the structured check-in
// fields the DETERMINISTIC risk engine consumes. AI is used ONLY to understand
// language — it never decides severity, never diagnoses, never invents data.
// If ANTHROPIC_API_KEY is missing or the call fails, a deterministic keyword
// matcher is used instead, so the pipeline never hard-fails.

import Anthropic from "@anthropic-ai/sdk";

export interface ExtractedCheckIn {
  mood: "good" | "okay" | "tired" | "unwell" | null;
  shortness_of_breath: boolean | null;
  swelling: boolean | null;
  dizziness: boolean | null;
  chest_discomfort: boolean | null;
  medication_taken: boolean | null;
  weight_kg: number | null;
  /** one short factual English line of what the patient reported */
  summary: string;
  /** how this was produced, for transparency in the demo / audit */
  extracted_by: "ai" | "keywords";
}

const SYSTEM_PROMPT = `You convert ONE daily health check-in message from an elderly Hong Kong chronic-care patient (usually Cantonese, sometimes English) into structured monitoring fields.

You are NOT diagnosing and NOT giving advice. You only map what the patient explicitly says onto a fixed schema.

Return ONLY a JSON object (no markdown, no prose) with exactly these keys:
{
  "mood": "good" | "okay" | "tired" | "unwell" | null,
  "shortness_of_breath": true | false | null,
  "swelling": true | false | null,
  "dizziness": true | false | null,
  "chest_discomfort": true | false | null,
  "medication_taken": true | false | null,
  "weight_kg": number | null,
  "summary": "one short factual English line of what they reported"
}

Rules:
- Use null when the patient did not mention that item. Do NOT guess.
- shortness_of_breath = true for breathlessness (氣促 / 氣喘 / 喘 / 唞唔到氣 / short of breath / breathless).
- swelling = true for swelling in legs/feet/ankles (腫 / 水腫 / 腳腫).
- dizziness = true for 頭暈 / 暈 / dizzy / lightheaded.
- chest_discomfort = true for chest pain or discomfort (胸口痛 / 胸口唔舒服 / chest).
- medication_taken = false if they forgot/missed/did not take medicine (唔記得食藥 / 冇食藥 / 忘記食藥 / missed / forgot / didn't take); true if they confirm taking it (食咗藥 / took my medicine); null if not mentioned.
- weight_kg = a number only if they state a body weight, else null.
- summary = a short neutral English description of what they said. No diagnosis.
Output the JSON only.`;

function stripFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
}

function coerceBool(v: unknown): boolean | null {
  if (v === true) return true;
  if (v === false) return false;
  return null;
}

function normalize(o: Record<string, unknown>, extracted_by: "ai" | "keywords"): ExtractedCheckIn {
  const moods = ["good", "okay", "tired", "unwell"] as const;
  const mood = typeof o.mood === "string" && (moods as readonly string[]).includes(o.mood)
    ? (o.mood as ExtractedCheckIn["mood"])
    : null;
  return {
    mood,
    shortness_of_breath: coerceBool(o.shortness_of_breath),
    swelling: coerceBool(o.swelling),
    dizziness: coerceBool(o.dizziness),
    chest_discomfort: coerceBool(o.chest_discomfort),
    medication_taken: coerceBool(o.medication_taken),
    weight_kg: typeof o.weight_kg === "number" && Number.isFinite(o.weight_kg) ? o.weight_kg : null,
    summary: typeof o.summary === "string" ? o.summary : "",
    extracted_by,
  };
}

/** Deterministic fallback so the pipeline works without an API key. */
export function keywordExtract(message: string): ExtractedCheckIn {
  const m = message;
  const lower = message.toLowerCase();
  const has = (...needles: string[]) =>
    needles.some((n) => m.includes(n) || lower.includes(n.toLowerCase()));

  const sob = has("氣促", "氣喘", "喘", "唞唔到氣", "short of breath", "breathless", "out of breath");
  const swelling = has("水腫", "腳腫", "腫", "swelling", "swollen");
  const dizziness = has("頭暈", "暈", "dizzy", "lightheaded");
  const chest = has("胸口痛", "胸口唔舒服", "胸口", "chest pain", "chest discomfort");

  const missedMed = has("唔記得食藥", "冇食藥", "忘記食藥", "未食藥", "missed", "forgot", "didn't take", "did not take");
  const tookMed = has("食咗藥", "有食藥", "took my medicine", "took my meds", "taken my medicine");
  const medication_taken = missedMed ? false : tookMed ? true : null;

  const weightMatch = message.match(/(\d{2,3}(?:\.\d)?)\s*(?:kg|公斤|kilo)/i);
  const weight_kg = weightMatch ? Number(weightMatch[1]) : null;

  return {
    mood: has("唔舒服", "unwell", "bad") ? "unwell" : has("攰", "tired") ? "tired" : null,
    shortness_of_breath: sob ? true : null,
    swelling: swelling ? true : null,
    dizziness: dizziness ? true : null,
    chest_discomfort: chest ? true : null,
    medication_taken,
    weight_kg,
    summary: message.slice(0, 140),
    extracted_by: "keywords",
  };
}

export async function extractSymptoms(message: string, context?: string): Promise<ExtractedCheckIn> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey && message.trim()) {
    try {
      const client = new Anthropic({ apiKey });
      const model = process.env.CARELOOP_EXTRACT_MODEL ?? "claude-sonnet-4-6";
      const msg = await client.messages.create({
        model,
        max_tokens: 400,
        system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
        messages: [
          {
            role: "user",
            content: `${context ? `We just asked the patient: "${context}". Interpret their reply in that light.\n\n` : ""}Check-in message:\n"""\n${message}\n"""\n\nReturn the JSON object only.`,
          },
        ],
      });
      const text = msg.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("")
        .trim();
      const parsed = JSON.parse(stripFences(text)) as Record<string, unknown>;
      return normalize(parsed, "ai");
    } catch (err) {
      console.error("[careloop] AI symptom extraction failed; using keyword fallback.", err);
    }
  }
  return keywordExtract(message);
}
