/**
 * Geo-fence data source abstraction.
 *
 * Screens/store depend only on this. Resolves to the mock (static zones) until
 * the FastAPI backend exposes zones; then set USE_MOCK_GEOFENCE=false.
 */
import { USE_MOCK_GEOFENCE } from '../../../config/env';
import type { GeoZone } from '../types';
import { mockGeofenceService } from './mockGeofenceService';
import { realGeofenceService } from './realGeofenceService';

export type GeofenceService = {
  /** Fetches the zones relevant to the user (all zones in the mock). */
  fetchZones(): Promise<GeoZone[]>;
};

export const geofenceService: GeofenceService = USE_MOCK_GEOFENCE
  ? mockGeofenceService
  : realGeofenceService;
