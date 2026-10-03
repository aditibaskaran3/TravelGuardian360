/**
 * useNotificationBridge — turns raw store transitions into live notifications.
 *
 * Mounted once for the authenticated session (in AppNavigator, alongside the
 * geo-fence + behaviour monitors). It subscribes to the tracking, geo-fence,
 * SOS and safety stores and pushes a notification whenever something the
 * traveller should know about *changes* (edge-triggered, never on every tick).
 *
 * This is the seam where a real backend/WebSocket or FCM push would plug in:
 * remote events would call `notify(...)` exactly like these local producers.
 */
import { useEffect, useRef } from 'react';

import { useLocationStore } from '../../../store/locationStore';
import { useGeofenceStore } from '../../../store/geofenceStore';
import { useSosStore } from '../../../store/sosStore';
import { notify } from '../../../store/notificationsStore';
import { useSafetyScore } from '../../safety/hooks/useSafetyScore';

export function useNotificationBridge() {
  // --- Tracking: start / stop / error ------------------------------------
  useEffect(() => {
    let prev = useLocationStore.getState().status;
    return useLocationStore.subscribe(() => {
      const next = useLocationStore.getState().status;
      if (next === prev) {
        return;
      }
      if (next === 'tracking' && prev !== 'tracking') {
        notify({
          source: 'tracking',
          severity: 'success',
          title: 'Live tracking on',
          body: 'Your location is now being monitored in real time.',
        });
      } else if (next === 'idle' && prev === 'tracking') {
        notify({
          source: 'tracking',
          severity: 'info',
          title: 'Tracking stopped',
          body: 'Live location monitoring has been turned off.',
        });
      } else if (next === 'error') {
        const err = useLocationStore.getState().error;
        notify({
          source: 'tracking',
          severity: 'warning',
          title: 'Tracking problem',
          body: err?.message ?? 'Unable to read your location.',
        });
      }
      prev = next;
    });
  }, []);

  // --- Geo-fence: entering a restricted / hazardous zone ------------------
  useEffect(() => {
    let prevAlertAt = useGeofenceStore.getState().activeAlert?.enteredAt ?? 0;
    return useGeofenceStore.subscribe(() => {
      const alert = useGeofenceStore.getState().activeAlert;
      if (!alert || alert.enteredAt === prevAlertAt) {
        return;
      }
      prevAlertAt = alert.enteredAt;
      const restricted = alert.zone.type === 'restricted';
      notify({
        source: 'geofence',
        severity: restricted ? 'critical' : 'warning',
        title: restricted ? 'Restricted area entered' : 'Hazard zone warning',
        body: `You have entered "${alert.zone.name}". ${alert.zone.description}`,
      });
    });
  }, []);

  // --- SOS: sending / sent / failed ---------------------------------------
  useEffect(() => {
    let prev = useSosStore.getState().status;
    return useSosStore.subscribe(() => {
      const next = useSosStore.getState().status;
      if (next === prev) {
        return;
      }
      if (next === 'sent') {
        const contact = useSosStore.getState().lastEvent?.contactName;
        notify({
          source: 'sos',
          severity: 'critical',
          title: 'SOS alert sent',
          body: contact
            ? `Your emergency alert was sent to ${contact}.`
            : 'Your emergency alert was sent.',
        });
      } else if (next === 'error') {
        notify({
          source: 'sos',
          severity: 'warning',
          title: 'SOS could not be sent',
          body: useSosStore.getState().error ?? 'Please try again.',
        });
      }
      prev = next;
    });
  }, []);

  // --- Safety score: band change (up = reassure, down = warn) -------------
  const score = useSafetyScore();
  const prevBand = useRef(score.band);
  useEffect(() => {
    if (score.band === prevBand.current) {
      return;
    }
    const order = { low: 0, moderate: 1, high: 2 } as const;
    const worsened = order[score.band] < order[prevBand.current];
    prevBand.current = score.band;
    notify({
      source: 'safety',
      severity: worsened ? 'warning' : 'success',
      title: worsened ? 'Safety score dropped' : 'Safety score improved',
      body: `Your safety score is now ${score.value} (${score.band}).`,
    });
  }, [score.band, score.value]);
}
