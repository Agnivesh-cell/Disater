import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, handleRouteError, requireUser } from "@/lib/api-utils";

// POST /api/alerts/:id/safe — "I'm Safe" check-in
// Simulates notifying the user's emergency contacts that they are safe.
export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { session, error } = await requireUser();
    if (error) return error;
    const { id } = await ctx.params;

    const alert = await db.alert.findUnique({ where: { id } });
    if (!alert) return fail("Alert not found", 404);

    const contacts = await db.emergencyContact.findMany({ where: { userId: session!.id } });

    await db.notification.create({
      data: {
        userId: session!.id,
        alertId: alert.id,
        channel: "IN_APP",
        title: "✅ Safety check-in recorded",
        body: `You marked yourself safe for "${alert.title}". ${contacts.length > 0 ? `${contacts.length} emergency contact${contacts.length > 1 ? "s" : ""} would be notified by SMS/email (simulated in demo).` : "Tip: add emergency contacts so we can inform them."} This is a DEMO simulation, not a real message.`,
        severity: "LOW",
        deliveryStatus: "READ",
      },
    });

    return ok({
      success: true,
      contactsNotified: contacts.length,
      simulated: true,
      message:
        contacts.length > 0
          ? `Simulated check-in sent to ${contacts.length} contact(s). In production this sends real SMS/email.`
          : "You have no emergency contacts saved yet — add them in the Contacts page.",
    });
  } catch (e) {
    return handleRouteError(e);
  }
}
