import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, handleRouteError, requireUser } from "@/lib/api-utils";
import { rateLimit, clientIp } from "@/lib/rate-limit";

// GET /api/emergency-contacts
export async function GET() {
  try {
    const { session, error } = await requireUser();
    if (error) return error;
    const contacts = await db.emergencyContact.findMany({
      where: { userId: session!.id },
      orderBy: [{ isPrimary: "desc" }, { name: "asc" }],
    });
    return ok({ contacts });
  } catch (e) {
    return handleRouteError(e);
  }
}

const createSchema = z.object({
  name: z.string().min(2, "Name is required").max(80),
  relationship: z.enum(["FAMILY", "FRIEND", "NEIGHBOR", "OFFICIAL", "OTHER"]).default("FAMILY"),
  phone: z.string().min(5, "Valid phone required").max(30).regex(/^[+\d][\d\s-]{4,}$/, "Enter a valid phone number"),
  email: z.string().email().optional().or(z.literal("")),
  isPrimary: z.boolean().default(false),
  notes: z.string().max(300).optional().or(z.literal("")),
});

export async function POST(req: NextRequest) {
  try {
    const { session, error } = await requireUser();
    if (error) return error;
    const rl = rateLimit(`contact:${clientIp(req)}`, 20, 60_000);
    if (!rl.allowed) return fail("Too many requests", 429);

    const parsed = createSchema.safeParse(await req.json());
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid contact", 422);
    const d = parsed.data;

    if (d.isPrimary) {
      await db.emergencyContact.updateMany({ where: { userId: session!.id }, data: { isPrimary: false } });
    }
    const contact = await db.emergencyContact.create({
      data: {
        userId: session!.id,
        name: d.name,
        relationship: d.relationship,
        phone: d.phone,
        email: d.email || null,
        isPrimary: d.isPrimary,
        notes: d.notes || null,
      },
    });
    return ok({ contact }, 201);
  } catch (e) {
    return handleRouteError(e);
  }
}
