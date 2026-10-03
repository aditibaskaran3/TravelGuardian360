import { fail, mapError, toPosition } from './locationErrors';

export { LocationError } from './locationErrors';

// Browser geolocation works on localhost and on any https origin.
function geolocation() {
  if (typeof navigator === 'undefined' || !navigator.geolocation) throw fail('unsupported');
  return navigator.geolocation;
}

export function getCurrentPosition({ highAccuracy = true, timeout = 10000 } = {}) {
  return new Promise((resolve, reject) => {
    try {
      geolocation().getCurrentPosition(
        (pos) => resolve(toPosition(pos)),
        (err) => reject(mapError(err)),
        { enableHighAccuracy: highAccuracy, timeout, maximumAge: 5000 },
      );
    } catch (err) {
      reject(mapError(err));
    }
  });
}

/** Continuous updates. Resolves to a function that stops watching. */
export async function watchPosition(onUpdate, onError, { highAccuracy = true } = {}) {
  const geo = geolocation();
  const id = geo.watchPosition(
    (pos) => onUpdate(toPosition(pos)),
    (err) => onError(mapError(err)),
    { enableHighAccuracy: highAccuracy, maximumAge: 5000, timeout: 20000 },
  );
  return () => geo.clearWatch(id);
}
