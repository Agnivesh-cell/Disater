import { db } from "@/lib/db";

// Server-side count of active alerts for the landing hero (safe on cold start)
export async function getActiveAlerts(): Promise<number> {
  try {
    return await db.alert.count({ where: { status: "ACTIVE" } });
  } catch {
    return 0;
  }
}
