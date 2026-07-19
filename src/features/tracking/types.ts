/**
 * Location/tracking domain types.
 */

export type Coordinates = {
  latitude: number;
  longitude: number;
};

/** A single position reading. */
export type LocationSample = Coordinates & {
  /** Horizontal accuracy in meters (if known). */
  accuracy: number | null;
  /** Speed in m/s (if known). */
  speed: number | null;
  /** Epoch milliseconds when the sample was taken. */
  timestamp: number;
};

export type TrackingStatus = 'idle' | 'requesting' | 'tracking' | 'error';

/** Error surfaced by the location layer. */
export type LocationError = {
  code: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'UNKNOWN';
  message: string;
};
