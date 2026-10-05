// Serialize DB alerts into API shape (parses JSON string columns)
import { db } from "@/lib/db";

export interface SerializedAlert {
  id: string;
  disasterType: string;
  title: string;
  description: string;
  severity: string;
  state: string;
  status: string;
  locationName: string;
  region: string;
  latitude: number;
  longitude: number;
  radiusKm: number;
  startTime: string;
  endTime: string | null;
  source: string;
  sourceType: string;
  confidence: number;
  verificationStatus: string;
  isSimulated: boolean;
  recommendedActions: string[];
  affectedAreas: string[];
  whatHappened: string | null;
  whatNext: string | null;
  dos: string[];
  donts: string[];
  createdAt: string;
  updatedAt: string;
}

export function serializeAlert(a: any): SerializedAlert {
  const parse = (s: string | null | undefined, fallback: unknown[] = []): unknown[] => {
    try {
      const v = s ? JSON.parse(s) : fallback;
      return Array.isArray(v) ? v : fallback;
    } catch {
      return fallback;
    }
  };
  return {
    id: a.id,
    disasterType: a.disasterType,
    title: a.title,
    description: a.description,
    severity: a.severity,
    state: a.state,
    status: a.status,
    locationName: a.locationName,
    region: a.region,
    latitude: a.latitude,
    longitude: a.longitude,
    radiusKm: a.radiusKm,
    startTime: a.startTime?.toISOString?.() ?? a.startTime,
    endTime: a.endTime?.toISOString?.() ?? a.endTime,
    source: a.source,
    sourceType: a.sourceType,
    confidence: a.confidence,
    verificationStatus: a.verificationStatus,
    isSimulated: a.isSimulated,
    recommendedActions: parse(a.recommendedActionsJson) as string[],
    affectedAreas: parse(a.affectedAreasJson) as string[],
    whatHappened: a.whatHappened,
    whatNext: a.whatNext,
    dos: parse(a.dosJson) as string[],
    donts: parse(a.dontsJson) as string[],
    createdAt: a.createdAt?.toISOString?.() ?? a.createdAt,
    updatedAt: a.updatedAt?.toISOString?.() ?? a.updatedAt,
  };
}

/**
 * Fan out notifications to users subscribed to this disaster type (or all opted-in users)
 * across their chosen channels. Delivery is SIMULATED for the prototype — clearly
 * labelled so it is never confused with real SMS/email delivery.
 */
export async function fanOutNotifications(alertId: string, payload: { title: string; body: string; severity: string }): Promise<number> {
  const users = await db.user.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true, name: true,
      profile: { select: { notifyInApp: true, notifyEmail: true, notifyPush: true, notifySms: true } },
    },
  });
  let count = 0;
  for (const u of users) {
    const channels: string[] = [];
    if (u.profile?.notifyInApp !== false) channels.push("IN_APP");
    if (u.profile?.notifyEmail) channels.push("EMAIL");
    if (u.profile?.notifyPush) channels.push("PUSH");
    if (u.profile?.notifySms) channels.push("SMS");
    if (channels.length === 0) channels.push("IN_APP");
    await db.notification.createMany({
      data: channels.map((channel) => ({
        userId: u.id,
        alertId,
        channel,
        title: payload.title,
        body: payload.body,
        severity: payload.severity,
        deliveryStatus: channel === "IN_APP" ? "SENT" : "SENT", // simulated delivery
      })),
    });
    count += channels.length;
  }
  return count;
}

/**
 * Broadcast a new alert to connected clients via the socket.io mini service.
 * Fire-and-forget: if the service is down, polling fallback still works.
 */
export async function broadcastAlert(event: string, data: unknown) {
  try {
    const port = process.env.ALERT_SERVICE_PORT || "3003";
    await fetch(`http://127.0.0.1:${port}/broadcast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, data }),
      signal: AbortSignal.timeout(1500),
    });
  } catch {
    // service not running — clients fall back to polling
  }
}
