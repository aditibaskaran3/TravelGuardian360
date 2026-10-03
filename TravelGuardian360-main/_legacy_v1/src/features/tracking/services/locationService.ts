/**
 * Location service abstraction.
 *
 * The store/hook/screen depend only on this interface. Right now it resolves to
 * the mock (simulated GPS) because @react-native-community/geolocation is not
 * installed. To activate real device GPS:
 *   1) install @react-native-community/geolocation (+ native rebuild)
 *   2) set USE_MOCK_LOCATION = false in config/env.ts
 *   3) uncomment the realLocationService import + branch below
 */
import { USE_MOCK_LOCATION } from '../../../config/env';
import type { LocationError, LocationSample } from '../types';
import { mockLocationService } from './mockLocationService';
// import { realLocationService } from './realLocationService';

export type LocationService = {
  /** Requests OS location permission. Resolves true if granted. */
  requestPermission(): Promise<boolean>;
  /** One-shot current position. */
  getCurrentPosition(): Promise<LocationSample>;
  /**
   * Starts streaming positions. Returns an unsubscribe function that stops
   * the stream and releases native watchers.
   */
  watchPosition(
    onSample: (sample: LocationSample) => void,
    onError: (error: LocationError) => void,
  ): () => void;
};

export const locationService: LocationService = USE_MOCK_LOCATION
  ? mockLocationService
  : mockLocationService; // ← replace right side with realLocationService when installed
