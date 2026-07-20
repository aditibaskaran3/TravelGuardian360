/**
 * SOS store — orchestrates an emergency activation:
 *   1) resolve the best-known location (live sample, else one-shot fix),
 *   2) build the emergency message,
 *   3) log the event (mock/real reporter),
 *   4) open the SMS composer to the emergency contact.
 *
 * Pulls the user + emergency contact from the auth store and location from the
 * location store, so the SOS screen stays thin.
 */
import { create } from './createStore';
import { useAuthStore } from './authStore';
import { useLocationStore } from './locationStore';
import { locationService } from '../features/tracking/services/locationService';
import { sosReportService } from '../features/sos/services/sosReportService';
import {
  buildSosMessage,
  callNumber,
  openSmsComposer,
  shareLocation,
} from '../features/sos/services/emergencyActions';
import { EMERGENCY_NUMBER } from '../config/env';
import type { Coordinates } from '../features/tracking/types';
import type { SosEvent, SosStatus } from '../features/sos/types';

type SosState = {
  status: SosStatus;
  lastEvent: SosEvent | null;
  history: SosEvent[];
  error: string | null;

  triggerSos: () => Promise<void>;
  callEmergencyContact: () => Promise<void>;
  callEmergencyServices: () => Promise<void>;
  shareCurrentLocation: () => Promise<void>;
  loadHistory: () => Promise<void>;
};

const randomId = (): string =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

/** Uses the live sample if present, otherwise attempts a one-shot fix. */
async function resolveLocation(): Promise<Coordinates | null> {
  const current = useLocationStore.getState().current;
  if (current) {
    return { latitude: current.latitude, longitude: current.longitude };
  }
  try {
    const granted = await locationService.requestPermission();
    if (!granted) {
      return null;
    }
    const sample = await locationService.getCurrentPosition();
    return { latitude: sample.latitude, longitude: sample.longitude };
  } catch {
    return null;
  }
}

export const useSosStore = create<SosState>((set, get) => ({
  status: 'idle',
  lastEvent: null,
  history: [],
  error: null,

  async triggerSos() {
    const user = useAuthStore.getState().user;
    if (!user) {
      set({ status: 'error', error: 'You must be signed in to send an SOS.' });
      return;
    }

    set({ status: 'sending', error: null });
    try {
      const coordinates = await resolveLocation();
      const event: SosEvent = {
        id: randomId(),
        timestamp: Date.now(),
        coordinates,
        contactName: user.emergencyContact.name,
      };

      // Log first so the record exists even if the user cancels the SMS.
      await sosReportService.report(event);

      const message = buildSosMessage(user.fullName, user.touristId, coordinates);
      await openSmsComposer(user.emergencyContact.phone, message);

      set((s) => ({
        status: 'sent',
        lastEvent: event,
        history: [event, ...s.history].slice(0, 50),
      }));
    } catch (error) {
      set({ status: 'error', error: (error as Error).message || 'Failed to trigger SOS.' });
    }
  },

  async callEmergencyContact() {
    const user = useAuthStore.getState().user;
    if (user?.emergencyContact.phone) {
      await callNumber(user.emergencyContact.phone);
    }
  },

  async callEmergencyServices() {
    await callNumber(EMERGENCY_NUMBER);
  },

  async shareCurrentLocation() {
    const user = useAuthStore.getState().user;
    if (!user) {
      return;
    }
    const coordinates = await resolveLocation();
    const message = buildSosMessage(user.fullName, user.touristId, coordinates);
    await shareLocation(message);
  },

  async loadHistory() {
    const history = await sosReportService.history();
    set({ history });
  },
}));
