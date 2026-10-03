/**
 * Emergency contacts persistence abstraction. Mock stores locally; real syncs
 * with the backend. The store holds the business rules (primary, validation).
 */
import { USE_MOCK_API } from '../../../config/env';
import type { EmergencyContactRecord } from '../types';
import { mockContactsService } from './mockContactsService';
import { realContactsService } from './realContactsService';

export type ContactsService = {
  list(): Promise<EmergencyContactRecord[]>;
  save(contacts: EmergencyContactRecord[]): Promise<void>;
};

export const contactsService: ContactsService = USE_MOCK_API
  ? mockContactsService
  : realContactsService;
