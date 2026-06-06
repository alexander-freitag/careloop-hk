"use client";

// Live WhatsApp conversation panel — the patient's chat thread + the symptom
// extraction per inbound message. Polls /api/patients/:id/messages so it updates
// in real time when a message arrives (judge self-serve moment). Decoupled from
// the server-only conversation store (local types, plain fetch).

import { useEffect, useRef, useState } from "react";
import { Mic } from "lucide-react";
import { cn } from "@/lib/utils";

interface Extracted {
  shortness_of_breath: boolean | null;
  swelling: boolean | null;
  dizziness: boolean | null;
  chest_discomfort: boolean | null;
  medication_taken: boolean | null;
}
interface ConvoMessage {
  id: string;
  direction: "inbound" | "outbound";
  kind: "text" | "voice" | "system";
  body: string;
  transcript_source?: "text" | "stt" | "pinned";
  extracted?: Extracted;
}

const SYMPTOM_LABEL: { key: keyof Extracted; label: string }[] = [
  { key: "shortness_of_breath", label: "breathless" },
  { key: "swelling", label: "swelling" },
  { key: "dizziness", label: "dizzy" },
  { key: "chest_discomfort", label: "chest" },
];

function chips(ex?: Extracted): string[] {
  if (!ex) return [];
  const out = SYMPTOM_LABEL.filter((s) => ex[s.key] === true).map((s) => s.label);
  if (ex.medication_taken === false) out.push("missed meds");
  return out;
}

export function ConversationPanel({
  patientId,
  onActivity,
}: {
  patientId: string;
  onActivity?: () => void;
}) {
  const [messages, setMessages] = useState<ConvoMessage[]>([]);
  const seen = useRef(0);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await fetch(`/api/patients/${patientId}/messages`);
        if (!res.ok || !alive) return;
        const data = (await res.json()) as { messages: ConvoMessage[] };
        if (!alive) return;
        setMessages(data.messages);
        if (data.messages.length > seen.current) {
          if (seen.current > 0) onActivity?.(); // new message arrived -> refresh risk
          seen.current = data.messages.length;
        }
      } catch {
        /* keep last good state */
      }
    }
    load();
    const t = setInterval(load, 3000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [patientId, onActivity]);

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-base">💬</span>
        <h2 className="font-semibold">WhatsApp check-in</h2>
        <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="size-1.5 animate-pulse rounded-full bg-green-500" /> live
        </span>
      </div>

      {messages.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Waiting for the patient&apos;s WhatsApp reply…
        </p>
      ) : (
        <div className="space-y-2.5">
          {messages.map((m) => {
            const isPatient = m.direction === "inbound";
            const tags = isPatient ? chips(m.extracted) : [];
            return (
              <div key={m.id} className={cn("flex", isPatient ? "justify-start" : "justify-end")}>
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                    isPatient
                      ? "rounded-tl-sm bg-muted text-foreground"
                      : "rounded-tr-sm bg-[#dcf8c6] text-neutral-800",
                  )}
                >
                  {m.kind === "voice" && (
                    <span className="mb-1 flex items-center gap-1 text-xs opacity-70">
                      <Mic className="size-3" /> voice note
                      {m.transcript_source === "pinned" ? " (demo)" : ""}
                    </span>
                  )}
                  <p className="whitespace-pre-wrap leading-relaxed">{m.body}</p>
                  {tags.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800"
                        >
                          {t} ✓
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
