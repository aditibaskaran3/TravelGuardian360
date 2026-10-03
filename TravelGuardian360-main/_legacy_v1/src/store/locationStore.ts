/**
 * Location store — holds live tracking state and the accumulated track.
 *
 * The native/mock watch subscription is kept in module scope (not in state)
 * because it's a non-serializable function and must survive re-renders.
 */
import { create } from './createStore';
import { locationService } from '../features/tracking/services/locationService';
import { haversineMeters } from '../utils/geo';
import type { LocationError, LocationSample, TrackingStatus } from '../features/tracking/types';

// Cap history so long sessions don't grow memory unbounded.
const MAX_HISTORY = 500;

type LocationState = {
  status: TrackingStatus;
  current: LocationSample | null;
  history: LocationSample[];
  distanceMeters: number;
  error: LocationError | null;

  startTracking: () => Promise<void>;
  stopTracking: () => void;
  reset: () => void;
};

let unsubscribe: (() => void) | null = null;

export const useLocationStore = create<LocationState>((set, get) => ({
  status: 'idle',
  current: null,
  history: [],
  distanceMeters: 0,
  error: null,

  async startTracking() {
    if (get().status === 'tracking') {
      return;
    }
    set({ status: 'requesting', error: null });

    const granted = await locationService.requestPermission();
    if (!granted) {
      set({
        status: 'error',
        error: { code: 'PERMISSION_DENIED', message: 'Location permission is required to track your trip.' },
      });
      return;
    }

    unsubscribe = locationService.watchPosition(
      (sample) => {
        const { history, distanceMeters, current } = get();
        const nextDistance = current ? distanceMeters + haversineMeters(current, sample) : distanceMeters;
        const nextHistory = [...history, sample].slice(-MAX_HISTORY);
        set({
          current: sample,
          history: nextHistory,
          distanceMeters: nextDistance,
          status: 'tracking',
        });
      },
      (error) => set({ status: 'error', error }),
    );

    set({ status: 'tracking' });
  },

  stopTracking() {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    set({ status: 'idle' });
  },

  reset() {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    set({ status: 'idle', current: null, history: [], distanceMeters: 0, error: null });
  },
}));
