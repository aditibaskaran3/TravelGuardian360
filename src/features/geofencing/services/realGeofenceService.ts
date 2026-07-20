/**
 * Real geo-fence provider — fetches zones from the FastAPI backend.
 * Ready to activate: set USE_MOCK_GEOFENCE=false once GET /geofences exists.
 */
import { apiClient } from '../../../api/client';
import type { GeoZone } from '../types';
import type { GeofenceService } from './geofenceService';

export const realGeofenceService: GeofenceService = {
  async fetchZones(): Promise<GeoZone[]> {
    const { data } = await apiClient.get<GeoZone[]>('/geofences');
    return data;
  },
};
