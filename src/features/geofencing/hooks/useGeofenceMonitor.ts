/**
 * Background geo-fence monitor. Mounted once for authenticated users (in
 * AppNavigator). It:
 *   - loads zones on start,
 *   - evaluates each new location sample against the zones,
 *   - pops a native alert when the user enters a restricted/hazardous zone.
 *
 * Kept separate from the screen so alerts fire regardless of which screen is
 * open.
 */
import { useEffect } from 'react';
import { Alert } from 'react-native';

import { useLocationStore } from '../../../store/locationStore';
import { useGeofenceStore } from '../../../store/geofenceStore';

export function useGeofenceMonitor() {
  const activeAlert = useGeofenceStore((s) => s.activeAlert);
  const dismissAlert = useGeofenceStore((s) => s.dismissAlert);

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

  // Surface entry alerts to the user, then clear.
  useEffect(() => {
    if (!activeAlert) {
      return;
    }
    const label = activeAlert.zone.type === 'restricted' ? 'Restricted area' : 'Hazard warning';
    Alert.alert(
      `⚠️ ${label}`,
      `You have entered "${activeAlert.zone.name}".\n\n${activeAlert.zone.description}`,
      [{ text: 'Understood', onPress: dismissAlert }],
      { cancelable: false },
    );
  }, [activeAlert, dismissAlert]);
}
