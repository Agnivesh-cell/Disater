import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail, handleRouteError } from "@/lib/api-utils";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
});

export async function POST(req: NextRequest) {
  try {
    const rl = rateLimit(`register:${clientIp(req)}`, 8, 60_000);
    if (!rl.allowed) return fail("Too many attempts. Please try again shortly.", 429);

    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Invalid input", 422);
    }
    const email = parsed.data.email.toLowerCase().trim();

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) return fail("An account with this email already exists", 409);

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    const user = await db.user.create({
      data: {
        email,
        name: parsed.data.name.trim(),
        passwordHash,
        role: "USER",
      },
      select: { id: true, email: true, name: true },
    });

    // create empty profile + default checklist
    await db.profile.create({ data: { userId: user.id } });
    const { DEFAULT_CHECKLIST } = await import("@/lib/constants");
    await db.preparednessChecklist.createMany({
      data: DEFAULT_CHECKLIST.map((c) => ({ userId: user.id, itemKey: c.itemKey, label: c.label, category: c.category })),
    });

    return ok({ user }, 201);
  } catch (e) {
    return handleRouteError(e);
  }
}
