// DisasterGuard — Shared domain constants

export const DISASTER_TYPES = [
  "FLOOD",
  "EARTHQUAKE",
  "CYCLONE",
  "TSUNAMI",
  "WILDFIRE",
  "STORM",
  "EXTREME_RAIN",
  "HEATWAVE",
  "LANDSLIDE",
  "LIGHTNING",
  "INDUSTRIAL",
  "OTHER",
] as const;
export type DisasterType = (typeof DISASTER_TYPES)[number];

export const SEVERITIES = ["LOW", "MODERATE", "HIGH", "CRITICAL"] as const;
export type Severity = (typeof SEVERITIES)[number];

export const ALERT_STATES = ["NORMAL", "WATCH", "WARNING", "CRITICAL"] as const;
export type AlertState = (typeof ALERT_STATES)[number];

export const ALERT_STATUS = ["ACTIVE", "RESOLVED", "CANCELLED", "EXPIRED"] as const;
export type AlertStatus = (typeof ALERT_STATUS)[number];

export const REPORT_TYPES = [
  "FLOODING",
  "ROAD_BLOCKAGE",
  "FIRE",
  "FALLEN_TREE",
  "LANDSLIDE",
  "INFRASTRUCTURE",
  "OTHER",
] as const;
export type ReportType = (typeof REPORT_TYPES)[number];

export const REPORT_STATUSES = ["PENDING", "VERIFIED", "REJECTED", "RESOLVED"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const CHANNELS = ["IN_APP", "EMAIL", "PUSH", "SMS"] as const;
export type Channel = (typeof CHANNELS)[number];

export const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिन्दी (Hindi)" },
  { value: "bn", label: "বাংলা (Bengali)" },
  { value: "ta", label: "தமிழ் (Tamil)" },
  { value: "te", label: "తెలుగు (Telugu)" },
  { value: "mr", label: "मराठी (Marathi)" },
  { value: "gu", label: "ગુજરાતી (Gujarati)" },
] as const;

export const DISASTER_META: Record<
  DisasterType,
  { label: string; icon: string; color: string; bg: string; emoji: string; description: string }
> = {
  FLOOD: { label: "Flood", icon: "Waves", color: "#38bdf8", bg: "rgba(56,189,248,0.12)", emoji: "🌊", description: "Inundation of normally dry land by rising or overflowing water." },
  EARTHQUAKE: { label: "Earthquake", icon: "Activity", color: "#f97316", bg: "rgba(249,115,22,0.12)", emoji: "🌎", description: "Sudden ground shaking caused by movement of tectonic plates." },
  CYCLONE: { label: "Cyclone", icon: "Tornado", color: "#a78bfa", bg: "rgba(167,139,250,0.12)", emoji: "🌪", description: "Rotating storm system with destructive winds and storm surge." },
  TSUNAMI: { label: "Tsunami", icon: "Waves", color: "#2dd4bf", bg: "rgba(45,212,191,0.12)", emoji: "🌊", description: "Series of large ocean waves triggered by undersea disturbances." },
  WILDFIRE: { label: "Wildfire", icon: "Flame", color: "#f87171", bg: "rgba(248,113,113,0.12)", emoji: "🔥", description: "Uncontrolled fire spreading across vegetation or populated areas." },
  STORM: { label: "Severe Storm", icon: "CloudLightning", color: "#94a3b8", bg: "rgba(148,163,184,0.12)", emoji: "⛈", description: "Violent weather with thunder, hail, and damaging winds." },
  EXTREME_RAIN: { label: "Extreme Rain", icon: "CloudRain", color: "#60a5fa", bg: "rgba(96,165,250,0.12)", emoji: "🌧", description: "Torrential rainfall that can trigger flooding and landslides." },
  HEATWAVE: { label: "Heatwave", icon: "ThermometerSun", color: "#fbbf24", bg: "rgba(251,191,36,0.12)", emoji: "🌡", description: "Prolonged period of excessively hot weather and heat stress." },
  LANDSLIDE: { label: "Landslide", icon: "Mountain", color: "#fb923c", bg: "rgba(251,146,60,0.12)", emoji: "⛰", description: "Downward movement of rock, earth, or debris down a slope." },
  LIGHTNING: { label: "Lightning", icon: "Zap", color: "#facc15", bg: "rgba(250,204,21,0.12)", emoji: "⚡", description: "Electrical discharges from thunderstorms striking ground or objects." },
  INDUSTRIAL: { label: "Industrial Accident", icon: "Factory", color: "#f472b6", bg: "rgba(244,114,182,0.12)", emoji: "🏭", description: "Chemical spills, explosions, or failures at industrial facilities." },
  OTHER: { label: "Other Emergency", icon: "AlertTriangle", color: "#e879f9", bg: "rgba(232,121,249,0.12)", emoji: "🚨", description: "Other regional emergencies and hazards." },
};

