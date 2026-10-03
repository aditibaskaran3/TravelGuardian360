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
import { useTranslation } from '../../../i18n/useTranslation';
import { contactInitialValues, contactSchema } from '../schemas/contactSchema';
import type { AppStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'ContactForm'>;

export default function ContactFormScreen({ route, navigation }: Props) {
  const editingId = route.params?.id;
  const { t } = useTranslation();
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
      Alert.alert(t('contacts.couldNotSave'), (error as Error).message);
    }
  });

  return (
    <ScreenContainer>
      <TextField label={t('contacts.nameLabel')} placeholder={t('contacts.namePlaceholder')} autoCapitalize="words" {...form.field('name')} />
      <TextField
        label={t('contacts.phoneLabel')}
        placeholder={t('contacts.phonePlaceholder')}
        keyboardType="phone-pad"
        {...form.field('phone')}
      />
      <TextField
        label={t('contacts.relationshipLabel')}
        placeholder={t('contacts.relationshipPlaceholder')}
        autoCapitalize="words"
        {...form.field('relationship')}
      />
      <Button
        label={editingId ? t('contacts.saveChanges') : t('contacts.addContact')}
        loading={form.isSubmitting}
        onPress={onSubmit}
      />
    </ScreenContainer>
  );
}
