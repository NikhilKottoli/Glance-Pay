/**
 * Geographic utilities for Glance Pay G2 app.
 */

export function haversineMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const earthRadius = 6371000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const lat1 = rad(a.lat);
  const lat2 = rad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function sortMerchantsByDistance<T extends { lat: number; lng: number }>(
  merchants: T[],
  origin?: { lat: number; lng: number } | null
): T[] {
  if (!origin || !Number.isFinite(origin.lat) || !Number.isFinite(origin.lng)) {
    return merchants.slice();
  }
  return merchants
    .map((m) => ({ merchant: m, distance: haversineMeters(origin, m) }))
    .sort((a, b) => a.distance - b.distance)
    .map((entry) => entry.merchant);
}