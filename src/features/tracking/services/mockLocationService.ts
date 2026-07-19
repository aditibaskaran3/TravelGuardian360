/**
 * Mock location service — emits a realistic, drifting GPS track so the whole
 * tracking feature works on-device with no native module. Simulates a slow
 * walk away from a start point, with plausible accuracy and speed.
 */
import {
  LOCATION_UPDATE_INTERVAL_MS,
  MOCK_START_COORDINATES,
} from '../../../config/env';
import type { LocationError, LocationSample } from '../types';
import type { LocationService } from './locationService';

// ~1 meter of latitude ≈ 0.000009 degrees. Each tick moves a few meters.
const STEP_DEG = 0.00003;

const makeSample = (
  latitude: number,
  longitude: number,
  speed: number,
): LocationSample => ({
  latitude,
  longitude,
  accuracy: 5 + Math.random() * 10, // 5–15 m
  speed,
  timestamp: Date.now(),
});

export const mockLocationService: LocationService = {
  async requestPermission(): Promise<boolean> {
    return true;
  },

  async getCurrentPosition(): Promise<LocationSample> {
    return makeSample(
      MOCK_START_COORDINATES.latitude,
      MOCK_START_COORDINATES.longitude,
      0,
    );
  },

  watchPosition(
    onSample: (sample: LocationSample) => void,
    _onError: (error: LocationError) => void,
  ): () => void {
    let { latitude, longitude } = MOCK_START_COORDINATES;

    // Emit an immediate first fix.
    onSample(makeSample(latitude, longitude, 0));

    const interval = setInterval(() => {
      // Wander in a semi-random direction to mimic real movement.
      const bearing = Math.random() * 2 * Math.PI;
      latitude += Math.cos(bearing) * STEP_DEG;
      longitude += Math.sin(bearing) * STEP_DEG;
      const speed = 0.8 + Math.random() * 1.5; // ~walking pace, m/s
      onSample(makeSample(latitude, longitude, speed));
    }, LOCATION_UPDATE_INTERVAL_MS);

    return () => clearInterval(interval);
  },
};
