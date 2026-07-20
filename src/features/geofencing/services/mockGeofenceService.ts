/**
 * Mock geo-fence provider — static zones positioned around the simulated
 * tracking start point so the feature demonstrably triggers while tracking.
 */
import { MOCK_START_COORDINATES } from '../../../config/env';
import type { GeoZone } from '../types';
import type { GeofenceService } from './geofenceService';

const { latitude, longitude } = MOCK_START_COORDINATES;

const ZONES: GeoZone[] = [
  {
    id: 'zone-safe-center',
    name: 'City Center Safe Zone',
    type: 'safe',
    description: 'Well-patrolled tourist area with high safety rating.',
    center: { latitude, longitude },
    radiusMeters: 300,
  },
  {
    id: 'zone-hazard-flood',
    name: 'Flood Hazard Area',
    type: 'hazardous',
    // ~300 m north-east of center — the simulated walk can wander into this.
    center: { latitude: latitude + 0.002, longitude: longitude + 0.002 },
    radiusMeters: 180,
  },
  {
    id: 'zone-restricted-military',
    name: 'Restricted Military Area',
    type: 'restricted',
    // ~450 m north of center.
    center: { latitude: latitude + 0.004, longitude },
    radiusMeters: 220,
  },
];

export const mockGeofenceService: GeofenceService = {
  async fetchZones(): Promise<GeoZone[]> {
    return ZONES;
  },
};
