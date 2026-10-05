import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail, handleRouteError, requireUser } from "@/lib/api-utils";

const onboardingSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  city: z.string().min(2, "Enter your city").max(80),
  region: z.string().max(80).optional(),
  preferredLanguage: z.string().min(2).max(8),
  emergencyContactName: z.string().max(80).optional().or(z.literal("")),
  emergencyContactPhone: z.string().max(30).optional().or(z.literal("")),
  lat: z.number().min(-90).max(90).optional().nullable(),
  lng: z.number().min(-180).max(180).optional().nullable(),
  locationSource: z.enum(["MANUAL", "GEO"]).default("MANUAL"),
  alertTypes: z.array(z.string()).default([]),
  notifyInApp: z.boolean().default(true),
  notifyEmail: z.boolean().default(true),
  notifyPush: z.boolean().default(false),
  notifySms: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  try {
    const { session, error } = await requireUser();
    if (error) return error;
    const userId = session!.id;

    const parsed = onboardingSchema.safeParse(await req.json());
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input", 422);
    const d = parsed.data;

    const updateData: Record<string, unknown> = {
      city: d.city.trim(),
      region: (d.region || d.city).trim(),
      preferredLanguage: d.preferredLanguage,
      emergencyContactName: d.emergencyContactName || null,
      emergencyContactPhone: d.emergencyContactPhone || null,
      lat: d.lat ?? null,
      lng: d.lng ?? null,
      locationSource: d.locationSource,
      notifyInApp: d.notifyInApp,
      notifyEmail: d.notifyEmail,
      notifyPush: d.notifyPush,
      notifySms: d.notifySms,
    };

    await db.$transaction(async (tx) => {
      await tx.profile.update({ where: { userId }, data: updateData });
      if (d.name) await tx.user.update({ where: { id: userId }, data: { name: d.name } });
      // Replace alert type subscriptions
      await tx.alertSubscription.deleteMany({ where: { userId } });
      if (d.alertTypes.length > 0) {
        await tx.alertSubscription.createMany({
          data: d.alertTypes.map((t) => ({
            userId,
            disasterType: t,
            minSeverity: "WATCH",
            channelsJson: JSON.stringify([
              ...(d.notifyInApp ? ["IN_APP"] : []),
              ...(d.notifyEmail ? ["EMAIL"] : []),
              ...(d.notifyPush ? ["PUSH"] : []),
              ...(d.notifySms ? ["SMS"] : []),
            ]),
          })),
        });
      }
      await tx.user.update({ where: { id: userId }, data: { onboarded: true } });
    });

    return ok({ success: true });
  } catch (e) {
    return handleRouteError(e);
  }
}
