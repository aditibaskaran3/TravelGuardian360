/**
 * Demo geo-fence provider — realistic New Delhi zones that reliably trigger
 * during the demo location path.
 *
 * Zones are sourced from demoData.ts (single source of truth).
 * The demo path is designed to enter these zones in this order:
 *   1. Connaught Place (safe)
 *   2. Paharganj (caution / hazardous)
 *   3. Chandni Chowk (high-risk / restricted)
 */
import { DEMO_ZONES } from '../../../demo/demoData';
import type { GeoZone } from '../types';
import type { GeofenceService } from './geofenceService';

export const mockGeofenceService: GeofenceService = {
  async fetchZones(): Promise<GeoZone[]> {
    return DEMO_ZONES;
  },
};
