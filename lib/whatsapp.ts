// Outbound WhatsApp send via the Twilio REST API (server-only).
//
// Used by the agent to INITIATE the daily check-in (the morning prompt). In the
// Twilio sandbox, outbound freeform messages reach any number that has joined
// the sandbox. Credentials come from env; if they're missing, this returns a
// clear error instead of throwing.

export interface SendResult {
  ok: boolean;
  sid?: string;
  error?: string;
}

export async function sendWhatsApp(to: string, body: string): Promise<SendResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM ?? "whatsapp:+14155238886"; // sandbox number
  if (!sid || !token) return { ok: false, error: "Twilio credentials not set (.env.local)" };

  const toAddr = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;
  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ From: from, To: toAddr, Body: body }).toString(),
    });
    const data = (await res.json().catch(() => ({}))) as { sid?: string; message?: string };
    if (!res.ok) return { ok: false, error: data.message ?? `Twilio error ${res.status}` };
    return { ok: true, sid: data.sid };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "send failed" };
  }
}
