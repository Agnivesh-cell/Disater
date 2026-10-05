import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail, handleRouteError, requireUser } from "@/lib/api-utils";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { getAllProviders } from "@/lib/providers/disaster-providers";
import { DISASTER_TYPES } from "@/lib/constants";

export const maxDuration = 60;

const schema = z.object({
  locationName: z.string().min(2, "Enter a location").max(120),
  disasterType: z.enum(DISASTER_TYPES),
  conditions: z.string().max(2000).optional().default(""),
  save: z.boolean().default(true),
});

interface Factor { factor: string; weight: number; basis: string }

/**
 * Deterministic heuristic engine — always available, even without AI.
 * Uses mock provider observations + condition keywords to produce a stable,
 * explainable score. Clearly labelled as MODEL-based analysis.
 */
function heuristicScore(disasterType: string, conditions: string, obs: { metric: string; value: number }[]): { score: number; factors: Factor[] } {
  const text = `${disasterType} ${conditions}`.toLowerCase();
  let score = 30;
  const factors: Factor[] = [];

  const add = (factor: string, weight: number) => {
    score += weight;
    factors.push({ factor, weight, basis: "MODEL" });
  };

  const weather = obs.find((o) => o.metric === "rainfall_24h");
  if (weather && weather.value > 100) add(`Heavy rainfall — ${weather.value} mm in 24 h (simulated reading)`, 22);
  else if (weather && weather.value > 60) add(`Moderate rainfall — ${weather.value} mm in 24 h (simulated reading)`, 12);

  const river = obs.find((o) => o.metric === "river_level");
  if (river && river.value > 5) add(`River above ${river.value} m — near/above warning level (simulated gauge)`, 20);
  else if (river && river.value > 4) add(`River level ${river.value} m — approaching warning level (simulated gauge)`, 10);

  const wind = obs.find((o) => o.metric === "wind_speed");
  if (wind && wind.value > 50) add(`Strong winds — ${wind.value} km/h (simulated)`, 14);

  const mag = obs.find((o) => o.metric === "last_magnitude");
  if (mag && mag.value > 2.5) add(`Recent tremor M${mag.value} detected (simulated seismic)`, 12);

  const heat = obs.find((o) => o.metric === "temperature");
  if (heat && heat.value > 40) add(`Extreme temperature — ${heat.value}°C (simulated)`, 18);
  else if (heat && heat.value > 36) add(`High temperature — ${heat.value}°C (simulated)`, 9);

  const keywords: Array<[string[], string, number]> = [
    [["low-lying", "low lying", "flood prone", "flood-prone"], "Low-lying / flood-prone terrain reported", 10],
    [["rising", "rising river", "swollen"], "Rising water levels reported in user input", 10],
    ["historical flood|flood history|floods every|past flood", "Historical flood activity known for this region", 8],
    ["crack|bulge|tilt", "Slope movement indicators reported", 12],
    ["smoke|fire|burn", "Active burning reported", 12],
    ["blocked|blockage|debris", "Access blockage reported", 6],
    ["power|electric|wire", "Electrical hazard reported", 8],
    ["evacuat", "Evacuation concerns raised", 6],
  ];
  for (const [keys, label, w] of keywords) {
    const rx = new RegExp(keys.join("|"), "i");
    if (rx.test(text)) add(label, w);
  }

  const base: Factor = { factor: "Baseline exposure for this disaster type in the selected region", weight: 30, basis: "MODEL" };
  return { score: Math.max(5, Math.min(97, score)), factors: [base, ...factors].slice(0, 6) };
}

function actionsFor(disasterType: string, level: string): string[] {
  const common = ["Monitor official alerts from local authorities", "Keep your phone charged and reachable", "Check on family, elderly and vulnerable neighbours"];
  const map: Record<string, string[]> = {
    FLOOD: ["Move important belongings to higher areas", "Keep emergency supplies and drinking water ready", "Prepare an evacuation route away from waterways", "Avoid walking or driving through flooded water"],
    EARTHQUAKE: ["Secure heavy furniture and shelves", "Practice 'Drop, Cover, Hold On' with your family", "Keep shoes and a torch by your bed", "Identify safe spots in each room"],
    CYCLONE: ["Secure outdoor objects and windows", "Store drinking water for 3 days", "Know your nearest cyclone shelter", "Fishermen: avoid venturing to sea"],
    WILDFIRE: ["Clear dry vegetation around your home", "Prepare N95 masks for smoke", "Plan two escape routes", "Never leave open flames unattended"],
    HEATWAVE: ["Stay indoors between 11 AM and 4 PM", "Store ORS and electrolytes", "Check on elderly neighbours twice a day", "Never leave children or pets in parked cars"],
    LANDSLIDE: ["Watch for new cracks or tilting trees on slopes", "Keep a packed bag ready", "Avoid night travel on hill roads", "Report slope seepage to authorities"],
    STORM: ["Park vehicles away from trees", "Charge devices before the storm window", "Keep torches ready for outages", "Avoid isolated trees during lightning"],
    EXTREME_RAIN: ["Clear drains around your home", "Avoid waterlogged underpasses", "Track official rainfall warnings", "Prepare for localised flooding"],
    LIGHTNING: ["Go indoors at the first sound of thunder", "Unplug sensitive electronics", "Wait 30 minutes after the last thunder", "Avoid open fields and tall trees"],
    TSUNAMI: ["If near the coast after strong shaking, move inland and uphill", "Know your evacuation route", "Do not wait for official confirmation to move", "Keep a go-bag at hand"],
    INDUSTRIAL: ["Know your evacuation assembly point", "Keep masks ready if chemicals are involved", "Follow plant emergency instructions", "Report spills or leaks immediately"],
    OTHER: ["Keep emergency supplies ready", "Follow instructions from official authorities", "Maintain communication with family"],
  };
  const specific = map[disasterType] ?? map.OTHER;
  if (level === "HIGH" || level === "CRITICAL") {
    return ["Act now: complete the actions below without delay", ...specific, ...common].slice(0, 6);
  }
  return [...specific, ...common].slice(0, 5);
}

