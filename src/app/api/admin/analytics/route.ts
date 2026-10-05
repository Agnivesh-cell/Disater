import { db } from "@/lib/db";
import { ok, handleRouteError, requireAdmin } from "@/lib/api-utils";

// GET /api/admin/analytics — aggregated chart data
export async function GET() {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const [byType, bySeverity, alerts, topRegions, byChannel, reportsByStatus, checklist, notifications] = await Promise.all([
      db.alert.groupBy({ by: ["disasterType"], _count: true }),
      db.alert.groupBy({ by: ["severity"], _count: true }),
      db.alert.findMany({ select: { startTime: true }, orderBy: { startTime: "asc" } }),
      db.alert.groupBy({ by: ["region"], _count: true, orderBy: { _count: { region: "desc" } }, take: 8 }),
      db.notification.groupBy({ by: ["channel"], _count: true }),
      db.disasterReport.groupBy({ by: ["status"], _count: true }),
      db.preparednessChecklist.findMany({ select: { userId: true, checked: true } }),
      db.notification.findMany({ select: { read: true, channel: true } }),
    ]);

    // alerts over time — bucket by week (last 8 weeks)
    const now = new Date();
    const weeks: { name: string; alerts: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const start = new Date(now.getTime() - (i + 1) * 7 * 86400_000);
      const end = new Date(now.getTime() - i * 7 * 86400_000);
      const label = `${start.getDate()}/${start.getMonth() + 1}`;
      weeks.push({ name: `Wk ${label}`, alerts: alerts.filter((a) => a.startTime >= start && a.startTime < end).length });
    }

    // preparedness score distribution
    const byUser = new Map<string, { total: number; checked: number }>();
    for (const c of checklist) {
      const e = byUser.get(c.userId) ?? { total: 0, checked: 0 };
      e.total += 1;
      if (c.checked) e.checked += 1;
      byUser.set(c.userId, e);
    }
    const buckets = [
      { name: "0-20%", users: 0 },
      { name: "21-40%", users: 0 },
      { name: "41-60%", users: 0 },
      { name: "61-80%", users: 0 },
      { name: "81-100%", users: 0 },
    ];
    for (const v of byUser.values()) {
      const pct = v.total > 0 ? (v.checked / v.total) * 100 : 0;
      const idx = pct <= 20 ? 0 : pct <= 40 ? 1 : pct <= 60 ? 2 : pct <= 80 ? 3 : 4;
      buckets[idx].users += 1;
    }

    // engagement: read vs unread
    const read = notifications.filter((n) => n.read).length;
    const engagement = [
      { name: "Read", value: read },
      { name: "Unread", value: notifications.length - read },
    ];

    return ok({
      byType: byType.map((t) => ({ name: t.disasterType, value: t._count })),
      bySeverity: bySeverity.map((s) => ({ name: s.severity, value: s._count })),
      overTime: weeks,
      topRegions: topRegions.map((r) => ({ name: r.region, value: r._count })),
      byChannel: byChannel.map((c) => ({ name: c.channel, value: c._count })),
      reportsByStatus: reportsByStatus.map((r) => ({ name: r.status, value: r._count })),
      preparedness: buckets,
      engagement,
      demoNote: "All analytics are computed from clearly-labelled simulated demo data in this prototype.",
    });
  } catch (e) {
    return handleRouteError(e);
  }
}
