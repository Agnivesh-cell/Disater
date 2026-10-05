import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail, handleRouteError, requireUser } from "@/lib/api-utils";

const patchSchema = z.object({ itemKey: z.string().min(1), checked: z.boolean() });

// PATCH /api/preparedness/toggle — toggle checklist item
export async function PATCH(req: NextRequest) {
  try {
    const { session, error } = await requireUser();
    if (error) return error;
    const parsed = patchSchema.safeParse(await req.json());
    if (!parsed.success) return fail("Invalid request", 422);

    const item = await db.preparednessChecklist.findUnique({
      where: { userId_itemKey: { userId: session!.id, itemKey: parsed.data.itemKey } },
    });
    if (!item) return fail("Checklist item not found", 404);

    await db.preparednessChecklist.update({
      where: { id: item.id },
      data: { checked: parsed.data.checked },
    });

    const items = await db.preparednessChecklist.findMany({ where: { userId: session!.id } });
    const checked = items.filter((i) => i.checked).length;
    const score = items.length > 0 ? Math.round((checked / items.length) * 100) : 0;
    return ok({ success: true, score, checked, total: items.length });
  } catch (e) {
    return handleRouteError(e);
  }
}
