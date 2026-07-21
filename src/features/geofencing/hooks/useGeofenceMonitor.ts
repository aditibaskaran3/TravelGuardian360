/**
 * Background geo-fence monitor. Mounted once for authenticated users (in
 * AppNavigator). It:
 *   - loads zones on start,
 *   - evaluates each new location sample against the zones.
 *
 * Zone-entry alerts are surfaced by the notification bridge (as an in-app
 * banner + an entry in the notification centre) rather than a blocking modal,
 * so the traveller keeps full use of the app while staying informed.
 */
import { useEffect } from 'react';

import { useLocationStore } from '../../../store/locationStore';
import { useGeofenceStore } from '../../../store/geofenceStore';

export function useGeofenceMonitor() {
  // Load zones once and evaluate every new location sample.
  useEffect(() => {
    void useGeofenceStore.getState().loadZones();

    let lastTimestamp = 0;
    const unsubscribe = useLocationStore.subscribe(() => {
      const current = useLocationStore.getState().current;
      if (current && current.timestamp !== lastTimestamp) {
        lastTimestamp = current.timestamp;
        useGeofenceStore.getState().evaluate(current);
      }
    });
    return unsubscribe;
  }, []);
}
