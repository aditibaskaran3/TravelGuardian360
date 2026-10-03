/**
 * Real device-GPS location service (backed by @react-native-community/geolocation).
 *
 * NOT wired up yet — locationService.ts resolves to the mock while the native
 * package is uninstalled. This file is complete and ready: once you
 *   1) install @react-native-community/geolocation and rebuild, and
 *   2) point locationService.ts at realLocationService,
 * device GPS works with no further changes.
 *
 * The geolocation package is loaded via require() so this file stays
 * TypeScript-clean before the package exists. Nothing imports this file yet,
 * so Metro never resolves it — the offline bundle is unaffected.
 */
import { PermissionsAndroid, Platform } from 'react-native';
import type { LocationError, LocationSample } from '../types';
import type { LocationService } from './locationService';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Geolocation = require('@react-native-community/geolocation');

type RawPosition = {
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number | null;
    speed: number | null;
  };
  timestamp: number;
};

type RawError = { code: number; message: string };

const toSample = (position: RawPosition): LocationSample => ({
  latitude: position.coords.latitude,
  longitude: position.coords.longitude,
  accuracy: position.coords.accuracy,
  speed: position.coords.speed,
  timestamp: position.timestamp,
});

const toError = (error: RawError): LocationError => {
  switch (error.code) {
    case 1:
      return { code: 'PERMISSION_DENIED', message: 'Location permission denied.' };
    case 2:
      return { code: 'POSITION_UNAVAILABLE', message: 'Position unavailable.' };
    case 3:
      return { code: 'TIMEOUT', message: 'Location request timed out.' };
    default:
      return { code: 'UNKNOWN', message: error.message || 'Unknown location error.' };
  }
};

export const realLocationService: LocationService = {
  async requestPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location permission',
          message: 'TravelGuardian360 needs your location to keep you safe while traveling.',
          buttonPositive: 'Allow',
          buttonNegative: 'Deny',
        },
      );
      return result === PermissionsAndroid.RESULTS.GRANTED;
    }
    // iOS
    Geolocation.requestAuthorization('whenInUse');
    return true;
  },

  getCurrentPosition(): Promise<LocationSample> {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position: RawPosition) => resolve(toSample(position)),
        (error: RawError) => reject(toError(error)),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 1000 },
      );
    });
  },

  watchPosition(
    onSample: (sample: LocationSample) => void,
    onError: (error: LocationError) => void,
  ): () => void {
    const watchId = Geolocation.watchPosition(
      (position: RawPosition) => onSample(toSample(position)),
      (error: RawError) => onError(toError(error)),
      { enableHighAccuracy: true, distanceFilter: 5, interval: 3000, fastestInterval: 2000 },
    );
    return () => Geolocation.clearWatch(watchId);
  },
};
