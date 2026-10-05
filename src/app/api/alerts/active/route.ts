import { db } from "@/lib/db";
import { ok, handleRouteError } from "@/lib/api-utils";
import { serializeAlert } from "@/lib/alert-utils";

// GET /api/alerts/active — all currently active alerts (public to app users)
export async function GET() {
  try {
    const alerts = await db.alert.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ startTime: "desc" }],
    });
    return ok({ alerts: alerts.map(serializeAlert), fetchedAt: new Date().toISOString() });
  } catch (e) {
    return handleRouteError(e);
  }
}
