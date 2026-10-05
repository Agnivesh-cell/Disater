import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, handleRouteError } from "@/lib/api-utils";

// GET /api/shelters?city=
export async function GET(req: NextRequest) {
  try {
    const city = req.nextUrl.searchParams.get("city");
    const shelters = await db.shelter.findMany({
      where: { isActive: true, ...(city && city !== "ALL" ? { city: { contains: city } } : {}) },
      orderBy: { name: "asc" },
    });
    return ok({
      shelters: shelters.map((s) => ({
        ...s,
        facilities: JSON.parse(s.facilitiesJson || "[]"),
        occupancy: s.capacity > 0 ? Math.round((s.currentLoad / s.capacity) * 100) : 0,
      })),
    });
  } catch (e) {
    return handleRouteError(e);
  }
}
