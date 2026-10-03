/**
 * SOS reporting abstraction — records/retrieves emergency activations.
 * Mock persists locally; real posts to the backend (for the police/tourism
 * dashboard). Screens/store depend only on this interface.
 */
import { USE_MOCK_SOS } from '../../../config/env';
import type { SosEvent } from '../types';
import { mockSosReportService } from './mockSosReportService';
import { realSosReportService } from './realSosReportService';

export type SosReportService = {
  report(event: SosEvent): Promise<void>;
  history(): Promise<SosEvent[]>;
};

export const sosReportService: SosReportService = USE_MOCK_SOS
  ? mockSosReportService
  : realSosReportService;
