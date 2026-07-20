/**
 * Emergency SOS screen.
 *
 * Big one-tap SOS (with a confirm step to avoid accidental triggers) that
 * shares live location with the emergency contact via SMS, plus quick call and
 * share actions and a history of past activations.
 */
import React from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import Button from '../../../components/ui/Button';
import { useSos } from '../hooks/useSos';
import { useAuthStore } from '../../../store/authStore';
import { EMERGENCY_NUMBER } from '../../../config/env';

export default function SosScreen() {
  const user = useAuthStore((s) => s.user);
  const {
    isSending,
    history,
    error,
    triggerSos,
    callEmergencyContact,
    callEmergencyServices,
    shareCurrentLocation,
  } = useSos();

  const confirmAndTrigger = () => {
    Alert.alert(
      'Send emergency SOS?',
      `This will prepare an SOS message with your live location for ${
        user?.emergencyContact.name ?? 'your emergency contact'
      }.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send SOS', style: 'destructive', onPress: () => triggerSos() },
      ],
    );
  };

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerClassName="p-4 gap-4">
      {/* Big SOS button */}
      <View className="items-center py-4">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send emergency SOS"
          disabled={isSending}
          onPress={confirmAndTrigger}
          className={`h-48 w-48 items-center justify-center rounded-full bg-red-600 active:bg-red-700 ${
            isSending ? 'opacity-60' : ''
          }`}
        >
          <Text className="text-4xl font-extrabold text-white">SOS</Text>
          <Text className="mt-1 text-sm text-red-100">
            {isSending ? 'Preparing…' : 'Tap to alert'}
          </Text>
        </Pressable>
      </View>

      {error ? (
        <View className="rounded-xl bg-red-100 px-4 py-3">
          <Text className="text-sm text-red-700">{error}</Text>
        </View>
      ) : null}

      {/* Quick actions */}
      <View className="gap-3 rounded-2xl bg-white p-5">
        <Text className="text-base font-bold text-slate-900">Quick actions</Text>
        <Button
          label={`Call ${user?.emergencyContact.name ?? 'contact'}`}
          variant="secondary"
          onPress={callEmergencyContact}
        />
        <Button
          label={`Call emergency services (${EMERGENCY_NUMBER})`}
          variant="secondary"
          onPress={callEmergencyServices}
        />
        <Button label="Share my live location" variant="ghost" onPress={shareCurrentLocation} />
      </View>

      {/* History */}
      {history.length > 0 ? (
        <View className="rounded-2xl bg-white p-5">
          <Text className="mb-2 text-base font-bold text-slate-900">Recent SOS activations</Text>
          {history.slice(0, 10).map((e) => (
            <View key={e.id} className="border-b border-slate-100 py-2">
              <Text className="font-medium text-slate-800">
                {new Date(e.timestamp).toLocaleString()}
              </Text>
              <Text className="text-sm text-slate-500">
                To {e.contactName} ·{' '}
                {e.coordinates
                  ? `${e.coordinates.latitude.toFixed(4)}, ${e.coordinates.longitude.toFixed(4)}`
                  : 'location unavailable'}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}
