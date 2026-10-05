import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail, handleRouteError, requireAdmin, audit } from "@/lib/api-utils";
import { fanOutNotifications } from "@/lib/alert-utils";

const sendSchema = z.object({
  title: z.string().min(3).max(140),
  body: z.string().min(3).max(600),
  severity: z.enum(["LOW", "MODERATE", "HIGH", "CRITICAL"]).default("MODERATE"),
  alertId: z.string().optional(),
  channels: z.array(z.enum(["IN_APP", "EMAIL", "PUSH", "SMS"])).min(1).default(["IN_APP"]),
});

// POST /api/notifications/send — ADMIN broadcast (delivery is simulated)
export async function POST(req: NextRequest) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;
    const parsed = sendSchema.safeParse(await req.json());
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid notification", 422);
    const d = parsed.data;

    const users = await db.user.findMany({ where: { status: "ACTIVE" }, select: { id: true } });
    let count = 0;
    for (const u of users) {
      await db.notification.createMany({
        data: d.channels.map((channel) => ({
          userId: u.id,
          alertId: d.alertId ?? null,
          channel,
          title: d.title,
          body: d.body,
          severity: d.severity,
          deliveryStatus: "SENT",
        })),
      });
      count += d.channels.length;
    }

    await audit(session!.id, "SEND_NOTIFICATION", "Notification", undefined, `${d.channels.join(",")} → ${users.length} users`);

    return ok({
      success: true,
      recipients: users.length,
      messagesCreated: count,
      simulated: true,
      note: "Demo build: SMS/email/push deliveries are simulated, marked as SENT in the delivery log. Connect real providers (e.g. Twilio, SendGrid, FCM) to deliver for real.",
    });
  } catch (e) {
    return handleRouteError(e);
  }
}
