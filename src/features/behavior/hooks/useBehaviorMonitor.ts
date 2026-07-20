/**
 * Global behaviour monitor. Mounted once (in AppNavigator) so it runs for the
 * whole authenticated session: re-analyzes whenever the location history grows
 * and raises a single alert per new high-severity anomaly.
 */
import { useEffect } from 'react';
import { Alert } from 'react-native';
import { useLocationStore } from '../../../store/locationStore';
import { useBehaviorStore } from '../../../store/behaviorStore';

export function useBehaviorMonitor(): void {
  const history = useLocationStore((s) => s.history);

  useEffect(() => {
    if (history.length < 3) {
      return;
    }
    const newHigh = useBehaviorStore.getState().analyze(history, Date.now());
    if (newHigh.length > 0) {
      Alert.alert('⚠️ Unusual activity detected', newHigh.map((s) => s.message).join('\n\n'));
    }
  }, [history]);
}
