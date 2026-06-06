// Speech-to-text (server-only) — Cantonese / English voice note -> text.
//
// Provider-agnostic and pluggable. Uses Groq (free Whisper) if GROQ_API_KEY is
// set, else OpenAI if OPENAI_API_KEY is set — both expose the same
// OpenAI-compatible /audio/transcriptions endpoint. If neither is configured
// (or the call fails) this returns null and the caller falls back to a pinned
// demo transcript, so the voice pipeline is always demoable and goes fully live
// the moment a key is added. No STT provider ever decides severity; it only
// produces text for the deterministic engine downstream.

interface SttProvider {
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
}

function resolveProvider(): SttProvider | null {
  const groq = process.env.GROQ_API_KEY;
  if (groq) {
    return {
      name: "groq",
      baseUrl: "https://api.groq.com/openai/v1",
      apiKey: groq,
      model: process.env.CARELOOP_STT_MODEL ?? "whisper-large-v3",
    };
  }
  const openai = process.env.OPENAI_API_KEY;
  if (openai) {
    return {
      name: "openai",
      baseUrl: "https://api.openai.com/v1",
      apiKey: openai,
      model: process.env.CARELOOP_STT_MODEL ?? "whisper-1",
    };
  }
  return null;
}

/** Transcribe a remote audio file. Returns null when STT is unavailable. */
export async function transcribeAudio(
  url: string,
  contentType?: string,
): Promise<string | null> {
  const provider = resolveProvider();
  if (!provider) return null;

  try {
    // Twilio media URLs require HTTP basic auth with the account credentials.
    const headers: Record<string, string> = {};
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (sid && token && url.includes("twilio.com")) {
      headers.Authorization = "Basic " + Buffer.from(`${sid}:${token}`).toString("base64");
    }

    const audioRes = await fetch(url, { headers });
    if (!audioRes.ok) throw new Error(`media download failed (${audioRes.status})`);
    const buf = await audioRes.arrayBuffer();

    const form = new FormData();
    form.append("file", new Blob([buf], { type: contentType || "audio/ogg" }), "voice-note.ogg");
    form.append("model", provider.model);
    // Default: let Whisper auto-detect (handles English test memos AND
    // Cantonese). Set CARELOOP_STT_LANGUAGE=zh to bias toward Chinese for the
    // Cantonese demo.
    const language = process.env.CARELOOP_STT_LANGUAGE;
    if (language) form.append("language", language);

    const sttRes = await fetch(`${provider.baseUrl}/audio/transcriptions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${provider.apiKey}` },
      body: form,
    });
    if (!sttRes.ok) {
      const detail = await sttRes.text().catch(() => "");
      throw new Error(`${provider.name} STT failed (${sttRes.status}) ${detail}`);
    }
    const data = (await sttRes.json()) as { text?: string };
    return data.text?.trim() || null;
  } catch (err) {
    console.error("[careloop] STT failed; caller will fall back to pinned transcript.", err);
    return null;
  }
}
