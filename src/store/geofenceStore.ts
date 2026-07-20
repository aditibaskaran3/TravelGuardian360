/**
 * Geo-fence store — holds zones, live proximity, current breaches, and the
 * most recent alert. `evaluate()` is called with each new location sample.
 */
import { create } from './createStore';
import { geofenceService } from '../features/geofencing/services/geofenceService';
import { ALERTING_TYPES, evaluateZones } from '../features/geofencing/logic/evaluateZones';
import type { Coordinates } from '../features/tracking/types';
import type { GeoAlert, GeoZone, ZoneProximity } from '../features/geofencing/types';

type GeofenceState = {
  zones: GeoZone[];
  loaded: boolean;
  /** Live proximity to every zone, nearest first. */
  proximity: ZoneProximity[];
  /** IDs of zones the user is currently inside. */
  insideZoneIds: string[];
  /** Latest un-dismissed alert (restricted/hazardous entry). */
  activeAlert: GeoAlert | null;

  loadZones: () => Promise<void>;
  evaluate: (position: Coordinates) => void;
  dismissAlert: () => void;
  reset: () => void;
};

export const useGeofenceStore = create<GeofenceState>((set, get) => ({
  zones: [],
  loaded: false,
  proximity: [],
  insideZoneIds: [],
  activeAlert: null,

  async loadZones() {
    const zones = await geofenceService.fetchZones();
    set({ zones, loaded: true });
  },

  evaluate(position) {
    const { zones, insideZoneIds } = get();
    if (zones.length === 0) {
      return;
    }

    const proximity = evaluateZones(position, zones);
    const nowInside = proximity.filter((p) => p.isInside).map((p) => p.zone.id);

    // Fire an alert only on ENTERING an alerting zone (not while staying in it).
    const newlyEntered = proximity.find(
      (p) =>
        p.isInside &&
        !insideZoneIds.includes(p.zone.id) &&
        ALERTING_TYPES.includes(p.zone.type),
    );

    set({
      proximity,
      insideZoneIds: nowInside,
      activeAlert: newlyEntered
        ? { zone: newlyEntered.zone, enteredAt: Date.now() }
        : get().activeAlert,
    });
  },

  dismissAlert() {
    set({ activeAlert: null });
  },

  reset() {
    set({ proximity: [], insideZoneIds: [], activeAlert: null });
  },
}));
