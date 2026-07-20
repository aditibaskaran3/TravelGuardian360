/**
 * Pure geo-fence evaluation. No state, no side effects — easy to reason about
 * and test. Given a position and the zones, returns proximity info per zone.
 */
import { haversineMeters } from '../../../utils/geo';
import type { Coordinates } from '../../tracking/types';
import type { GeoZone, ZoneProximity } from '../types';

export function evaluateZones(position: Coordinates, zones: GeoZone[]): ZoneProximity[] {
  return zones
    .map((zone) => {
      const distanceToCenter = haversineMeters(position, zone.center);
      const isInside = distanceToCenter <= zone.radiusMeters;
      return {
        zone,
        isInside,
        distanceToEdgeMeters: Math.max(0, distanceToCenter - zone.radiusMeters),
      };
    })
    .sort((a, b) => a.distanceToEdgeMeters - b.distanceToEdgeMeters);
}

/** Zone types that should raise an alert when entered. */
export const ALERTING_TYPES: ReadonlyArray<GeoZone['type']> = ['restricted', 'hazardous'];
