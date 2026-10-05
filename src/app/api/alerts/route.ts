import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail, handleRouteError, requireUser, requireAdmin, audit } from "@/lib/api-utils";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { serializeAlert, fanOutNotifications, broadcastAlert } from "@/lib/alert-utils";
import { DISASTER_TYPES, SEVERITIES, severityToState } from "@/lib/constants";

// GET /api/alerts?status=&type=&severity=&region=&from=&to=&page=&pageSize=
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(sp.get("page") ?? "1") || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(sp.get("pageSize") ?? "20") || 20));

    const where: Record<string, unknown> = {};
    const status = sp.get("status");
    if (status && status !== "ALL") where.status = status;
    const type = sp.get("type");
    if (type && type !== "ALL") where.disasterType = type;
    const severity = sp.get("severity");
    if (severity && severity !== "ALL") where.severity = severity;
    const region = sp.get("region");
    if (region && region !== "ALL") where.region = { contains: region };
    const from = sp.get("from");
    const to = sp.get("to");
    if (from || to) {
      where.startTime = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      };
    }

    const [total, alerts] = await Promise.all([
      db.alert.count({ where }),
      db.alert.findMany({
        where,
        orderBy: { startTime: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return ok({
      alerts: alerts.map(serializeAlert),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (e) {
    return handleRouteError(e);
  }
}

const createAlertSchema = z.object({
  disasterType: z.enum(DISASTER_TYPES),
  title: z.string().min(5, "Title must be at least 5 characters").max(160),
  description: z.string().min(10).max(4000),
  severity: z.enum(SEVERITIES),
  locationName: z.string().min(2).max(120),
  region: z.string().min(2).max(80),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radiusKm: z.number().min(1).max(1000),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().nullable().optional(),
  source: z.string().max(160).optional(),
  sourceType: z.enum(["SIMULATED", "OFFICIAL_API", "SENSOR", "COMMUNITY", "MANUAL"]).default("SIMULATED"),
  confidence: z.number().int().min(0).max(100).default(70),
  isSimulated: z.boolean().default(true),
  recommendedActions: z.array(z.string().max(300)).max(15).default([]),
  affectedAreas: z.array(z.string().max(120)).max(25).default([]),
  whatHappened: z.string().max(2000).optional(),
  whatNext: z.string().max(2000).optional(),
  dos: z.array(z.string().max(300)).max(15).default([]),
  donts: z.array(z.string().max(300)).max(15).default([]),
  notifyUsers: z.boolean().default(true),
});

// POST /api/alerts — ADMIN ONLY. Regular users can never publish alerts.
export async function POST(req: NextRequest) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;

    const rl = rateLimit(`alert-create:${clientIp(req)}`, 20, 60_000);
    if (!rl.allowed) return fail("Rate limit exceeded", 429);

    const parsed = createAlertSchema.safeParse(await req.json());
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid alert payload", 422);
    const d = parsed.data;

    const alert = await db.alert.create({
      data: {
        disasterType: d.disasterType,
        title: d.title,
        description: d.description,
        severity: d.severity,
        state: severityToState(d.severity),
        status: "ACTIVE",
        locationName: d.locationName,
        region: d.region,
        latitude: d.latitude,
        longitude: d.longitude,
        radiusKm: d.radiusKm,
        startTime: d.startTime ? new Date(d.startTime) : new Date(),
        endTime: d.endTime ? new Date(d.endTime) : null,
        source: d.source || "DisasterGuard Alert Console",
        sourceType: d.sourceType,
        confidence: d.confidence,
        verificationStatus: d.isSimulated ? "UNVERIFIED" : "VERIFIED",
        isSimulated: d.isSimulated,
        recommendedActionsJson: JSON.stringify(d.recommendedActions),
        affectedAreasJson: JSON.stringify(d.affectedAreas),
        whatHappened: d.whatHappened || null,
        whatNext: d.whatNext || null,
        dosJson: JSON.stringify(d.dos),
        dontsJson: JSON.stringify(d.donts),
        createdBy: session!.id,
      },
    });

    await audit(session!.id, "CREATE_ALERT", "Alert", alert.id, `${d.disasterType} ${d.severity} — ${d.locationName}`);

    let notificationCount = 0;
    if (d.notifyUsers) {
      notificationCount = await fanOutNotifications(alert.id, {
        title: `${d.isSimulated ? "DEMO ALERT — " : ""}${d.title}`,
        body: d.recommendedActions[0] ?? d.description.slice(0, 160),
        severity: d.severity,
      });
    }
    await broadcastAlert("alert:new", serializeAlert(alert));

    return ok({ alert: serializeAlert(alert), notificationsSent: notificationCount }, 201);
  } catch (e) {
    return handleRouteError(e);
  }
}
