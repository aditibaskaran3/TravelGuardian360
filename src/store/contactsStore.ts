/**
 * Emergency contacts store.
 *
 * Owns the CRUD business rules: ensures exactly one primary, persists every
 * change, and seeds the first contact from the user's Digital Tourist ID
 * emergency contact so the list is never empty for a new account.
 */
import { create } from './createStore';
import { contactsService } from '../features/contacts/services/contactsService';
import { useAuthStore } from './authStore';
import type { EmergencyContactRecord } from '../features/contacts/types';

type ContactInput = Omit<EmergencyContactRecord, 'id' | 'isPrimary'>;

type ContactsState = {
  contacts: EmergencyContactRecord[];
  loaded: boolean;

  load: () => Promise<void>;
  addContact: (input: ContactInput) => Promise<void>;
  updateContact: (id: string, input: ContactInput) => Promise<void>;
  removeContact: (id: string) => Promise<void>;
  setPrimary: (id: string) => Promise<void>;
  getPrimary: () => EmergencyContactRecord | null;
};

const randomId = (): string =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

/** Guarantees exactly one primary (defaults to the first contact). */
const normalizePrimary = (contacts: EmergencyContactRecord[]): EmergencyContactRecord[] => {
  if (contacts.length === 0) {
    return contacts;
  }
  if (contacts.some((c) => c.isPrimary)) {
    let seen = false;
    return contacts.map((c) => {
      if (c.isPrimary && !seen) {
        seen = true;
        return c;
      }
      return { ...c, isPrimary: false };
    });
  }
  return contacts.map((c, i) => ({ ...c, isPrimary: i === 0 }));
};

export const useContactsStore = create<ContactsState>((set, get) => {
  const persist = async (contacts: EmergencyContactRecord[]) => {
    const normalized = normalizePrimary(contacts);
    set({ contacts: normalized });
    await contactsService.save(normalized);
  };

  return {
    contacts: [],
    loaded: false,

    async load() {
      let contacts = await contactsService.list();

      // Seed from the Digital Tourist ID emergency contact on first run.
      if (contacts.length === 0) {
        const user = useAuthStore.getState().user;
        if (user?.emergencyContact.name && user.emergencyContact.phone) {
          contacts = [
            {
              id: randomId(),
              name: user.emergencyContact.name,
              phone: user.emergencyContact.phone,
              relationship: 'Primary contact',
              isPrimary: true,
            },
          ];
          await contactsService.save(contacts);
        }
      }

      set({ contacts: normalizePrimary(contacts), loaded: true });
    },

    async addContact(input) {
      const contacts = get().contacts;
      const record: EmergencyContactRecord = {
        id: randomId(),
        ...input,
        isPrimary: contacts.length === 0,
      };
      await persist([...contacts, record]);
    },

    async updateContact(id, input) {
      await persist(get().contacts.map((c) => (c.id === id ? { ...c, ...input } : c)));
    },

    async removeContact(id) {
      await persist(get().contacts.filter((c) => c.id !== id));
    },

    async setPrimary(id) {
      await persist(get().contacts.map((c) => ({ ...c, isPrimary: c.id === id })));
    },

    getPrimary() {
      const contacts = get().contacts;
      return contacts.find((c) => c.isPrimary) ?? contacts[0] ?? null;
    },
  };
});
