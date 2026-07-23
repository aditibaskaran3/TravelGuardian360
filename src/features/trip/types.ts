export type TripStatus = 'idle' | 'active' | 'paused';

export type TripData = {
  id: string;
  status: TripStatus;
  startedAt: number | null;
  endedAt: number | null;
  durationMinutes: number;
};
