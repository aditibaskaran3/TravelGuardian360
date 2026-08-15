/**
 * Derives the live Safety Score from the auth, location, geofence and SOS
 * stores. Recomputes automatically whenever any input changes.
 */
import { useEffect, useMemo, useState } from 'react';
import { apiClient } from '../../../api/client';
import { useAuthStore } from '../../../store/authStore';
import { useLocationStore } from '../../../store/locationStore';
import { useGeofenceStore } from '../../../store/geofenceStore';
import { useSosStore } from '../../../store/sosStore';
import { useContactsStore } from '../../../store/contactsStore';
import { ALERTING_TYPES } from '../../geofencing/logic/evaluateZones';
import { computeSafetyScore } from '../logic/computeSafetyScore';
import type { SafetyBand, SafetyScore } from '../types';

const bandFor = (value: number): SafetyBand => {
  if (value >= 80) {
    return 'high';
  }
  if (value >= 50) {
    return 'moderate';
  }
  return 'low';
};

type LiveSafetyRisk = {
  status: 'NO_KNOWN_HAZARD' | 'CAUTION' | 'DANGER';
  score: number;
  reason: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function useSafetyScore(): SafetyScore {
  const user = useAuthStore((s) => s.user);
  const trackingStatus = useLocationStore((s) => s.status);
  const currentLocation = useLocationStore((s) => s.current);
  const proximity = useGeofenceStore((s) => s.proximity);
  const insideZoneIds = useGeofenceStore((s) => s.insideZoneIds);
  const history = useSosStore((s) => s.history);
  const contactCount = useContactsStore((s) => s.contacts.length);
  const [liveRisk, setLiveRisk] = useState<LiveSafetyRisk | null>(null);

  useEffect(() => {
    if (!user || !currentLocation) {
      setLiveRisk(null);
      return;
    }

    let active = true;

    apiClient
      .get<LiveSafetyRisk>('/safety/check', {
        params: {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        },
      })
      .then(({ data }) => {
        if (active) {
          setLiveRisk(data);
        }
      })
      .catch(() => {
        if (active) {
          setLiveRisk(null);
        }
      });

    return () => {
      active = false;
    };
  }, [user, currentLocation?.latitude, currentLocation?.longitude]);

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

    const baseScore = computeSafetyScore({
      isTracking: trackingStatus === 'tracking',
      insideAlertingZone,
      nearestAlertingDistanceM,
      profileComplete,
      recentSosCount,
    });

    if (!liveRisk || liveRisk.status === 'NO_KNOWN_HAZARD') {
      return baseScore;
    }

    const value = Math.min(baseScore.value, liveRisk.score);
    const factors = [
      ...baseScore.factors,
      {
        key: 'live-hazard',
        label: liveRisk.status === 'DANGER' ? 'Live hazard alert' : 'Current travel caution',
        impact: Math.min(0, value - baseScore.value),
        detail: liveRisk.reason,
      },
    ];

    return {
      value,
      band: bandFor(value),
      factors,
    };
  }, [user, trackingStatus, proximity, insideZoneIds, history, contactCount, liveRisk]);
}
