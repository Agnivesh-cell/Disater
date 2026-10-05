import { db } from "@/lib/db";
import { ok, handleRouteError, requireAdmin } from "@/lib/api-utils";

// GET /api/admin/stats — dashboard overview numbers
export async function GET() {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const [activeAlerts, criticalAlerts, users, communityReports, pendingReports, notificationsSent, regionsRaw] = await Promise.all([
      db.alert.count({ where: { status: "ACTIVE" } }),
      db.alert.count({ where: { status: "ACTIVE", severity: { in: ["HIGH", "CRITICAL"] } } }),
      db.user.count(),
      db.disasterReport.count(),
      db.disasterReport.count({ where: { status: "PENDING" } }),
      db.notification.count(),
      db.alert.groupBy({ by: ["region"], where: { status: { in: ["ACTIVE", "RESOLVED"] } }, _count: true }),
    ]);

    const latest = await db.alert.findFirst({ orderBy: { startTime: "desc" } });

    return ok({
      activeAlerts,
      criticalAlerts,
      users,
      communityReports,
      pendingReports,
      notificationsSent,
      regionsAffected: regionsRaw.length,
      latestAlert: latest ? { id: latest.id, title: latest.title, severity: latest.severity, region: latest.region, startTime: latest.startTime, isSimulated: latest.isSimulated } : null,
      systemTime: new Date().toISOString(),
    });
  } catch (e) {
    return handleRouteError(e);
  }
}
