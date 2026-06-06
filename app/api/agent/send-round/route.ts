import { sendDailyCheckInRound } from "@/lib/agent";

export const dynamic = "force-dynamic";

// POST /api/agent/send-round — the agent's daily round: message every patient we
// have a WhatsApp number for. (Demo trigger for the "morning round"; the
// scheduler does the same automatically.)
export async function POST() {
  const result = await sendDailyCheckInRound();
  return Response.json(result);
}
