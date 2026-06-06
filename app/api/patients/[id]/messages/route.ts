import { getThread } from "@/lib/conversation";

export const dynamic = "force-dynamic";

// GET /api/patients/:id/messages — the WhatsApp conversation thread (inbound +
// outbound), with the symptom extraction per inbound message. Polled by the
// conversation panel for a live view.
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return Response.json({ messages: getThread(id) });
}
