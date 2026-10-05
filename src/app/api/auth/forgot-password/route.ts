import { NextRequest } from "next/server";
import { z } from "zod";
import { ok, fail, handleRouteError } from "@/lib/api-utils";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const schema = z.object({ email: z.string().email() });

// PROTOTYPE: password reset is simulated. A real deployment would send a signed
// reset link via an email provider. No email is actually sent here.
export async function POST(req: NextRequest) {
  try {
    const rl = rateLimit(`forgot:${clientIp(req)}`, 5, 60_000);
    if (!rl.allowed) return fail("Too many attempts. Please try again shortly.", 429);
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return fail("Enter a valid email address", 422);
    return ok({
      message: "If an account exists for this email, a password reset link has been sent (simulated in this demo build).",
      simulated: true,
    });
  } catch (e) {
    return handleRouteError(e);
  }
}
