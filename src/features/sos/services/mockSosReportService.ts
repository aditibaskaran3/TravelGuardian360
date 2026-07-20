/**
 * Mock SOS reporter — persists events in AsyncStorage so history survives
 * restarts. Stands in for the backend /sos endpoint until it exists.
 */
import { storage, StorageKeys } from '../../../services/storage';
import type { SosEvent } from '../types';
import type { SosReportService } from './sosReportService';

const MAX_HISTORY = 50;

export const mockSosReportService: SosReportService = {
  async report(event: SosEvent): Promise<void> {
    const existing = (await storage.getItem<SosEvent[]>(StorageKeys.sosHistory)) ?? [];
    const next = [event, ...existing].slice(0, MAX_HISTORY);
    await storage.setItem(StorageKeys.sosHistory, next);
  },

  async history(): Promise<SosEvent[]> {
    return (await storage.getItem<SosEvent[]>(StorageKeys.sosHistory)) ?? [];
  },
};
