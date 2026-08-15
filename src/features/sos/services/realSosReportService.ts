/**
 * Real SOS reporter — posts events to the backend so authorities' dashboard
 * receives them. Ready to activate: set USE_MOCK_SOS=false when /sos exists.
 */
import { apiClient } from '../../../api/client';
import type { SosEvent } from '../types';
import type { SosReportService } from './sosReportService';

export const realSosReportService: SosReportService = {
  async report(event: SosEvent): Promise<void> {
    await apiClient.post('/sos', {
      timestamp: event.timestamp,
      coordinates: event.coordinates,
      contactName: event.contactName,
    });
  },

  async history(): Promise<SosEvent[]> {
    const { data } = await apiClient.get<any[]>('/sos');
    return data.map((e) => ({
      id: e.id,
      timestamp: new Date(e.timestamp).getTime(),
      coordinates: e.latitude !== null && e.longitude !== null ? { latitude: e.latitude, longitude: e.longitude } : null,
      contactName: e.contactName,
    }));
  },
};
