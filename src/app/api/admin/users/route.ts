import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail, handleRouteError, requireAdmin, audit } from "@/lib/api-utils";

// GET /api/admin/users
export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;
    const q = req.nextUrl.searchParams.get("q");

    const users = await db.user.findMany({
      where: q ? { OR: [{ name: { contains: q } }, { email: { contains: q } }] } : undefined,
      select: {
        id: true, name: true, email: true, role: true, status: true, onboarded: true, createdAt: true,
        profile: { select: { city: true, region: true, preferredLanguage: true, notifyInApp: true, notifyEmail: true, notifyPush: true, notifySms: true } },
        _count: { select: { notifications: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return ok({ users });
  } catch (e) {
    return handleRouteError(e);
  }
}

const patchSchema = z.object({
  userId: z.string().min(1),
  status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
  role: z.enum(["USER", "ADMIN"]).optional(),
});

// PATCH /api/admin/users — suspend/activate, change role
export async function PATCH(req: NextRequest) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;
    const parsed = patchSchema.safeParse(await req.json());
    if (!parsed.success) return fail("Invalid request", 422);
    const { userId, status, role } = parsed.data;

    const target = await db.user.findUnique({ where: { id: userId } });
    if (!target) return fail("User not found", 404);

    // Guard: cannot demote/suspend yourself
    if (userId === session!.id) return fail("You cannot modify your own account here", 400);

    const updated = await db.user.update({
      where: { id: userId },
      data: { ...(status ? { status } : {}), ...(role ? { role } : {}) },
      select: { id: true, status: true, role: true },
    });
    await audit(session!.id, role && role !== target.role ? "CHANGE_ROLE" : status === "SUSPENDED" ? "SUSPEND_USER" : "ACTIVATE_USER", "User", userId, `role=${role ?? "-"} status=${status ?? "-"}`);

    return ok({ user: updated });
  } catch (e) {
    return handleRouteError(e);
  }
}
