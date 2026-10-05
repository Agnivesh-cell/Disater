import { db } from "@/lib/db";
import { ok, handleRouteError } from "@/lib/api-utils";
import { getAllProviders } from "@/lib/providers/disaster-providers";

// GET /api/providers — status of the modular data provider layer
export async function GET() {
  try {
    const registry = await db.providerFeed.findMany({ orderBy: { providerKey: "asc" } });
    const runtime = await Promise.all(
      getAllProviders().map(async (p) => ({ key: p.key, name: p.name, kind: p.kind, ...(await p.health()) }))
    );
    return ok({
      registry,
      runtime,
      integrationNote:
        "All providers run in MOCK mode for the prototype. Implement the DisasterDataProvider interface (src/lib/providers/disaster-providers.ts) against real APIs (IMD, USGS, INCOIS, CWC, satellite/radar feeds) and register them to go live.",
    });
  } catch (e) {
    return handleRouteError(e);
  }
}
