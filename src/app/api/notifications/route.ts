import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, handleRouteError, requireUser } from "@/lib/api-utils";

// GET /api/notifications — current user's notifications
export async function GET() {
  try {
    const { session, error } = await requireUser();
    if (error) return error;
    const [notifications, unread] = await Promise.all([
      db.notification.findMany({
        where: { userId: session!.id, channel: { in: ["IN_APP"] } },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { alert: { select: { id: true, isSimulated: true } } },
      }),
      db.notification.count({ where: { userId: session!.id, channel: "IN_APP", read: false } }),
    ]);
    return ok({ notifications, unread });
  } catch (e) {
    return handleRouteError(e);
  }
}

// PATCH /api/notifications — mark all (or one) as read
export async function PATCH(req: NextRequest) {
  try {
    const { session, error } = await requireUser();
    if (error) return error;
    const body = await req.json().catch(() => ({}));
    const id = (body as { id?: string }).id;
    await db.notification.updateMany({
      where: { userId: session!.id, ...(id ? { id } : { read: false }) },
      data: { read: true, deliveryStatus: "READ" },
    });
    return ok({ success: true });
  } catch (e) {
    return handleRouteError(e);
  }
}
