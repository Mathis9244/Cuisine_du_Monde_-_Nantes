import type { GeoPoint } from "./types";

export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const hav =
    sinLat * sinLat +
    Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon;

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(hav));
}

export function formatDistanceKm(distanceKm: number): string {
  if (!Number.isFinite(distanceKm)) return "—";
  if (distanceKm < 1) return `${Math.max(0.1, distanceKm).toFixed(1)} km`;
  return `${distanceKm.toFixed(distanceKm >= 10 ? 0 : 1)} km`;
}
