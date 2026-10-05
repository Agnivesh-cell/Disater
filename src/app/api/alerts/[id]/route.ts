import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail, handleRouteError, requireAdmin, audit } from "@/lib/api-utils";
import { serializeAlert, broadcastAlert } from "@/lib/alert-utils";

// GET /api/alerts/:id
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const alert = await db.alert.findUnique({ where: { id } });
    if (!alert) return fail("Alert not found", 404);
    // nearby shelters within radius + 15km
    const shelters = await db.shelter.findMany({ where: { isActive: true } });
    const R = 6371;
    const km = (lat1: number, lng1: number, lat2: number, lng2: number) => {
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLng = ((lng2 - lng1) * Math.PI) / 180;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };
    const nearby = shelters
      .map((s) => ({ ...s, facilities: JSON.parse(s.facilitiesJson || "[]"), distanceKm: km(alert.latitude, alert.longitude, s.latitude, s.longitude) }))
      .filter((s) => s.distanceKm <= alert.radiusKm + 15)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 6)
      .map(({ facilitiesJson, ...rest }) => rest);

    const communityReports = await db.disasterReport.findMany({
      where: { status: "VERIFIED", reportType: alert.disasterType === "FLOOD" ? "FLOODING" : alert.disasterType },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: { id: true, reportType: true, description: true, locationName: true, severity: true, createdAt: true, reporterName: true },
    });

    return ok({ alert: serializeAlert(alert), nearbyShelters: nearby, communityReports });
  } catch (e) {
    return handleRouteError(e);
  }
}

const patchSchema = z.object({
  title: z.string().min(5).max(160).optional(),
  description: z.string().min(10).max(4000).optional(),
  severity: z.enum(["LOW", "MODERATE", "HIGH", "CRITICAL"]).optional(),
  state: z.enum(["NORMAL", "WATCH", "WARNING", "CRITICAL"]).optional(),
  status: z.enum(["ACTIVE", "RESOLVED", "CANCELLED", "EXPIRED"]).optional(),
  radiusKm: z.number().min(1).max(1000).optional(),
  endTime: z.string().datetime().nullable().optional(),
  verificationStatus: z.enum(["VERIFIED", "UNVERIFIED", "PENDING"]).optional(),
  recommendedActions: z.array(z.string().max(300)).max(15).optional(),
  notifyUsers: z.boolean().optional(),
});

// PATCH /api/alerts/:id — ADMIN only
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;
    const { id } = await ctx.params;

    const parsed = patchSchema.safeParse(await req.json());
    if (!parsed.success) return fail("Invalid update", 422);
    const d = parsed.data;

    const existing = await db.alert.findUnique({ where: { id } });
    if (!existing) return fail("Alert not found", 404);

    const data: Record<string, unknown> = { ...d };
    if (d.severity && !d.state) data.state = d.severity === "CRITICAL" ? "CRITICAL" : d.severity === "HIGH" ? "WARNING" : d.severity === "MODERATE" ? "WATCH" : "NORMAL";
    if (d.recommendedActions) data.recommendedActionsJson = JSON.stringify(d.recommendedActions);
    if (d.status && d.status !== "ACTIVE" && !d.endTime) data.endTime = new Date();
    delete data.notifyUsers;

    const alert = await db.alert.update({ where: { id }, data });
    await audit(session!.id, "UPDATE_ALERT", "Alert", id, `severity=${d.severity ?? "-"} status=${d.status ?? "-"}`);

    if (d.notifyUsers) {
      const { fanOutNotifications } = await import("@/lib/alert-utils");
      await fanOutNotifications(alert.id, {
        title: `${alert.isSimulated ? "DEMO UPDATE — " : ""}${alert.title}`,
        body: d.status === "RESOLVED" ? "This alert has been RESOLVED." : `Alert updated — severity: ${alert.severity}`,
        severity: alert.severity,
      });
    }
    await broadcastAlert("alert:update", serializeAlert(alert));

    return ok({ alert: serializeAlert(alert) });
  } catch (e) {
    return handleRouteError(e);
  }
}

// DELETE /api/alerts/:id — ADMIN only
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;
    const { id } = await ctx.params;
    const existing = await db.alert.findUnique({ where: { id } });
    if (!existing) return fail("Alert not found", 404);
    await db.alert.delete({ where: { id } });
    await audit(session!.id, "DELETE_ALERT", "Alert", id, existing.title);
    await broadcastAlert("alert:deleted", { id });
    return ok({ success: true });
  } catch (e) {
    return handleRouteError(e);
  }
}
