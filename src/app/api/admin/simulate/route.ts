import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail, handleRouteError, requireAdmin, audit } from "@/lib/api-utils";
import { serializeAlert, fanOutNotifications, broadcastAlert } from "@/lib/alert-utils";
import { DISASTER_TYPES, SEVERITIES, severityToState } from "@/lib/constants";

// City presets for one-click simulation
export const CITY_PRESETS: Record<string, { latitude: number; longitude: number; region: string }> = {
  Lucknow: { latitude: 26.8467, longitude: 80.9462, region: "Lucknow" },
  Delhi: { latitude: 28.6139, longitude: 77.209, region: "Delhi" },
  Dehradun: { latitude: 30.3165, longitude: 78.0322, region: "Dehradun" },
  Jaipur: { latitude: 26.9124, longitude: 75.7873, region: "Jaipur" },
  Mumbai: { latitude: 19.076, longitude: 72.8777, region: "Mumbai" },
  Chennai: { latitude: 13.0827, longitude: 80.2707, region: "Chennai" },
  Kolkata: { latitude: 22.5726, longitude: 88.3639, region: "Kolkata" },
  Mandi: { latitude: 31.7085, longitude: 76.9314, region: "Himachal Pradesh" },
};

const simulateSchema = z.object({
  disasterType: z.enum(DISASTER_TYPES),
  locationName: z.string().min(2).max(80),
  severity: z.enum(SEVERITIES).default("HIGH"),
  radiusKm: z.number().min(1).max(200).default(25),
  durationHours: z.number().min(1).max(168).default(24),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

/**
 * POST /api/admin/simulate
 * Creates a DEMO / SIMULATED alert (never verified), fans out notifications
 * (simulated delivery) and pushes to all connected clients in real time.
 */
export async function POST(req: NextRequest) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;

    const parsed = simulateSchema.safeParse(await req.json());
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid simulation payload", 422);
    const d = parsed.data;

    const preset = CITY_PRESETS[d.locationName];
    const latitude = d.lat ?? preset?.latitude;
    const longitude = d.lng ?? preset?.longitude;
    if (latitude === undefined || longitude === undefined) return fail("Unknown city — provide lat/lng or pick a preset city", 422);
    const region = preset?.region ?? d.locationName;

    const labels: Record<string, { title: (loc: string) => string; desc: (loc: string) => string; actions: string[]; areas: string[] }> = {
      FLOOD: {
        title: (loc) => `HIGH FLOOD RISK — ${loc}`,
        desc: (loc) => `SIMULATED FLOOD SCENARIO (DEMO): Rapid-onset flooding is projected across low-lying parts of ${loc} following intense rainfall. River gauges (simulated) are near warning level. This is a demonstration alert generated from the DisasterGuard demo engine — it is NOT a real warning.`,
        actions: ["Move to higher ground immediately if you are in a low-lying area", "Shift vehicles, appliances and documents to safety/upper floors", "Keep your emergency kit, torch, and drinking water at hand", "Avoid walking or driving through flooded streets", "Report local flooding in the app to help responders"],
        areas: ["Low-lying wards", "Riverside colonies", "Underpasses and subways"],
      },
      EARTHQUAKE: {
        title: (loc) => `EARTHQUAKE IMPACT SIMULATION — ${loc}`,
        desc: (loc) => `SIMULATED EARTHQUAKE SCENARIO (DEMO): A M6.2 event (simulated) is projected near ${loc} for emergency-response training. Aftershocks expected. This is NOT a prediction and NOT a real event.`,
        actions: ["Drop, Cover, and Hold On during shaking", "Stay away from windows and falling objects", "Expect aftershocks — evacuate damaged buildings calmly", "Use text messages instead of calls", "Check gas leaks before lighting flames"],
        areas: ["Old town core", "Unreinforced masonry zones"],
      },
      CYCLONE: {
        title: (loc) => `CYCLONE WARNING SIMULATION — ${loc}`,
        desc: (loc) => `SIMULATED CYCLONE SCENARIO (DEMO): A cyclonic storm (simulated) is projected to track towards ${loc} with 90-110 km/h gusts and storm surge. This is a demo alert, NOT a real meteorological warning.`,
        actions: ["Move to official cyclone shelters if instructed", "Store drinking water for 3 days", "Secure windows and outdoor objects", "Fishermen: stay ashore", "Keep phones charged; expect power cuts"],
        areas: ["Coastal belt", "Low-lying fishing villages"],
      },
      WILDFIRE: {
        title: (loc) => `WILDFIRE SPREAD SIMULATION — ${loc}`,
        desc: (loc) => `SIMULATED WILDFIRE SCENARIO (DEMO): Fast-spreading vegetation fire (simulated) advancing towards populated fringes of ${loc} under dry, windy conditions. Demo alert only.`,
        actions: ["Evacuate early if smoke approaches your area", "Wear N95 masks; cover nose with wet cloth", "Move away downhill or crosswind, never uphill through fire", "Call 101 for fire emergencies"],
        areas: ["Forest fringe", "Dry grass slopes"],
      },
      STORM: {
        title: (loc) => `SEVERE STORM SIMULATION — ${loc}`,
        desc: (loc) => `SIMULATED SEVERE STORM SCENARIO (DEMO): Squall line with 70-90 km/h gusts and hail projected for ${loc}. Demo alert only.`,
        actions: ["Stay indoors away from windows", "Park vehicles clear of trees and hoardings", "Keep torches and power banks ready", "Report fallen trees and live wires — do not touch them"],
        areas: ["City core", "Open grounds"],
      },
      HEATWAVE: {
        title: (loc) => `HEATWAVE ALERT SIMULATION — ${loc}`,
        desc: (loc) => `SIMULATED HEATWAVE SCENARIO (DEMO): Temperatures 5-6°C above normal projected for ${loc} for 3 days. Severe heat-stress risk for outdoor workers and the elderly. Demo alert only.`,
        actions: ["Avoid outdoor exposure 11 AM to 4 PM", "Hydrate frequently; carry ORS", "Check on elderly neighbours twice a day", "Call 108 for heat stroke symptoms"],
        areas: ["Entire district"],
      },
      LANDSLIDE: {
        title: (loc) => `LANDSLIDE RISK SIMULATION — ${loc}`,
        desc: (loc) => `SIMULATED LANDSLIDE SCENARIO (DEMO): Saturated slopes (simulated rainfall) show new cracks near ${loc}; debris flow risk HIGH. Demo alert only.`,
        actions: ["Move away from cracked slopes immediately", "Avoid night travel on hill roads", "Report bulging ground or tilting trees", "Keep a packed bag ready"],
        areas: ["Hill-cut road sectors", "Slope-side villages"],
      },
    };
    const generic = {
      title: (loc: string) => `${d.disasterType.replace("_", " ")} SIMULATION — ${loc}`,
      desc: (loc: string) => `SIMULATED ${d.disasterType.replace("_", " ")} SCENARIO (DEMO) for ${loc}. This is a DisasterGuard demonstration alert — NOT a real warning.`,
      actions: ["Follow instructions from official emergency authorities", "Keep your emergency kit ready", "Monitor this app for updates"],
      areas: ["Affected zone"],
    };
    const L = labels[d.disasterType] ?? generic;

    const now = new Date();
    const alert = await db.alert.create({
      data: {
        disasterType: d.disasterType,
        title: L.title(d.locationName),
        description: L.desc(d.locationName),
        severity: d.severity,
        state: severityToState(d.severity),
        status: "ACTIVE",
        locationName: d.locationName,
        region,
        latitude,
        longitude,
        radiusKm: d.radiusKm,
        startTime: now,
        endTime: new Date(now.getTime() + d.durationHours * 3600_000),
        source: "DisasterGuard Demo Simulation Engine",
        sourceType: "SIMULATED",
        confidence: 80,
        verificationStatus: "UNVERIFIED",
        isSimulated: true,
        recommendedActionsJson: JSON.stringify(L.actions),
        affectedAreasJson: JSON.stringify(L.areas),
        whatHappened: `A simulated ${d.disasterType.replace("_", " ").toLowerCase()} scenario was triggered from the admin demo console for presentation purposes.`,
        whatNext: `Model (demo) projects conditions may persist for the next ${d.durationHours} hours within a ${d.radiusKm} km radius. This is a risk estimate from simulated data.`,
        dosJson: JSON.stringify(L.actions),
        dontsJson: JSON.stringify(["Do not treat this simulation as a real warning", "Do not spread screenshots of this demo alert as a real emergency", "Do not call emergency services about this DEMO"]),
        createdBy: session!.id,
      },
    });

    await audit(session!.id, "SIMULATE_ALERT", "Alert", alert.id, `${d.disasterType} ${d.severity} — ${d.locationName} (DEMO)`);

    const notificationCount = await fanOutNotifications(alert.id, {
      title: `DEMO ALERT — ${L.title(d.locationName)}`,
      body: L.actions[0],
      severity: d.severity,
    });

    await broadcastAlert("alert:new", { ...serializeAlert(alert), demo: true });

    return ok({
      alert: serializeAlert(alert),
      notificationsSent: notificationCount,
      demoNotice: "DEMO / SIMULATED ALERT — broadcast to dashboards, live map, and notification center. Clearly labelled as simulated.",
    }, 201);
  } catch (e) {
    return handleRouteError(e);
  }
}
