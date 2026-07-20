/**
 * Derives the live Safety Score from the auth, location, geofence and SOS
 * stores. Recomputes automatically whenever any input changes.
 */
import { useMemo } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { useLocationStore } from '../../../store/locationStore';
import { useGeofenceStore } from '../../../store/geofenceStore';
import { useSosStore } from '../../../store/sosStore';
import { useContactsStore } from '../../../store/contactsStore';
import { ALERTING_TYPES } from '../../geofencing/logic/evaluateZones';
import { computeSafetyScore } from '../logic/computeSafetyScore';
import type { SafetyScore } from '../types';

const DAY_MS = 24 * 60 * 60 * 1000;

export function useSafetyScore(): SafetyScore {
  const user = useAuthStore((s) => s.user);
  const trackingStatus = useLocationStore((s) => s.status);
  const proximity = useGeofenceStore((s) => s.proximity);
  const insideZoneIds = useGeofenceStore((s) => s.insideZoneIds);
  const history = useSosStore((s) => s.history);
  const contactCount = useContactsStore((s) => s.contacts.length);

  return useMemo(() => {
    const alerting = proximity.filter((p) => ALERTING_TYPES.includes(p.zone.type));
    const insideAlertingZone = alerting.some(
      (p) => p.isInside && insideZoneIds.includes(p.zone.id),
    );
    const nearestAlertingDistanceM = alerting.length
      ? Math.min(...alerting.map((p) => p.distanceToEdgeMeters))
      : null;

    const now = Date.now();
    const recentSosCount = history.filter((e) => now - e.timestamp < DAY_MS).length;

    const profileComplete =
      contactCount > 0 || !!(user?.emergencyContact.name && user?.emergencyContact.phone);

    return computeSafetyScore({
      isTracking: trackingStatus === 'tracking',
      insideAlertingZone,
      nearestAlertingDistanceM,
      profileComplete,
      recentSosCount,
    });
  }, [user, trackingStatus, proximity, insideZoneIds, history, contactCount]);
}
