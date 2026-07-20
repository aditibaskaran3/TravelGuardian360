/**
 * SOS domain types.
 */
import type { Coordinates } from '../tracking/types';

export type SosStatus = 'idle' | 'sending' | 'sent' | 'error';

/** A recorded emergency activation. */
export type SosEvent = {
  id: string;
  timestamp: number;
  /** Best-known location at trigger time (null if unavailable). */
  coordinates: Coordinates | null;
  /** Who the alert was addressed to (emergency contact name). */
  contactName: string;
};
