/**
 * Geo-fencing domain types.
 */
import type { Coordinates } from '../tracking/types';

export type ZoneType = 'safe' | 'restricted' | 'hazardous';

/** A circular geo-fence: everything within `radiusMeters` of `center`. */
export type GeoZone = {
  id: string;
  name: string;
  type: ZoneType;
  description: string;
  center: Coordinates;
  radiusMeters: number;
};

/** Result of testing the current position against one zone. */
export type ZoneProximity = {
  zone: GeoZone;
  /** Distance from the current position to the zone edge (0 if inside). */
  distanceToEdgeMeters: number;
  isInside: boolean;
};

/** An alert raised when the user enters a restricted/hazardous zone. */
export type GeoAlert = {
  zone: GeoZone;
  enteredAt: number;
};
