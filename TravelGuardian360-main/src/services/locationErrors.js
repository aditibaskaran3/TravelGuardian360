import { t } from '../i18n';
export class LocationError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

const MESSAGES = {
  denied: t('Location permission was denied. Allow location access in your browser or device settings.'),
  unavailable: t('Your position could not be determined. Check that location services are turned on.'),
  timeout: t('Finding your position took too long. Please try again.'),
  unsupported: t('This device does not support location services.'),
};

export const fail = (code) => new LocationError(code, MESSAGES[code]);

export function mapError(err) {
  if (err instanceof LocationError) return err;
  // 1 = permission denied, 2 = position unavailable, 3 = timeout (same on web and native)
  if (err && err.code === 1) return fail('denied');
  if (err && err.code === 3) return fail('timeout');
  return fail('unavailable');
}

export const toPosition = (pos) => ({
  latitude: pos.coords.latitude,
  longitude: pos.coords.longitude,
  accuracy: pos.coords.accuracy ?? null,
});
