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
import { useTranslation } from '../../../i18n/useTranslation';
import { EMERGENCY_NUMBER } from '../../../config/env';

export default function SosScreen() {
  const { t } = useTranslation();
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
      t('sos.confirmTitle'),
      t('sos.confirmMessage', {
        name: user?.emergencyContact.name ?? t('sos.defaultContactName'),
      }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('sos.send'), style: 'destructive', onPress: () => triggerSos() },
      ],
    );
  };

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerClassName="p-4 gap-4">
      {/* Big SOS button */}
      <View className="items-center py-4">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('sos.accessibilityLabel')}
          disabled={isSending}
          onPress={confirmAndTrigger}
          className={`h-48 w-48 items-center justify-center rounded-full bg-red-600 active:bg-red-700 ${
            isSending ? 'opacity-60' : ''
          }`}
        >
          <Text className="text-4xl font-extrabold text-white">SOS</Text>
          <Text className="mt-1 text-sm text-red-100">
            {isSending ? t('sos.preparing') : t('sos.tapToAlert')}
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
        <Text className="text-base font-bold text-slate-900">{t('sos.quickActions')}</Text>
        <Button
          label={t('sos.callContact', { name: user?.emergencyContact.name ?? t('sos.defaultContactName') })}
          variant="secondary"
          onPress={callEmergencyContact}
        />
        <Button
          label={t('sos.callEmergencyServices', { number: EMERGENCY_NUMBER })}
          variant="secondary"
          onPress={callEmergencyServices}
        />
        <Button label={t('sos.shareLocation')} variant="ghost" onPress={shareCurrentLocation} />
      </View>

      {/* History */}
      {history.length > 0 ? (
        <View className="rounded-2xl bg-white p-5">
          <Text className="mb-2 text-base font-bold text-slate-900">{t('sos.recentActivations')}</Text>
          {history.slice(0, 10).map((e) => (
            <View key={e.id} className="border-b border-slate-100 py-2">
              <Text className="font-medium text-slate-800">
                {new Date(e.timestamp).toLocaleString()}
              </Text>
              <Text className="text-sm text-slate-500">
                {t('sos.toContact', { name: e.contactName })} ·{' '}
                {e.coordinates
                  ? `${e.coordinates.latitude.toFixed(4)}, ${e.coordinates.longitude.toFixed(4)}`
                  : t('sos.locationUnavailable')}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}
