/**
 * Hook exposing trip state and controls.
 */
import { useTripStore } from '../../../store/tripStore';

export function useTripMode() {
  const trip = useTripStore((s) => s.trip);
  const status = useTripStore((s) => s.status);
  const startTrip = useTripStore((s) => s.startTrip);
  const endTrip = useTripStore((s) => s.endTrip);
  const pauseTrip = useTripStore((s) => s.pauseTrip);
  const resumeTrip = useTripStore((s) => s.resumeTrip);

  return {
    trip,
    status,
    isActive: status === 'active',
    isPaused: status === 'paused',
    startTrip,
    endTrip,
    pauseTrip,
    resumeTrip,
  };
}
