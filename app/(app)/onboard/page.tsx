import QRCode from "qrcode";

export const dynamic = "force-dynamic";

// Twilio sandbox number + join code (overridable; defaults from the sandbox).
const NUMBER = process.env.CARELOOP_WHATSAPP_SANDBOX_NUMBER ?? "14155238886";
const JOIN_CODE = process.env.CARELOOP_WHATSAPP_JOIN_CODE ?? "bell-iron";

// Onboarding: scanning the QR opens WhatsApp to the CareLoop number with the
// join message prefilled. Once the patient sends it (and then any message), the
// inbound webhook captures their number and assigns them a patient — that's how
// the backend learns who it may message.
export default async function OnboardPage() {
  const joinText = `join ${JOIN_CODE}`;
  const waUrl = `https://wa.me/${NUMBER}?text=${encodeURIComponent(joinText)}`;
  const qrSvg = await QRCode.toString(waUrl, { type: "svg", margin: 1, width: 240 });
  const displayNumber = `+${NUMBER.replace(/^\+/, "")}`;

  return (
    <div className="mx-auto max-w-lg space-y-6 py-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Start your daily check-in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Scan with your phone — CareLoop runs inside WhatsApp. No app to install.
        </p>
      </div>

      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6">
        <div
          className="rounded-xl bg-white p-3 [&>svg]:size-56"
          dangerouslySetInnerHTML={{ __html: qrSvg }}
        />
        <p className="text-xs text-muted-foreground">Opens WhatsApp to {displayNumber}</p>
      </div>

      <ol className="space-y-3">
        <li className="flex gap-3 text-sm">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            1
          </span>
          <span>
            Scan → WhatsApp opens with “<span className="font-medium">{joinText}</span>”. Send it to
            connect.
          </span>
        </li>
        <li className="flex gap-3 text-sm">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            2
          </span>
          <span>
            Then reply how you feel — type or send a Cantonese voice note (e.g. “今日有啲氣促，對腳腫咗”).
          </span>
        </li>
      </ol>

      <p className="text-center text-xs text-muted-foreground">
        Or message {displayNumber} on WhatsApp with “{joinText}”.
        <br />
        CareLoop is monitoring support — not a diagnosis or treatment tool.
      </p>
    </div>
  );
}
