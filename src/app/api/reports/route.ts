import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail, handleRouteError, requireUser, audit } from "@/lib/api-utils";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { REPORT_TYPES } from "@/lib/constants";

// GET /api/reports?status=&type=&mine=1
export async function GET(req: NextRequest) {
  try {
    const { session, error } = await requireUser();
    if (error) return error;
    const sp = req.nextUrl.searchParams;

    const where: Record<string, unknown> = {};
    if (sp.get("mine") === "1") where.userId = session!.id;
    const status = sp.get("status");
    if (status && status !== "ALL") where.status = status;
    const type = sp.get("type");
    if (type && type !== "ALL") where.reportType = type;

    const reports = await db.disasterReport.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { photoData: false, id: true, userId: true, reporterName: true, reportType: true, description: true, locationName: true, latitude: true, longitude: true, severity: true, status: true, reviewNote: true, createdAt: true, user: { select: { name: true, profile: { select: { city: true } } } } },
    });

    // Unverified reports are clearly flagged — never shown as confirmed disasters.
    return ok({
      reports: reports.map((r) => ({ ...r, verified: r.status === "VERIFIED" })),
    });
  } catch (e) {
    return handleRouteError(e);
  }
}

const createSchema = z.object({
  reportType: z.enum(REPORT_TYPES),
  description: z.string().min(10, "Please describe what you see (min 10 chars)").max(2000),
  locationName: z.string().min(2).max(160),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  severity: z.enum(["LOW", "MODERATE", "HIGH", "CRITICAL"]).default("MODERATE"),
  photoData: z
    .string()
    .max(2_800_000, "Photo too large (max ~2MB)")
    .regex(/^data:image\/(png|jpe?g|webp|gif);base64,/, "Only PNG/JPEG/WebP/GIF images allowed")
    .optional()
    .nullable(),
});

// POST /api/reports — community reporting (status starts as PENDING, always)
export async function POST(req: NextRequest) {
  try {
    const { session, error } = await requireUser();
    if (error) return error;

    const rl = rateLimit(`report:${clientIp(req)}`, 10, 60_000);
    if (!rl.allowed) return fail("Too many reports submitted. Please wait a moment.", 429);

    const parsed = createSchema.safeParse(await req.json());
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid report", 422);
    const d = parsed.data;

    const report = await db.disasterReport.create({
      data: {
        userId: session!.id,
        reporterName: session!.name || "Anonymous User",
        reportType: d.reportType,
        description: d.description,
        locationName: d.locationName,
        latitude: d.latitude ?? null,
        longitude: d.longitude ?? null,
        severity: d.severity,
        photoData: d.photoData ?? null,
        status: "PENDING", // community reports ALWAYS start unverified
      },
      select: { id: true, status: true, createdAt: true },
    });

    return ok({
      report,
      message: "Report submitted. It will appear publicly only after an administrator verifies it.",
    }, 201);
  } catch (e) {
    return handleRouteError(e);
  }
}
