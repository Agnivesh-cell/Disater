import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail, handleRouteError, requireUser } from "@/lib/api-utils";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const maxDuration = 60;

const schema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(2000),
      })
    )
    .min(1)
    .max(20),
});

const SYSTEM_PROMPT = `You are "Guardian AI", the safety assistant inside DisasterGuard — a disaster early-warning prototype.

Rules you MUST follow:
1. Give concise, safety-focused, actionable answers (under 180 words unless a checklist is genuinely needed).
2. Use simple language. Prefer short sentences and bullet lists.
3. NEVER pretend to be an emergency authority. Never issue, confirm, or fabricate warnings, predictions, or official notices.
4. NEVER invent an active disaster. You may reference alerts only if the user pastes them; otherwise speak generally.
5. This is a PROTOTYPE: any live-looking data in the app is simulated/demo. Say so when relevant.
6. Always end answers about ongoing risks with: "Follow instructions from your official emergency authorities."
7. For life-threatening situations, first tell the user to call 112 (India national emergency) or their local number.
8. You can help with: understanding disaster types, preparedness kits, evacuation basics, interpreting disaster terminology, and using the DisasterGuard app.
9. Politely refuse questions unrelated to disaster preparedness/safety. Keep refusals short.

Style: calm, clear, encouraging. Use markdown-ish bullets (plain text dashes).`;

// POST /api/ai/assistant — Guardian AI chat
export async function POST(req: NextRequest) {
  try {
    const { session, error } = await requireUser();
    if (error) return error;
    const rl = rateLimit(`guardian:${clientIp(req)}:${session!.id}`, 20, 60_000);
    if (!rl.allowed) return fail("You're chatting fast! Give Guardian AI a moment.", 429);

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return fail("Invalid chat payload", 422);
    const msgs = parsed.data.messages;

    // Attach live app context (active alerts count only — no fabrication)
    const activeCount = await db.alert.count({ where: { status: "ACTIVE" } });
    const criticalActive = await db.alert.count({ where: { status: "ACTIVE", severity: { in: ["HIGH", "CRITICAL"] } } });
    const contextMsg = {
      role: "system" as const,
      content: `App context right now: ${activeCount} active simulated alert(s), of which ${criticalActive} are HIGH/CRITICAL. All app data is DEMO/SIMULATED. The user's name is ${session!.name || "a user"}.`,
    };

    try {
      const ZAI = (await import("z-ai-web-dev-sdk")).default;
      const zai = await ZAI.create();
      const completion = await zai.chat.completions.create({
        messages: [{ role: "system", content: SYSTEM_PROMPT }, contextMsg, ...msgs],
      });
      const content = completion.choices[0]?.message?.content?.trim();
      if (!content) throw new Error("Empty completion");
      return ok({ reply: content, source: "guardian-ai" });
    } catch (e) {
      console.error("[guardian] AI error, falling back:", (e as Error).message);
      return ok({
        reply: fallbackReply(msgs[msgs.length - 1].content),
        source: "offline-knowledge-base",
        note: "Guardian AI is temporarily unavailable — this is the built-in knowledge base reply.",
      });
    }
  } catch (e) {
    return handleRouteError(e);
  }
}

function fallbackReply(q: string): string {
  const t = q.toLowerCase();
  if (t.includes("flood")) {
    return `During a flood, remember the core rules:

- Move to higher ground immediately if you are in a low-lying area.
- Never walk, swim, or drive through moving floodwater — 15 cm can knock you down, 60 cm can float a car.
- Switch off electricity at the main if water enters your home (only if safe to do so).
- Keep documents in waterproof bags and listen to official updates.
- If trapped on a rooftop, signal for help with a bright cloth.

Follow instructions from your official emergency authorities.`;
  }
  if (t.includes("kit") || t.includes("prepare") || t.includes("emergency kit")) {
    return `A good emergency kit covers at least 3 days. Include:

- Drinking water (3 litres per person per day) and dry food
- First-aid kit plus any prescription medicines
- Torch, spare batteries, and a fully charged power bank
- Important documents in a waterproof pouch
- Radio (battery powered), whistle, and some cash
- Essentials for babies, elderly members, or pets

Use the Preparedness Center in DisasterGuard to track your own checklist and score. Follow instructions from your official emergency authorities.`;
  }
  if (t.includes("evacuat")) {
    return `Evacuation basics:

- Leave early — never wait for conditions to worsen.
- Take your go-bag, ID documents, water, and medicines.
- Switch off electricity and gas at the mains (if safe).
- Follow marked routes to official shelters; do not take shortcuts through flooded or damaged areas.
- Message your emergency contacts where you are heading.

Follow instructions from your official emergency authorities.`;
  }
  if (t.includes("warning") || t.includes("my area") || t.includes("under")) {
    return `To check your area: open your Dashboard — the Current Safety Status card shows your region's risk level (LOW / MODERATE / HIGH / CRITICAL) and every active alert affecting you. The Live Map shows affected zones and shelters.

Remember: in this prototype all alerts are clearly-labelled DEMO simulations. For real warnings, always rely on your national/state emergency services. Follow instructions from your official emergency authorities.`;
  }
  return `I can help with flood, earthquake, cyclone, wildfire, heatwave, landslide and lightning safety, building an emergency kit, evacuation planning, and using the DisasterGuard app (alerts, live map, risk analyzer, preparedness checklists).

Note: this build is a prototype with simulated data, and my knowledge base mode is active right now, so my answers are general guidance rather than live analysis.

Follow instructions from your official emergency authorities.`;
}
