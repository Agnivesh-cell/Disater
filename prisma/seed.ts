/**
 * DisasterGuard — Demo data seeder
 * Run: bun prisma/seed.ts
 * Creates demo users, alerts (clearly labelled SIMULATED), shelters,
 * community reports, checklists, provider registry and notifications.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000);
const daysAgo = (d: number) => new Date(Date.now() - d * 86400_000);
const inHours = (h: number) => new Date(Date.now() + h * 3600_000);

async function main() {
  console.log("🌱 Seeding DisasterGuard demo data...");

  // ---------- wipe (idempotent reseed) ----------
  await db.adminAction.deleteMany();
  await db.notification.deleteMany();
  await db.riskAssessment.deleteMany();
  await db.preparednessChecklist.deleteMany();
  await db.emergencyContact.deleteMany();
  await db.disasterReport.deleteMany();
  await db.alertSubscription.deleteMany();
  await db.alert.deleteMany();
  await db.shelter.deleteMany();
  await db.providerFeed.deleteMany();
  await db.profile.deleteMany();
  await db.userSession.deleteMany();
  await db.user.deleteMany();

  // ---------- users ----------
  const pwd = (p: string) => bcrypt.hashSync(p, 10);

  const admin = await db.user.create({
    data: {
      email: "admin@disasterguard.app",
      name: "Ravi Sharma",
      passwordHash: pwd("Admin@123"),
      role: "ADMIN",
      onboarded: true,
      emailVerified: true,
      profile: { create: { city: "New Delhi", region: "Delhi", preferredLanguage: "en", phone: "+91-9800000001" } },
    },
  });

  const demo = await db.user.create({
    data: {
      email: "demo@disasterguard.app",
      name: "Aarav Verma",
      passwordHash: pwd("Demo@123"),
      role: "USER",
      onboarded: true,
      emailVerified: true,
      profile: {
        create: {
          city: "Lucknow", region: "Lucknow", preferredLanguage: "en",
          phone: "+91-9800000002", lat: 26.8467, lng: 80.9462, locationSource: "MANUAL",
          emergencyContactName: "Meera Verma (Mother)", emergencyContactPhone: "+91-9800000099",
          notifyInApp: true, notifyEmail: true, notifyPush: true,
        },
      },
    },
  });

  const extraUsersData = [
    { email: "priya@disasterguard.app", name: "Priya Nair", city: "Kochi", region: "Kerala", phone: "+91-9800000003" },
    { email: "rahul@disasterguard.app", name: "Rahul Joshi", city: "Dehradun", region: "Dehradun", phone: "+91-9800000004" },
    { email: "sana@disasterguard.app", name: "Sana Khan", city: "Jaipur", region: "Jaipur", phone: "+91-9800000005" },
    { email: "arjun@disasterguard.app", name: "Arjun Mehta", city: "Mumbai", region: "Mumbai", phone: "+91-9800000006" },
    { email: "isha@disasterguard.app", name: "Isha Bose", city: "Kolkata", region: "Kolkata", phone: "+91-9800000007" },
    { email: "vikram@disasterguard.app", name: "Vikram Singh", city: "Mandi", region: "Himachal Pradesh", phone: "+91-9800000008" },
  ];
  const extras = [] as { id: string; region: string; name: string }[];
  for (let i = 0; i < extraUsersData.length; i++) {
    const u = extraUsersData[i];
    const created = await db.user.create({
      data: {
        email: u.email, name: u.name, passwordHash: pwd("Demo@123"),
        onboarded: true, emailVerified: i % 2 === 0,
        profile: { create: { city: u.city, region: u.region, preferredLanguage: "en", phone: u.phone } },
      },
    });
    extras.push({ id: created.id, region: u.region, name: u.name });
  }

  // suspended example user for admin table
  const suspended = await db.user.create({
    data: {
      email: "test.user@disasterguard.app", name: "Test Account",
      passwordHash: pwd("Demo@123"), status: "SUSPENDED", onboarded: true,
      profile: { create: { city: "Patna", region: "Patna" } },
    },
  });

  // ---------- alert subscriptions for demo user ----------
  const allTypes = ["FLOOD", "EARTHQUAKE", "CYCLONE", "WILDFIRE", "STORM", "EXTREME_RAIN", "HEATWAVE", "LANDSLIDE", "LIGHTNING"];
  for (const t of allTypes) {
    await db.alertSubscription.create({
      data: { userId: demo.id, disasterType: t, minSeverity: "WATCH", channelsJson: '["IN_APP","EMAIL","PUSH"]' },
    });
  }

  // ---------- demo emergency contacts ----------
  await db.emergencyContact.createMany({
    data: [
      { userId: demo.id, name: "Meera Verma", relationship: "FAMILY", phone: "+91-9800000099", isPrimary: true, notes: "Mother — lives in Gomti Nagar" },
      { userId: demo.id, name: "Rohit Verma", relationship: "FAMILY", phone: "+91-9800000098", notes: "Brother — Kanpur" },
      { userId: demo.id, name: "Sunita Gupta", relationship: "FRIEND", phone: "+91-9800000097", notes: "Neighbor, has backup power" },
      { userId: demo.id, name: "Lucknow District Control Room", relationship: "OFFICIAL", phone: "1070", notes: "State emergency operations centre" },
    ],
  });

  // ---------- preparedness checklist for demo user ----------
  const checklist = [
    ["EMERGENCY_KIT", "Emergency kit packed & accessible", "SUPPLIES", true],
    ["WATER", "Drinking water stored (3 days per person)", "SUPPLIES", true],
    ["FIRST_AID", "First-aid kit stocked", "SUPPLIES", true],
    ["TORCH", "Torch / flashlight with spare batteries", "SUPPLIES", true],
    ["POWER_BANK", "Power bank charged", "SUPPLIES", true],
    ["DOCUMENTS", "Important documents in waterproof bag", "DOCUMENTS", false],
    ["CONTACTS", "Emergency contacts saved & printed", "PLANNING", true],
    ["EVAC_PLAN", "Family evacuation plan discussed", "PLANNING", false],
    ["MEETING_POINT", "Safe meeting point decided", "PLANNING", false],
    ["MEDICINES", "Essential medicines for 7 days", "SUPPLIES", false],
  ] as const;
  for (const [itemKey, label, category, checked] of checklist) {
    await db.preparednessChecklist.create({ data: { userId: demo.id, itemKey, label, category, checked } });
  }
  // scattered checklists for other users (analytics distribution)
  for (let i = 0; i < extras.length; i++) {
    const filled = [3, 6, 9, 5, 1, 7][i];
    for (let j = 0; j < checklist.length; j++) {
      await db.preparednessChecklist.create({
        data: { userId: extras[i].id, itemKey: checklist[j][0], label: checklist[j][1], category: checklist[j][2], checked: j < filled },
      });
    }
  }

  // ---------- shelters ----------
  const shelters = [
    { name: "KD Singh Babu Stadium Relief Camp", type: "RELIEF_CAMP", address: "Hazratganj, Near Parivartan Chowk", city: "Lucknow", region: "Lucknow", latitude: 26.8497, longitude: 80.9442, capacity: 1200, currentLoad: 340, facilitiesJson: '["Drinking water","Toilets","Medical desk","Charging point"]', contactPhone: "1800-180-5520" },
    { name: "Colvin Taluqdars College Shelter", type: "SCHOOL", address: "Qaiser Bagh, Lucknow", city: "Lucknow", region: "Lucknow", latitude: 26.8612, longitude: 80.9319, capacity: 600, currentLoad: 120, facilitiesJson: '["Drinking water","Toilets","Kitchen"]', contactPhone: "1800-180-5521" },
    { name: "NR Compound Community Hall", type: "COMMUNITY_HALL", address: "Lucknow Cantonment", city: "Lucknow", region: "Lucknow", latitude: 26.8250, longitude: 80.9214, capacity: 300, currentLoad: 45, facilitiesJson: '["Drinking water","First aid"]' },
    { name: "Yamuna Sports Complex Relief Camp", type: "RELIEF_CAMP", address: "Surajmal Vihar, Delhi", city: "Delhi", region: "Delhi", latitude: 28.6674, longitude: 77.3016, capacity: 2000, currentLoad: 260, facilitiesJson: '["Drinking water","Toilets","Medical desk","Food"]', contactPhone: "1070" },
    { name: "Chhatrasal Stadium Camp", type: "OPEN_GROUND", address: "Model Town, Delhi", city: "Delhi", region: "Delhi", latitude: 28.7095, longitude: 77.1929, capacity: 900, currentLoad: 90, facilitiesJson: '["Water tankers","Toilets"]' },
    { name: "Rajiv Gandhi Ground Relief Center", type: "OPEN_GROUND", address: "Dehradun, Uttarakhand", city: "Dehradun", region: "Dehradun", latitude: 30.3180, longitude: 78.0290, capacity: 700, currentLoad: 60, facilitiesJson: '["Tents","Medical desk"]' },
    { name: "Sawai Mansingh Stadium Shelter", type: "RELIEF_CAMP", address: "Jaipur, Rajasthan", city: "Jaipur", region: "Jaipur", latitude: 26.8948, longitude: 75.8047, capacity: 1000, currentLoad: 210, facilitiesJson: '["Cooling room","ORS distribution","Drinking water"]' },
    { name: "Mandi Paddal Ground Shelter", type: "COMMUNITY_HALL", address: "Mandi, Himachal Pradesh", city: "Mandi", region: "Himachal Pradesh", latitude: 31.7040, longitude: 76.9350, capacity: 400, currentLoad: 155, facilitiesJson: '["Blankets","Medical desk","Kitchen"]' },
    { name: "Coastal Community Cyclone Center", type: "SCHOOL", address: "Chennai, Tamil Nadu", city: "Chennai", region: "Chennai", latitude: 13.0524, longitude: 80.2810, capacity: 1500, currentLoad: 0, facilitiesJson: '["Cyclone-rated building","Water","Toilets","Generator"]' },
  ];
  await db.shelter.createMany({ data: shelters });

  // ---------- alerts ----------
  const alertSeed = [
    {
      disasterType: "FLOOD", title: "HIGH FLOOD RISK — Gomti River Rising in Lucknow",
      description: "Persistent heavy rainfall over the past 36 hours has pushed the Gomti river close to the warning level at Lucknow gauge. Low-lying colonies near the riverbank face inundation risk. Water logging already reported in several wards. Risk estimate based on simulated river-gauge and rainfall data.",
      severity: "HIGH", state: "WARNING", status: "ACTIVE",
      locationName: "Lucknow, Uttar Pradesh", region: "Lucknow", latitude: 26.8467, longitude: 80.9462, radiusKm: 25,
      startTime: hoursAgo(14), endTime: inHours(48),
      source: "DisasterGuard Simulation Engine", sourceType: "SIMULATED", confidence: 78,
      verificationStatus: "UNVERIFIED", isSimulated: true,
      recommendedActions: ["Move to higher ground immediately if you are in a low-lying area", "Shift vehicles and electrical appliances to upper floors", "Keep an emergency kit, torch and drinking water ready", "Avoid walking or driving through flooded streets", "Follow official advisories from the district administration"],
      affectedAreas: ["Gomti Nagar (low-lying sectors)", "Vikas Khand", "Nishatganj riverside", "Madiyaon", "Kurshi Road low belt"],
      whatHappened: "Rainfall of ~180 mm in 36 hours (simulated) raised the Gomti river to near-warning level. Waterlogging is affecting road movement in multiple wards.",
      whatNext: "Rain is expected to continue for another 24–36 hours (model estimate). River level may cross the warning mark; low-lying areas could see 0.5–1.2 m of standing water.",
      dos: ["Move family members and essentials to a safe, elevated place", "Keep documents in waterproof bags", "Stay reachable on your phone; charge power banks", "Report flooding around you in the app"],
      donts: ["Do not wade or drive through moving water", "Do not touch fallen electric lines", "Do not trust unverified WhatsApp forwards", "Do not return to flooded homes until declared safe"],
    },
    {
      disasterType: "STORM", title: "Severe Thunderstorm Watch — Delhi NCR",
      description: "A strong western disturbance is bringing thunderstorms with wind speeds of 50–70 km/h to Delhi NCR. Risk of tree fall, power disruptions and localised damage. Based on simulated weather model output.",
      severity: "MODERATE", state: "WATCH", status: "ACTIVE",
      locationName: "New Delhi, NCT of Delhi", region: "Delhi", latitude: 28.6139, longitude: 77.2090, radiusKm: 40,
      startTime: hoursAgo(8), endTime: inHours(20),
      source: "DisasterGuard Simulation Engine", sourceType: "SIMULATED", confidence: 72,
      verificationStatus: "UNVERIFIED", isSimulated: true,
      recommendedActions: ["Secure balconies, signboards and outdoor objects", "Park vehicles away from trees and hoardings", "Keep torches and power banks ready for outages", "Avoid sheltering under isolated trees"],
      affectedAreas: ["Central Delhi", "Noida", "Gurugram", "West Delhi"],
      whatHappened: "Squall line developing over NW plains (simulated). Gusts up to 68 km/h recorded at model stations.",
      whatNext: "Storms likely during evening hours with brief intense rain and gusty winds; conditions improving by tomorrow morning.",
      dos: ["Charge devices before evening", "Check on elderly neighbours", "Report fallen trees or wires"],
      donts: ["Do not stand under trees during lightning", "Do not attempt DIY roof repairs during the storm"],
    },
    {
      disasterType: "EARTHQUAKE", title: "Mild Tremor Sequence — Dehradun Region",
      description: "A sequence of mild tremors (simulated, up to M3.6) detected near Dehradun in the last 12 hours. No damage reported. Seismologists advise staying alert, not alarmed. This is a risk-estimate from simulated seismic data.",
      severity: "LOW", state: "NORMAL", status: "ACTIVE",
      locationName: "Dehradun, Uttarakhand", region: "Dehradun", latitude: 30.3165, longitude: 78.0322, radiusKm: 60,
      startTime: hoursAgo(12), endTime: inHours(72),
      source: "DisasterGuard Simulation Engine", sourceType: "SIMULATED", confidence: 60,
      verificationStatus: "UNVERIFIED", isSimulated: true,
      recommendedActions: ["Review your 'Drop, Cover, Hold On' plan", "Secure heavy furniture and wall hangings", "Keep emergency exits clear", "Do not spread unverified predictions"],
      affectedAreas: ["Dehradun city", "Mussoorie foothills", "Rishikesh"],
      whatHappened: "Simulated seismic cluster of 4 mild tremors (M2.1–M3.6) in 12 hours.",
      whatNext: "Most likely outcome: activity tapers off. Earthquakes cannot be precisely predicted — this is a monitoring notice, not a prediction.",
      dos: ["Practice earthquake drills", "Keep shoes and torch by your bed"],
      donts: ["Do not run outside during shaking", "Do not use lifts after tremors until checked"],
    },
    {
      disasterType: "HEATWAVE", title: "Heatwave Warning — Jaipur & Adjoining Districts",
      description: "Day temperatures 5°C above normal expected for the next 4 days (simulated forecast). High risk of heat exhaustion and heat stroke for outdoor workers, elderly and children.",
      severity: "HIGH", state: "WARNING", status: "ACTIVE",
      locationName: "Jaipur, Rajasthan", region: "Jaipur", latitude: 26.9124, longitude: 75.7873, radiusKm: 50,
      startTime: hoursAgo(20), endTime: inHours(96),
      source: "DisasterGuard Simulation Engine", sourceType: "SIMULATED", confidence: 85,
      verificationStatus: "UNVERIFIED", isSimulated: true,
      recommendedActions: ["Avoid going out between 11 AM and 4 PM", "Drink water frequently, carry ORS", "Check on elderly neighbours twice a day", "Never leave children or pets in parked vehicles"],
      affectedAreas: ["Jaipur city", "Bharatpur", "Kota corridor"],
      whatHappened: "Simulated IMD-style heat bulletin: max temp 44.8°C, night lows staying above 31°C.",
      whatNext: "Heat conditions likely to intensify for 2 more days before a weak system brings relief.",
      dos: ["Wear light cotton clothing", "Use ORS after heavy sweating", "Reschedule outdoor work"],
      donts: ["Do not drink alcohol in extreme heat", "Do not ignore dizziness or confusion — call 108"],
    },
    {
      disasterType: "LANDSLIDE", title: "Landslide Alert — Mandi District Hills",
      description: "Saturated slopes after 3 days of continuous rain (simulated) have triggered new cracks on the Mandi–Katra hill road. Debris flow risk remains HIGH for slope-side villages.",
      severity: "HIGH", state: "WARNING", status: "ACTIVE",
      locationName: "Mandi, Himachal Pradesh", region: "Himachal Pradesh", latitude: 31.7085, longitude: 76.9314, radiusKm: 30,
      startTime: hoursAgo(26), endTime: inHours(60),
      source: "DisasterGuard Simulation Engine", sourceType: "SIMULATED", confidence: 70,
      verificationStatus: "UNVERIFIED", isSimulated: true,
      recommendedActions: ["Move away from cracked slopes and bulging walls", "Avoid night travel on hill roads", "Report new cracks or tilting trees immediately", "Keep a packed bag ready in case evacuation is ordered"],
      affectedAreas: ["Mandi–Katra road sector", "Slope-side villages near Paddal"],
      whatHappened: "New surface cracks and muddy seepage observed on the road-cut slope (simulated field inputs).",
      whatNext: "With more rain forecast, debris flow probability stays high for the next 48 hours.",
      dos: ["Alert neighbours loudly if you notice movement", "Move uphill sideways from the flow path"],
      donts: ["Do not stand at the slide edge to film videos", "Do not drive over water-covered road sections"],
    },
    {
      disasterType: "CYCLONE", title: "Cyclone Advisory — North Coastal Tamil Nadu",
      description: "A depression over the Bay of Bengal (simulated) is likely to intensify into a cyclonic storm and cross the coast near Chennai. This historical advisory has been RESOLVED after landfall completed without major damage.",
      severity: "CRITICAL", state: "CRITICAL", status: "RESOLVED",
      locationName: "Chennai, Tamil Nadu", region: "Chennai", latitude: 13.0827, longitude: 80.2707, radiusKm: 120,
      startTime: daysAgo(21), endTime: daysAgo(19),
      source: "DisasterGuard Simulation Engine", sourceType: "SIMULATED", confidence: 88,
      verificationStatus: "VERIFIED", isSimulated: true,
      recommendedActions: ["Follow evacuation orders to cyclone shelters", "Store drinking water for 3 days", "Fishermen: do not venture to sea"],
      affectedAreas: ["North coastal Tamil Nadu", "Chennai", "Tiruvallur"],
      whatHappened: "Simulated cyclone made landfall with 95 km/h gusts; 14,000 people were moved to shelters.",
      whatNext: "Resolved. Review recovery checklist and restock supplies.",
      dos: ["Restock emergency supplies", "Review insurance and damages"],
      donts: ["Do not enter damaged buildings without inspection"],
    },
    {
      disasterType: "FLOOD", title: "Urban Waterlogging — Patna (Resolved)",
      description: "Short-duration intense rain (simulated) caused waterlogging in central Patna. Pumping restored drainage in 18 hours. Alert resolved.",
      severity: "MODERATE", state: "WATCH", status: "RESOLVED",
      locationName: "Patna, Bihar", region: "Patna", latitude: 25.5941, longitude: 85.1376, radiusKm: 20,
      startTime: daysAgo(9), endTime: daysAgo(9),
      source: "DisasterGuard Simulation Engine", sourceType: "SIMULATED", confidence: 75,
      verificationStatus: "UNVERIFIED", isSimulated: true,
      recommendedActions: ["Avoid waterlogged underpasses", "Boil drinking water after floods"],
      affectedAreas: ["Bailey Road", "Kankarbagh"],
      whatHappened: "85 mm rain in 3 hours overwhelmed storm-water drains (simulated).",
      whatNext: "Resolved after drainage recovery.",
      dos: [], donts: [],
    },
    {
      disasterType: "LIGHTNING", title: "Thunderstorm & Lightning Advisory — Kolkata",
      description: "Squall with intense lightning activity expected (simulated). Advisory stood down after evening passage.",
      severity: "MODERATE", state: "WATCH", status: "EXPIRED",
      locationName: "Kolkata, West Bengal", region: "Kolkata", latitude: 22.5726, longitude: 88.3639, radiusKm: 45,
      startTime: daysAgo(16), endTime: daysAgo(16),
      source: "DisasterGuard Simulation Engine", sourceType: "SIMULATED", confidence: 68,
      verificationStatus: "UNVERIFIED", isSimulated: true,
      recommendedActions: ["Stay indoors at first thunder", "Unplug sensitive electronics"],
      affectedAreas: ["Kolkata metro", "Howrah"],
      whatHappened: "Evening squall with 44 lightning strikes detected (simulated).",
      whatNext: "Expired automatically after weather cleared.",
      dos: [], donts: [],
    },
  ];

  const alertIds: string[] = [];
  for (const a of alertSeed) {
    const { recommendedActions, affectedAreas, dos, donts, ...rest } = a;
    const created = await db.alert.create({
      data: {
        ...rest,
        recommendedActionsJson: JSON.stringify(recommendedActions),
        affectedAreasJson: JSON.stringify(affectedAreas),
        dosJson: JSON.stringify(dos),
        dontsJson: JSON.stringify(donts),
        createdBy: admin.id,
      },
    });
    alertIds.push(created.id);
  }

  // richer history for analytics: 14 resolved alerts spread over 45 days
  const hist = [
    ["FLOOD", "MODERATE", "Lucknow", 26.8467, 80.9462, 30, 38],
    ["EXTREME_RAIN", "HIGH", "Mumbai", 19.076, 72.8777, 44, 40],
    ["HEATWAVE", "MODERATE", "Delhi", 28.6139, 77.2090, 55, 36],
    ["WILDFIRE", "LOW", "Uttarakhand", 30.0668, 79.0193, 26, 20],
    ["STORM", "HIGH", "Kolkata", 22.5726, 88.3639, 18, 12],
    ["EARTHQUAKE", "LOW", "Dehradun", 30.3165, 78.0322, 12, 33],
    ["CYCLONE", "HIGH", "Chennai", 13.0827, 80.2707, 21, 41],
    ["FLOOD", "HIGH", "Kerala", 9.9312, 76.2673, 8, 44],
    ["LANDSLIDE", "MODERATE", "Himachal Pradesh", 31.7085, 76.9314, 15, 25],
    ["LIGHTNING", "LOW", "Lucknow", 26.8467, 80.9462, 5, 18],
    ["HEATWAVE", "HIGH", "Jaipur", 26.9124, 75.7873, 35, 46],
    ["FLOOD", "CRITICAL", "Patna", 25.5941, 85.1376, 42, 50],
    ["STORM", "MODERATE", "Bhubaneswar", 20.2961, 85.8245, 28, 30],
    ["EXTREME_RAIN", "MODERATE", "Bengaluru", 12.9716, 77.5946, 3, 22],
  ] as const;
  for (let i = 0; i < hist.length; i++) {
    const [dt, sev, region, lat, lng, startedAgo, radius] = hist[i];
    await db.alert.create({
      data: {
        disasterType: dt, title: `${dt.replace("_", " ")} incident — ${region} (archived)`,
        description: "Archived historical alert used for analytics demonstration. All data is simulated for the DisasterGuard prototype.",
        severity: sev, state: sev === "CRITICAL" ? "CRITICAL" : sev === "HIGH" ? "WARNING" : sev === "MODERATE" ? "WATCH" : "NORMAL",
        status: "RESOLVED", locationName: region, region, latitude: lat, longitude: lng, radiusKm: radius,
        startTime: daysAgo(startedAgo), endTime: daysAgo(Math.max(0, startedAgo - 1)),
        source: "DisasterGuard Simulation Engine", sourceType: "SIMULATED", confidence: 65 + (i % 20),
        verificationStatus: i % 3 === 0 ? "VERIFIED" : "UNVERIFIED", isSimulated: true,
        recommendedActionsJson: "[]", affectedAreasJson: "[]", dosJson: "[]", dontsJson: "[]",
        createdBy: admin.id,
      },
    });
  }

  // ---------- community reports ----------
  await db.disasterReport.createMany({
    data: [
      { userId: demo.id, reporterName: "Aarav Verma", reportType: "FLOODING", description: "Waist-deep water on the service road near Gomti barrage. Two-wheelers unable to pass. Water rising since morning.", locationName: "Gomti barrage service road, Lucknow", latitude: 26.8551, longitude: 80.9432, severity: "HIGH", status: "PENDING" },
      { userId: extras[1].id, reporterName: "Rahul Joshi", reportType: "ROAD_BLOCKAGE", description: "Tree uprooted across Rajpur Road near the cemetery. Traffic blocked for 40 minutes.", locationName: "Rajpur Road, Dehradun", latitude: 30.3265, longitude: 78.0402, severity: "MODERATE", status: "VERIFIED", reviewedBy: admin.id, reviewNote: "Confirmed with municipal crew photo." },
      { userId: extras[5].id, reporterName: "Vikram Singh", reportType: "LANDSLIDE", description: "Fresh mudslide debris on the Mandi–Katra road curve, about 2 m deep. Smell of wet earth, slope still seeping.", locationName: "Mandi–Katra road, HP", latitude: 31.7120, longitude: 76.9400, severity: "HIGH", status: "VERIFIED", reviewedBy: admin.id },
      { userId: extras[3].id, reporterName: "Arjun Mehta", reportType: "INFRASTRUCTURE", description: "Electric pole leaning dangerously over the footpath after the squall, sparking occasionally.", locationName: "Andheri East, Mumbai", latitude: 19.1136, longitude: 72.8697, severity: "CRITICAL", status: "PENDING" },
      { userId: extras[2].id, reporterName: "Sana Khan", reportType: "OTHER", description: "Reported smoke near Nahari ka Naka; turned out to be controlled burning by municipal team.", locationName: "Jaipur", latitude: 26.9200, longitude: 75.7900, severity: "LOW", status: "REJECTED", reviewedBy: admin.id, reviewNote: "Verified as controlled burning, not a hazard." },
      { userId: extras[4].id, reporterName: "Isha Bose", reportType: "FALLEN_TREE", description: "Fallen tree removed already by civic volunteers, posting for records.", locationName: "Salt Lake, Kolkata", latitude: 22.5867, longitude: 88.4170, severity: "LOW", status: "RESOLVED", reviewedBy: admin.id, reviewNote: "Cleanup confirmed." },
    ],
  });

  // ---------- notifications for demo user ----------
  await db.notification.createMany({
    data: [
      { userId: demo.id, alertId: alertIds[0], channel: "IN_APP", title: "⚠️ HIGH FLOOD RISK — Lucknow", body: "Gomti river near warning level. Move to higher ground if you are in a low-lying area. (DEMO ALERT)", severity: "HIGH", deliveryStatus: "READ" },
      { userId: demo.id, alertId: alertIds[0], channel: "EMAIL", title: "⚠️ HIGH FLOOD RISK — Lucknow", body: "Email delivery simulated by DisasterGuard demo engine.", severity: "HIGH", deliveryStatus: "SENT" },
      { userId: demo.id, alertId: alertIds[1], channel: "IN_APP", title: "Severe Thunderstorm Watch — Delhi NCR", body: "Secure loose objects; storms likely this evening. (DEMO ALERT)", severity: "MODERATE", read: true, deliveryStatus: "READ" },
      { userId: demo.id, alertId: alertIds[3], channel: "PUSH", title: "Heatwave Warning — Jaipur", body: "Simulated push delivery. Avoid outdoor exposure 11 AM–4 PM.", severity: "HIGH", deliveryStatus: "SENT" },
      { userId: demo.id, channel: "SMS", title: "DisasterGuard readiness tip", body: "Your preparedness score is 60%. Add documents + evacuation plan to improve. (DEMO)", severity: "LOW", deliveryStatus: "SENT" },
    ],
  });

  // notifications for other users so analytics looks alive
  for (const u of extras.slice(0, 4)) {
    await db.notification.create({
      data: { userId: u.id, channel: "IN_APP", title: "Welcome to DisasterGuard (DEMO)", body: "Simulated onboarding notification for analytics demonstration.", severity: "LOW", read: Math.random() > 0.4, deliveryStatus: "READ" },
    });
  }

  // ---------- provider registry ----------
  await db.providerFeed.createMany({
    data: [
      { providerKey: "WEATHER", name: "WeatherProvider", kind: "MOCK", status: "HEALTHY", notes: "Mock IMD-style feed. Set WEATHER_API_KEY and implement WeatherProvider against a real API to go live." },
      { providerKey: "EARTHQUAKE", name: "EarthquakeProvider", kind: "MOCK", status: "HEALTHY", notes: "Mock seismic feed. Ready for USGS/INCOIS integration." },
      { providerKey: "FLOOD", name: "FloodProvider", kind: "MOCK", status: "HEALTHY", notes: "Mock river-gauge / IoT sensor feed. Ready for CWC or LoRaWAN sensor integration." },
      { providerKey: "SATELLITE", name: "SatelliteProvider", kind: "MOCK", status: "HEALTHY", notes: "Mock satellite/radar index. Ready for imagery API integration." },
    ],
  });

  // ---------- sample risk assessments ----------
  await db.riskAssessment.createMany({
    data: [
      { userId: demo.id, locationName: "Lucknow", disasterType: "FLOOD", conditionsText: "Heavy rain since morning, river near warning level", riskScore: 78, riskLevel: "HIGH", factorsJson: JSON.stringify([{ factor: "Heavy rainfall (180 mm / 36 h, simulated)", weight: 30 }, { factor: "Rising river level (5.9 m, simulated gauge)", weight: 28 }, { factor: "Low-lying terrain", weight: 12 }]), actionsJson: JSON.stringify(["Move belongings to higher areas", "Keep emergency supplies ready", "Monitor official alerts", "Prepare evacuation route"]), dataBasis: "MODEL", generatedBy: "guardian-ai" },
      { userId: extras[2].id, locationName: "Jaipur", disasterType: "HEATWAVE", conditionsText: "44C day temperature, hot nights", riskScore: 71, riskLevel: "HIGH", factorsJson: "[]", actionsJson: "[]", dataBasis: "MODEL", generatedBy: "disasterguard-heuristic-v1" },
    ],
  });

  // ---------- audit seed ----------
  await db.adminAction.createMany({
    data: [
      { adminId: admin.id, action: "CREATE_ALERT", targetType: "Alert", targetId: alertIds[0], details: "Seeded demo flood alert for Lucknow" },
      { adminId: admin.id, action: "VERIFY_REPORT", targetType: "DisasterReport", details: "Seeded verification demo" },
    ],
  });

  const counts = {
    users: await db.user.count(),
    alerts: await db.alert.count(),
    activeAlerts: await db.alert.count({ where: { status: "ACTIVE" } }),
    shelters: await db.shelter.count(),
    reports: await db.disasterReport.count(),
    notifications: await db.notification.count(),
  };
  console.log("✅ Seed complete:", counts);
  console.log("   Admin → admin@disasterguard.app / Admin@123");
  console.log("   User  → demo@disasterguard.app  / Demo@123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
