/**
 * Thin hook exposing tracking state + controls, and ensuring the watcher is
 * torn down when the consuming screen unmounts.
 */
import { useEffect } from 'react';
import { useLocationStore } from '../../../store/locationStore';

export function useLocationTracking() {
  const status = useLocationStore((s) => s.status);
  const current = useLocationStore((s) => s.current);
  const history = useLocationStore((s) => s.history);
  const distanceMeters = useLocationStore((s) => s.distanceMeters);
  const error = useLocationStore((s) => s.error);
  const startTracking = useLocationStore((s) => s.startTracking);
  const stopTracking = useLocationStore((s) => s.stopTracking);
  const reset = useLocationStore((s) => s.reset);

  // Stop the native/mock watcher if the screen goes away while tracking.
  useEffect(() => {
    return () => {
      if (useLocationStore.getState().status === 'tracking') {
        stopTracking();
      }
    };
  }, [stopTracking]);

  return {
    status,
    current,
    history,
    distanceMeters,
    error,
    isTracking: status === 'tracking',
    startTracking,
    stopTracking,
    reset,
  };
}
