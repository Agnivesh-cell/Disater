import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail, handleRouteError, requireAdmin, audit } from "@/lib/api-utils";

const patchSchema = z.object({
  status: z.enum(["PENDING", "VERIFIED", "REJECTED", "RESOLVED"]),
  reviewNote: z.string().max(500).optional(),
});

// PATCH /api/reports/:id — ADMIN verify/reject/resolve
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;
    const { id } = await ctx.params;
    const parsed = patchSchema.safeParse(await req.json());
    if (!parsed.success) return fail("Invalid status update", 422);

    const existing = await db.disasterReport.findUnique({ where: { id } });
    if (!existing) return fail("Report not found", 404);

    const report = await db.disasterReport.update({
      where: { id },
      data: { status: parsed.data.status, reviewNote: parsed.data.reviewNote ?? null, reviewedBy: session!.id },
      select: { id: true, status: true, reportType: true },
    });

    await audit(session!.id, `REPORT_${parsed.data.status}`, "DisasterReport", id);

    return ok({ report });
  } catch (e) {
    return handleRouteError(e);
  }
}
