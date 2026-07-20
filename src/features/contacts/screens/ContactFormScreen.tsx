/**
 * Add / edit an emergency contact. Reuses the shared useForm + TextField.
 */
import React from 'react';
import { Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import ScreenContainer from '../../../components/ui/ScreenContainer';
import TextField from '../../../components/ui/TextField';
import Button from '../../../components/ui/Button';
import { useForm } from '../../../hooks/useForm';
import { useContactsStore } from '../../../store/contactsStore';
import { contactInitialValues, contactSchema } from '../schemas/contactSchema';
import type { AppStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'ContactForm'>;

export default function ContactFormScreen({ route, navigation }: Props) {
  const editingId = route.params?.id;
  const existing = useContactsStore((s) =>
    editingId ? s.contacts.find((c) => c.id === editingId) : undefined,
  );
  const addContact = useContactsStore((s) => s.addContact);
  const updateContact = useContactsStore((s) => s.updateContact);

  const form = useForm(
    existing
      ? { name: existing.name, phone: existing.phone, relationship: existing.relationship }
      : contactInitialValues,
    contactSchema,
  );

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (editingId) {
        await updateContact(editingId, values);
      } else {
        await addContact(values);
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('Could not save', (error as Error).message);
    }
  });

  return (
    <ScreenContainer>
      <TextField label="Name" placeholder="Full name" autoCapitalize="words" {...form.field('name')} />
      <TextField
        label="Phone"
        placeholder="+1 555 123 4567"
        keyboardType="phone-pad"
        {...form.field('phone')}
      />
      <TextField
        label="Relationship"
        placeholder="e.g. Parent, Friend, Guide"
        autoCapitalize="words"
        {...form.field('relationship')}
      />
      <Button
        label={editingId ? 'Save changes' : 'Add contact'}
        loading={form.isSubmitting}
        onPress={onSubmit}
      />
    </ScreenContainer>
  );
}
