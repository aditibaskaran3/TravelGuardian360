/**
 * Trip store — manages trip state: start/stop, duration, and status.
 * Automatically starts location tracking when a trip begins.
 */
import { create } from './createStore';
import { useLocationStore } from './locationStore';
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

    set({
      trip: {
        id: generateId(),
        status: 'active',
        startedAt: Date.now(),
        endedAt: null,
        durationMinutes: 0,
      },
      status: 'active',
    });

    // Auto-start location tracking when trip begins.
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

    // Auto-stop location tracking when trip ends.
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
