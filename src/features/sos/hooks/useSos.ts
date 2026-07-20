/**
 * Hook surfacing SOS state + actions, and loading history on mount.
 */
import { useEffect } from 'react';
import { useSosStore } from '../../../store/sosStore';

export function useSos() {
  const status = useSosStore((s) => s.status);
  const lastEvent = useSosStore((s) => s.lastEvent);
  const history = useSosStore((s) => s.history);
  const error = useSosStore((s) => s.error);
  const triggerSos = useSosStore((s) => s.triggerSos);
  const callEmergencyContact = useSosStore((s) => s.callEmergencyContact);
  const callEmergencyServices = useSosStore((s) => s.callEmergencyServices);
  const shareCurrentLocation = useSosStore((s) => s.shareCurrentLocation);
  const loadHistory = useSosStore((s) => s.loadHistory);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  return {
    status,
    lastEvent,
    history,
    error,
    isSending: status === 'sending',
    triggerSos,
    callEmergencyContact,
    callEmergencyServices,
    shareCurrentLocation,
  };
}
