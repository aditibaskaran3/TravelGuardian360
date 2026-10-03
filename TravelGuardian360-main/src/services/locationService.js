import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

import { fail, mapError, toPosition } from './locationErrors';

export { LocationError } from './locationErrors';

async function ensurePermission() {
  if (Platform.OS !== 'android') return;
  const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
  if (result !== PermissionsAndroid.RESULTS.GRANTED) throw fail('denied');
}

export async function getCurrentPosition({ highAccuracy = true, timeout = 10000 } = {}) {
  await ensurePermission();
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      (pos) => resolve(toPosition(pos)),
      (err) => reject(mapError(err)),
      { enableHighAccuracy: highAccuracy, timeout, maximumAge: 5000 },
    );
  });
}

/** Continuous updates. Resolves to a function that stops watching. */
export async function watchPosition(onUpdate, onError, { highAccuracy = true } = {}) {
  await ensurePermission();
  const id = Geolocation.watchPosition(
    (pos) => onUpdate(toPosition(pos)),
    (err) => onError(mapError(err)),
    { enableHighAccuracy: highAccuracy, maximumAge: 5000, timeout: 20000, distanceFilter: 5 },
  );
  return () => Geolocation.clearWatch(id);
}
