/**
 * Geospatial helpers — distance and formatting. Pure functions, no deps.
 */
import type { Coordinates } from '../features/tracking/types';

const EARTH_RADIUS_M = 6_371_000;
const toRad = (deg: number): number => (deg * Math.PI) / 180;

/** Great-circle distance between two coordinates, in meters (haversine). */
export function haversineMeters(a: Coordinates, b: Coordinates): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** "28.613900" style fixed-precision coordinate. */
export const formatCoord = (value: number): string => value.toFixed(6);

/** Human-friendly distance: meters under 1 km, else kilometers. */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
}

/** Speed in m/s -> "x.x km/h". */
export function formatSpeed(speedMs: number | null): string {
  if (speedMs == null || speedMs < 0) {
    return '—';
  }
  return `${(speedMs * 3.6).toFixed(1)} km/h`;
}
