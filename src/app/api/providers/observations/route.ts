import { NextRequest } from "next/server";
import { ok, handleRouteError } from "@/lib/api-utils";
import { getAllProviders } from "@/lib/providers/disaster-providers";

// GET /api/providers/observations?location=Lucknow
// Live view of the (mock) provider layer for a location.
export async function GET(req: NextRequest) {
  try {
    const location = req.nextUrl.searchParams.get("location") || "Unknown";
    const providers = getAllProviders();
    const observations = (await Promise.all(providers.map((p) => p.fetchObservations(location).catch(() => [])))).flat();
    return ok({ location, observations, note: "All readings are DEMO/SIMULATED until real provider APIs are connected." });
  } catch (e) {
    return handleRouteError(e);
  }
}
