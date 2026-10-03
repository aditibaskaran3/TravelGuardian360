/**
 * Demo Location Service — emits a deterministic New Delhi GPS path so the
 * demo always follows the same route and triggers zone transitions in the
 * same order every recording.
 *
 * The path is defined in demoData.ts and passes through:
 *   Connaught Place (safe) → Paharganj (caution) → Chandni Chowk (high-risk) → back
 *
 * To replace with real device GPS:
 *   1) Install @react-native-community/geolocation
 *   2) Set USE_MOCK_LOCATION = false in config/env.ts
 *   3) The locationService.ts abstraction switches automatically
 */
import {
  LOCATION_UPDATE_INTERVAL_MS,
  MOCK_START_COORDINATES,
} from '../../../config/env';
import { DEMO_LOCATION_PATH } from '../../../demo/demoData';
import type { LocationError, LocationSample } from '../types';
import type { LocationService } from './locationService';

const makeSample = (
  latitude: number,
  longitude: number,
  speed: number,
  accuracy: number,
): LocationSample => ({
  latitude,
  longitude,
  accuracy,
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
      8,
    );
  },

  watchPosition(
    onSample: (sample: LocationSample) => void,
    _onError: (error: LocationError) => void,
  ): () => void {
    let index = 0;
    const path = DEMO_LOCATION_PATH;

    // Emit the first fix immediately.
    const first = path[0];
    onSample(makeSample(first.latitude, first.longitude, 0, 8));

    const interval = setInterval(() => {
      index = (index + 1) % path.length;
      const point = path[index];

      // Calculate approximate speed from previous point for realism.
      const prev = path[index === 0 ? path.length - 1 : index - 1];
      const dlat = (point.latitude - prev.latitude) * 111000; // metres
      const dlng = (point.longitude - prev.longitude) * 111000 * Math.cos(point.latitude * (Math.PI / 180));
      const dist = Math.sqrt(dlat * dlat + dlng * dlng);
      const speed = dist / (LOCATION_UPDATE_INTERVAL_MS / 1000); // m/s
      const accuracy = 5 + Math.random() * 8; // 5–13 m, realistic urban GPS

      onSample(makeSample(point.latitude, point.longitude, speed, accuracy));
    }, LOCATION_UPDATE_INTERVAL_MS);

    return () => clearInterval(interval);
  },
};
