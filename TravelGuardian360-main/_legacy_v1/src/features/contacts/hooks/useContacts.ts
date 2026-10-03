/**
 * Hook exposing the contacts list + actions, loading on mount.
 */
import { useEffect } from 'react';
import { useContactsStore } from '../../../store/contactsStore';

export function useContacts() {
  const contacts = useContactsStore((s) => s.contacts);
  const loaded = useContactsStore((s) => s.loaded);
  const load = useContactsStore((s) => s.load);
  const addContact = useContactsStore((s) => s.addContact);
  const updateContact = useContactsStore((s) => s.updateContact);
  const removeContact = useContactsStore((s) => s.removeContact);
  const setPrimary = useContactsStore((s) => s.setPrimary);

  useEffect(() => {
    if (!loaded) {
      void load();
    }
  }, [loaded, load]);

  return { contacts, loaded, addContact, updateContact, removeContact, setPrimary };
}
