/**
 * Travel itinerary screen — plan and share your trips.
 *
 * Users can create itineraries with destination, dates, and emergency contacts,
 * then share them with their network or emergency contacts.
 */
import React, { useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useItinerary } from '../hooks/useItinerary';
import { useContactsStore } from '../../../store/contactsStore';
import { buildItineraryShare } from '../services/itineraryService';
import Button from '../../../components/ui/Button';
import { useTranslation } from '../../../i18n/useTranslation';
import type { EmergencyContactRecord } from '../../contacts/types';

export default function ItineraryScreen() {
  const { t } = useTranslation();
  const { itineraries, addItinerary } = useItinerary();
  const contacts = useContactsStore((s) => s.contacts);

  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);

  const toggleContact = (id: string) => {
    setSelectedContacts((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const handleAdd = async () => {
    if (!destination.trim() || !startDate || !endDate) {
      Alert.alert('Missing details', 'Please enter destination and both dates.');
      return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
      Alert.alert('Invalid dates', 'End date must be after start date.');
      return;
    }

    setAdding(true);
    await addItinerary({
      destination,
      startDate,
      endDate,
      notes,
      emergencyContactIds: selectedContacts,
    });
    setAdding(false);

    setDestination('');
    setStartDate('');
    setEndDate('');
    setNotes('');
    setSelectedContacts([]);

    Alert.alert('Itinerary saved', 'Your trip has been recorded.');
  };

  const handleShare = (text: string) => {
    Linking.openURL(`mailto:?subject=My Travel Itinerary&body=${encodeURIComponent(text)}`).catch(
      () => {
        Alert.alert('Unable to share', 'Please share manually.');
      },
    );
  };

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerClassName="p-4 gap-4">
      <View className="rounded-3xl bg-purple-600 p-5">
        <Text className="text-sm font-semibold uppercase tracking-widest text-purple-100">
          {t('itinerary.title')}
        </Text>
        <Text className="mt-1 text-xl font-semibold text-white">
          {t('itinerary.subtitle')}
        </Text>
        <Text className="mt-2 text-sm text-purple-100">{t('itinerary.description')}</Text>
      </View>

      {/* Add itinerary form */}
      <View className="rounded-2xl bg-white p-4">
        <Text className="text-base font-semibold text-slate-900">{t('itinerary.addNew')}</Text>

        <Text className="mt-3 text-xs font-semibold text-slate-600">Destination city or region</Text>
        <TextInput
          value={destination}
          onChangeText={setDestination}
          placeholder="E.g. Tokyo, Paris, Bali"
          placeholderTextColor="#a0aec0"
          className="mt-1 rounded-xl border border-slate-200 px-3 py-3 text-sm text-slate-900"
        />

        <Text className="mt-3 text-xs font-semibold text-slate-600">Travel dates</Text>
        <View className="mt-1 flex-row gap-2">
          <Pressable
            onPress={() => {
              Alert.prompt(
                '📅 Start date',
                'Enter start date (YYYY-MM-DD)\nExample: 2024-07-15',
                [
                  { text: 'Cancel', onPress: () => {}, style: 'cancel' },
                  {
                    text: 'OK',
                    onPress: (value: string | undefined) => {
                      if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
                        setStartDate(value);
                      } else {
                        Alert.alert('Invalid date', 'Please use YYYY-MM-DD format');
                      }
                    },
                  },
                ],
                'plain-text',
                startDate,
              );
            }}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-3 active:opacity-70"
          >
            <Text className="text-xs text-slate-500">Start date</Text>
            <Text className="mt-1 text-sm font-semibold text-slate-900">
              {startDate ? `📅 ${startDate}` : '📅 Tap to select'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              Alert.prompt(
                '📅 End date',
                'Enter end date (YYYY-MM-DD)\nExample: 2024-07-20',
                [
                  { text: 'Cancel', onPress: () => {}, style: 'cancel' },
                  {
                    text: 'OK',
                    onPress: (value: string | undefined) => {
                      if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
                        setEndDate(value);
                      } else {
                        Alert.alert('Invalid date', 'Please use YYYY-MM-DD format');
                      }
                    },
                  },
                ],
                'plain-text',
                endDate,
              );
            }}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-3 active:opacity-70"
          >
            <Text className="text-xs text-slate-500">End date</Text>
            <Text className="mt-1 text-sm font-semibold text-slate-900">
              {endDate ? `📅 ${endDate}` : '📅 Tap to select'}
            </Text>
          </Pressable>
        </View>

        <Text className="mt-3 text-xs font-semibold text-slate-600">Additional notes (optional)</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="E.g. Stay at Grand Hotel, visiting temples on Day 3"
          placeholderTextColor="#a0aec0"
          className="mt-1 rounded-xl border border-slate-200 px-3 py-3 text-sm text-slate-900"
          multiline
          numberOfLines={3}
        />

        {contacts.length > 0 ? (
          <View className="mt-3">
            <Text className="mb-2 text-xs font-semibold text-slate-600">
              {t('itinerary.selectContacts')}
            </Text>
            <View className="flex-wrap flex-row gap-2">
              {contacts.map((contact: EmergencyContactRecord) => (
                <Pressable
                  key={contact.id}
                  onPress={() => toggleContact(contact.id)}
                  className={`rounded-full px-3 py-1 ${
                    selectedContacts.includes(contact.id)
                      ? 'bg-purple-600'
                      : 'border border-slate-200 bg-white'
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      selectedContacts.includes(contact.id)
                        ? 'text-white'
                        : 'text-slate-600'
                    }`}
                  >
                    {contact.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        <Button label={t('itinerary.save')} onPress={handleAdd} disabled={adding} />
      </View>

      {/* Itinerary list */}
      {itineraries.length === 0 ? (
        <Text className="px-2 text-center text-sm text-slate-400">
          {t('itinerary.noItems')}
        </Text>
      ) : (
        <View className="gap-3">
          {itineraries.map((item) => (
            <View key={item.id} className="rounded-2xl border border-slate-100 bg-white p-4">
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-2">
                  <Text className="text-base font-semibold text-slate-900">
                    {item.destination}
                  </Text>
                  <Text className="mt-1 text-sm text-slate-500">
                    {new Date(item.startDate).toLocaleDateString()} –{' '}
                    {new Date(item.endDate).toLocaleDateString()}
                  </Text>
                  {item.notes ? (
                    <Text className="mt-2 text-xs text-slate-400">{item.notes}</Text>
                  ) : null}
                </View>
              </View>

              <View className="mt-3 flex-row gap-2">
                <Pressable
                  onPress={() =>
                    handleShare(buildItineraryShare(item))
                  }
                  className="flex-1 rounded-xl bg-purple-100 px-2 py-2 active:opacity-70"
                >
                  <Text className="text-center text-xs font-semibold text-purple-600">
                    {t('itinerary.share')}
                  </Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
