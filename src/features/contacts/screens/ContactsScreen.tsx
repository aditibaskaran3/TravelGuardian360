/**
 * Emergency contacts list — view, set primary, edit, delete, and add.
 */
import React from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import Button from '../../../components/ui/Button';
import { useContacts } from '../hooks/useContacts';
import type { AppStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'Contacts'>;

export default function ContactsScreen({ navigation }: Props) {
  const { contacts, setPrimary, removeContact } = useContacts();

  const confirmDelete = (id: string, name: string) => {
    Alert.alert('Remove contact', `Remove ${name} from your emergency contacts?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeContact(id) },
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerClassName="p-4 gap-4">
      <Button label="+ Add contact" onPress={() => navigation.navigate('ContactForm', {})} />

      {contacts.length === 0 ? (
        <View className="rounded-2xl bg-white p-6">
          <Text className="text-center text-slate-500">
            No emergency contacts yet. Add one so we can alert them in an emergency.
          </Text>
        </View>
      ) : (
        contacts.map((c) => (
          <View key={c.id} className="rounded-2xl bg-white p-5">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-bold text-slate-900">{c.name}</Text>
              {c.isPrimary ? (
                <View className="rounded-full bg-indigo-100 px-3 py-1">
                  <Text className="text-xs font-semibold text-indigo-700">Primary</Text>
                </View>
              ) : null}
            </View>
            <Text className="mt-1 text-slate-600">{c.phone}</Text>
            <Text className="text-sm text-slate-400">{c.relationship}</Text>

            <View className="mt-4 flex-row gap-2">
              {!c.isPrimary ? (
                <View className="flex-1">
                  <Button label="Set primary" variant="secondary" onPress={() => setPrimary(c.id)} />
                </View>
              ) : null}
              <View className="flex-1">
                <Button
                  label="Edit"
                  variant="ghost"
                  onPress={() => navigation.navigate('ContactForm', { id: c.id })}
                />
              </View>
              <View className="flex-1">
                <Button
                  label="Delete"
                  variant="ghost"
                  onPress={() => confirmDelete(c.id, c.name)}
                />
              </View>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}
