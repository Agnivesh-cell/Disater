import { db } from "@/lib/db";
import { ok, handleRouteError, requireUser } from "@/lib/api-utils";

// GET /api/preparedness — checklist + computed score
export async function GET() {
  try {
    const { session, error } = await requireUser();
    if (error) return error;
    const items = await db.preparednessChecklist.findMany({
      where: { userId: session!.id },
      orderBy: { createdAt: "asc" },
    });
    const checked = items.filter((i) => i.checked).length;
    const contacts = await db.emergencyContact.count({ where: { userId: session!.id } });
    const score = items.length > 0 ? Math.round((checked / items.length) * 100) : 0;
    return ok({ items, score, checked, total: items.length, contactsCount: contacts });
  } catch (e) {
    return handleRouteError(e);
  }
}