export const SEVERITY_META: Record<
  Severity,
  { label: string; color: string; text: string; bg: string; border: string; rank: number; state: AlertState }
> = {
  LOW: { label: "Low", color: "#22c55e", text: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/30", rank: 0, state: "NORMAL" },
  MODERATE: { label: "Moderate", color: "#eab308", text: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/30", rank: 1, state: "WATCH" },
  HIGH: { label: "High", color: "#f97316", text: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/30", rank: 2, state: "WARNING" },
  CRITICAL: { label: "Critical", color: "#ef4444", text: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/30", rank: 3, state: "CRITICAL" },
};

export const RISK_LEVEL_COLORS: Record<Severity, string> = {
  LOW: "#22c55e",
  MODERATE: "#eab308",
  HIGH: "#f97316",
  CRITICAL: "#ef4444",
};

// Official India emergency numbers.
// IMPORTANT: These are presented for convenience only. The platform treats them as
// configurable data — administrators can update them — and users are always advised
// to verify with official government sources (ndma.gov.in / sachet.ndma.gov.in).
export const INDIA_EMERGENCY_NUMBERS = [
  { name: "National Emergency Helpline", number: "112", note: "Police, Fire, Ambulance (all-in-one)" },
  { name: "Police", number: "100", note: "Law & order emergencies" },
  { name: "Fire & Rescue", number: "101", note: "Fire emergencies and rescue" },
  { name: "Ambulance / Medical", number: "108", note: "Free emergency ambulance service" },
  { name: "Disaster Management (NDMA Helpline)", number: "1078", note: "National Disaster Management Authority" },
  { name: "Women Helpline", number: "1091", note: "Assistance for women in distress" },
  { name: "Child Helpline", number: "1098", note: "CHILDLINE India" },
  { name: "Railway Accident Helpline", number: "1072", note: "Railway emergencies" },
  { name: "Road Accident Helpline", number: "1073", note: "Highway / road accidents" },
  { name: "Gas Leak Emergency", number: "1906", note: "Oil & gas pipeline emergency" },
];

export const DEFAULT_CHECKLIST = [
  { itemKey: "EMERGENCY_KIT", label: "Emergency kit packed & accessible", category: "SUPPLIES" },
  { itemKey: "WATER", label: "Drinking water stored (3 days per person)", category: "SUPPLIES" },
  { itemKey: "FIRST_AID", label: "First-aid kit stocked", category: "SUPPLIES" },
  { itemKey: "TORCH", label: "Torch / flashlight with spare batteries", category: "SUPPLIES" },
  { itemKey: "POWER_BANK", label: "Power bank charged", category: "SUPPLIES" },
  { itemKey: "DOCUMENTS", label: "Important documents in waterproof bag", category: "DOCUMENTS" },
  { itemKey: "CONTACTS", label: "Emergency contacts saved & printed", category: "PLANNING" },
  { itemKey: "EVAC_PLAN", label: "Family evacuation plan discussed", category: "PLANNING" },
  { itemKey: "MEETING_POINT", label: "Safe meeting point decided", category: "PLANNING" },
  { itemKey: "MEDICINES", label: "Essential medicines for 7 days", category: "SUPPLIES" },
] as const;

export function severityToState(severity: string): AlertState {
  return SEVERITY_META[(severity as Severity)]?.state ?? "WATCH";
}

export function maxSeverity(a: string, b: string): Severity {
  const ra = SEVERITY_META[a as Severity]?.rank ?? 0;
  const rb = SEVERITY_META[b as Severity]?.rank ?? 0;
  return ra >= rb ? (a as Severity) : (b as Severity);
}
