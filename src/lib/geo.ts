// Region matching + geo helpers

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function regionMatches(userRegion: string | null | undefined, alertRegion: string): boolean {
  if (!userRegion) return false;
  const a = userRegion.toLowerCase().trim();
  const b = alertRegion.toLowerCase().trim();
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

export function alertAffectsUser(
  alert: { region: string; latitude: number; longitude: number; radiusKm: number },
  user: { region?: string | null; lat?: number | null; lng?: number | null }
): boolean {
  if (regionMatches(user.region, alert.region)) return true;
  if (user.lat != null && user.lng != null) {
    return haversineKm(user.lat, user.lng, alert.latitude, alert.longitude) <= alert.radiusKm;
  }
  return false;
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}
