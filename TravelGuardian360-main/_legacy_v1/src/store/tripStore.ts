/**
 * Trip store — manages trip state: start/stop, duration, and status.
 * Automatically starts location tracking when a trip begins.
 *
 * In DEMO_MODE backend sync is skipped. The trip is named from demoData.
 * To restore backend sync, set DEMO_MODE=false in config/env.ts.
 */
import { create } from './createStore';
import { useLocationStore } from './locationStore';
import { DEMO_MODE } from '../config/env';
import { DEMO_TRIP_NAME, DEMO_DESTINATION } from '../demo/demoData';
import { apiClient, getApiErrorMessage } from '../api/client';
import { useAuthStore } from './authStore';
import type { TripData, TripStatus } from '../features/trip/types';

type TripState = {
  trip: TripData | null;
  status: TripStatus;

  startTrip: () => Promise<void>;
  endTrip: () => Promise<void>;
  pauseTrip: () => void;
  resumeTrip: () => void;
};

const generateId = (): string =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export const useTripStore = create<TripState>((set, get) => ({
  trip: null,
  status: 'idle',

  async startTrip() {
    const { status } = get();
    if (status !== 'idle') {
      return;
    }

    if (!DEMO_MODE) {
      const token = useAuthStore.getState().token;
      if (token) {
        try {
          await apiClient.post('/trip/start');
        } catch (error) {
          console.warn(getApiErrorMessage(error, 'Unable to sync trip start with server.'));
        }
      }
    }

    set({
      trip: {
        id: generateId(),
        name: DEMO_TRIP_NAME,
        destination: DEMO_DESTINATION,
        status: 'active',
        startedAt: Date.now(),
        endedAt: null,
        durationMinutes: 0,
      },
      status: 'active',
    });

    try {
      await useLocationStore.getState().startTracking();
    } catch {
      // Tracking permission denied — continue without live location.
    }
  },

  async endTrip() {
    const { trip, status } = get();
    if (status === 'idle' || !trip) {
      return;
    }

    if (!DEMO_MODE) {
      const token = useAuthStore.getState().token;
      if (token) {
        try {
          await apiClient.post('/trip/end');
        } catch (error) {
          console.warn(getApiErrorMessage(error, 'Unable to sync trip end with server.'));
        }
      }
    }

    const now = Date.now();
    const durationMinutes = Math.round((now - (trip.startedAt || now)) / 60000);

    set({
      trip: {
        ...trip,
        status: 'idle',
        endedAt: now,
        durationMinutes,
      },
      status: 'idle',
    });

    useLocationStore.getState().stopTracking();
  },

  pauseTrip() {
    const { trip } = get();
    if (!trip || trip.status !== 'active') {
      return;
    }

    set({
      trip: { ...trip, status: 'paused' },
      status: 'paused',
    });

    useLocationStore.getState().stopTracking();
  },

  resumeTrip() {
    const { trip } = get();
    if (!trip || trip.status !== 'paused') {
      return;
    }

    set({
      trip: { ...trip, status: 'active' },
      status: 'active',
    });

    useLocationStore.getState().startTracking().catch(() => {
      // Permission denied — continue without live location.
    });
  },
}));
