export type TripStatus = 'idle' | 'active' | 'paused';

export type TripData = {
  id: string;
  /** Human-readable trip name (e.g. "New Delhi Explorer"). */
  name?: string;
  /** Destination city/country. */
  destination?: string;
  status: TripStatus;
  startedAt: number | null;
  endedAt: number | null;
  durationMinutes: number;
};