function levelFor(score: number): "LOW" | "MODERATE" | "HIGH" | "CRITICAL" {
  if (score >= 75) return "CRITICAL";
  if (score >= 55) return "HIGH";
  if (score >= 35) return "MODERATE";
  return "LOW";
}

// POST /api/risk-analysis
export async function POST(req: NextRequest) {
  try {
    const { session, error } = await requireUser();
    if (error) return error;
    const rl = rateLimit(`risk:${clientIp(req)}`, 12, 60_000);
    if (!rl.allowed) return fail("Rate limit exceeded — please wait a minute.", 429);

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input", 422);
    const { locationName, disasterType, conditions, save } = parsed.data;

    // 1) Pull provider observations (mock providers for the prototype)
    const providers = getAllProviders();
    const observations = (await Promise.all(providers.map((p) => p.fetchObservations(locationName).catch(() => [])))).flat();

    // 2) Deterministic base analysis
    const heuristic = heuristicScore(disasterType, conditions, observations);

    // 3) Guardian AI enrichment (best-effort; falls back cleanly)
    let aiNotes: string | null = null;
    let generatedBy = "disasterguard-heuristic-v1";
    let factors = heuristic.factors;
    try {
      const ZAI = (await import("z-ai-web-dev-sdk")).default;
      const zai = await ZAI.create();
      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "You are DisasterGuard's risk analysis engine. Given disaster observations, respond ONLY with compact JSON: {\"score\": <int 0-100>, \"factors\": [{\"factor\": str, \"weight\": int, \"basis\": \"MODEL\"}]}. Base the score on the provided simulated observations and user-reported conditions. Never claim to be an official warning. Weights must be positive integers and roughly sum under 70. Max 6 factors.",
          },
          {
            role: "user",
            content: `Location: ${locationName}\nDisaster type: ${disasterType}\nUser-reported conditions: ${conditions || "(none)"}\nProvider observations (SIMULATED/demo data): ${JSON.stringify(observations.map((o) => `${o.metric}=${o.value}${o.unit}`))}\nHeuristic baseline score: ${heuristic.score}`,
          },
        ],
      });
      const content = completion.choices[0]?.message?.content ?? "";
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed2 = JSON.parse(match[0]);
        if (typeof parsed2.score === "number" && Array.isArray(parsed2.factors) && parsed2.factors.length > 0) {
          const blended = Math.round(heuristic.score * 0.45 + Math.max(0, Math.min(100, parsed2.score)) * 0.55);
          factors = parsed2.factors.slice(0, 6).map((f: { factor?: string; weight?: number; basis?: string }) => ({
            factor: String(f.factor ?? "Risk factor").slice(0, 200),
            weight: Math.max(1, Math.min(70, Number(f.weight) || 5)),
            basis: "MODEL",
          }));
          heuristic.score = Math.max(5, Math.min(97, blended));
          generatedBy = "guardian-ai + heuristic blend";
          aiNotes = "Score blended from Guardian AI analysis and deterministic engine using simulated observations.";
        }
      }
    } catch (e) {
      console.log("[risk-analysis] AI unavailable, using heuristic only:", (e as Error).message);
    }

    const riskLevel = levelFor(heuristic.score);
    const actions = actionsFor(disasterType, riskLevel);

    let saved: { id: string } | null = null;
    if (save) {
      saved = await db.riskAssessment.create({
        data: {
          userId: session!.id,
          locationName,
          disasterType,
          conditionsText: conditions ?? "",
          riskScore: heuristic.score,
          riskLevel,
          factorsJson: JSON.stringify(factors),
          actionsJson: JSON.stringify(actions),
          dataBasis: "MODEL",
          generatedBy,
        },
        select: { id: true },
      });
    }

    return ok({
      assessment: {
        id: saved?.id,
        locationName,
        disasterType,
        riskScore: heuristic.score,
        riskLevel,
        factors,
        recommendedActions: actions,
        generatedBy,
        aiNotes,
        observations: observations.map((o) => ({
          provider: o.providerName,
          metric: o.metric,
          value: o.value,
          unit: o.unit,
          dataBasis: o.dataBasis,
          note: o.note,
        })),
        disclaimer:
          "This is a RISK ESTIMATE generated from simulated/demo data and model analysis. It is NOT an official government warning. Follow instructions from official emergency authorities.",
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (e) {
    return handleRouteError(e);
  }
}
