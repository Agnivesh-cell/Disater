import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail, handleRouteError, requireUser } from "@/lib/api-utils";

const patchSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  relationship: z.enum(["FAMILY", "FRIEND", "NEIGHBOR", "OFFICIAL", "OTHER"]).optional(),
  phone: z.string().min(5).max(30).optional(),
  isPrimary: z.boolean().optional(),
  notes: z.string().max(300).optional(),
});

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { session, error } = await requireUser();
    if (error) return error;
    const { id } = await ctx.params;
    const parsed = patchSchema.safeParse(await req.json());
    if (!parsed.success) return fail("Invalid contact update", 422);
    const existing = await db.emergencyContact.findFirst({ where: { id, userId: session!.id } });
    if (!existing) return fail("Contact not found", 404);
    if (parsed.data.isPrimary) {
      await db.emergencyContact.updateMany({ where: { userId: session!.id }, data: { isPrimary: false } });
    }
    const contact = await db.emergencyContact.update({ where: { id }, data: parsed.data });
    return ok({ contact });
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { session, error } = await requireUser();
    if (error) return error;
    const { id } = await ctx.params;
    const existing = await db.emergencyContact.findFirst({ where: { id, userId: session!.id } });
    if (!existing) return fail("Contact not found", 404);
    await db.emergencyContact.delete({ where: { id } });
    return ok({ success: true });
  } catch (e) {
    return handleRouteError(e);
  }
}
