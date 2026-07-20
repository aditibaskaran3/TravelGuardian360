/**
 * Real contacts service — syncs the emergency contacts with the backend.
 * Ready to activate when USE_MOCK_API is false.
 */
import { apiClient } from '../../../api/client';
import type { EmergencyContactRecord } from '../types';
import type { ContactsService } from './contactsService';

export const realContactsService: ContactsService = {
  async list(): Promise<EmergencyContactRecord[]> {
    const { data } = await apiClient.get<EmergencyContactRecord[]>('/contacts');
    return data;
  },

  async save(contacts: EmergencyContactRecord[]): Promise<void> {
    await apiClient.put('/contacts', contacts);
  },
};
