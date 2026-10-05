import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail, handleRouteError, requireUser } from "@/lib/api-utils";

export async function GET() {
  try {
    const { session, error } = await requireUser();
    if (error) return error;
    const user = await db.user.findUnique({
      where: { id: session!.id },
      select: {
        id: true, name: true, email: true, role: true, status: true, onboarded: true, createdAt: true,
        profile: true,
        alertSubscriptions: { select: { disasterType: true, channelsJson: true, enabled: true } },
        emergencyContacts: true,
        _count: { select: { notifications: { where: { read: false } } } },
      },
    });
    if (!user) return fail("User not found", 404);
    return ok(user);
  } catch (e) {
    return handleRouteError(e);
  }
}

const updateSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  city: z.string().max(80).optional(),
  region: z.string().max(80).optional(),
  preferredLanguage: z.string().max(8).optional(),
  phone: z.string().max(30).optional().or(z.literal("")),
  emergencyContactName: z.string().max(80).optional().or(z.literal("")),
  emergencyContactPhone: z.string().max(30).optional().or(z.literal("")),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
  locationSource: z.enum(["MANUAL", "GEO"]).optional(),
  notifyInApp: z.boolean().optional(),
  notifyEmail: z.boolean().optional(),
  notifyPush: z.boolean().optional(),
  notifySms: z.boolean().optional(),
  alertTypes: z.array(z.string()).optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const { session, error } = await requireUser();
    if (error) return error;
    const userId = session!.id;

    const parsed = updateSchema.safeParse(await req.json());
    if (!parsed.success) return fail("Invalid profile update", 422);
    const d = parsed.data;

    const { alertTypes, ...profileData } = d;
    const clean = Object.fromEntries(Object.entries(profileData).filter(([, v]) => v !== undefined));

    await db.$transaction(async (tx) => {
      if (Object.keys(clean).length > 0) {
        await tx.profile.upsert({
          where: { userId },
          update: clean,
          create: { userId, ...clean },
        });
      }
      if (d.name) await tx.user.update({ where: { id: userId }, data: { name: d.name } });
      if (alertTypes) {
        await tx.alertSubscription.deleteMany({ where: { userId } });
        if (alertTypes.length > 0) {
          await tx.alertSubscription.createMany({
            data: alertTypes.map((t) => ({ userId, disasterType: t, minSeverity: "WATCH", channelsJson: '["IN_APP","EMAIL"]' })),
          });
        }
      }
    });

    return ok({ success: true });
  } catch (e) {
    return handleRouteError(e);
  }
}
