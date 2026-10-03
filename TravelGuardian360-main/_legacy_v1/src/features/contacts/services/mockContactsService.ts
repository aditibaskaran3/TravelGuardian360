/**
 * Mock contacts service — persists the contact list in AsyncStorage.
 */
import { storage, StorageKeys } from '../../../services/storage';
import type { EmergencyContactRecord } from '../types';
import type { ContactsService } from './contactsService';

export const mockContactsService: ContactsService = {
  async list(): Promise<EmergencyContactRecord[]> {
    return (await storage.getItem<EmergencyContactRecord[]>(StorageKeys.emergencyContacts)) ?? [];
  },

  async save(contacts: EmergencyContactRecord[]): Promise<void> {
    await storage.setItem(StorageKeys.emergencyContacts, contacts);
  },
};
