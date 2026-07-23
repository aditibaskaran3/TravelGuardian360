import React, { useEffect } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAuthStore } from '../../../store/authStore';
import { useMedicalStore } from '../../../store/medicalStore';
import { useTranslation } from '../../../i18n/useTranslation';
import type { AppStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<AppStackParamList>;

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between border-b border-slate-100 py-2.5">
      <Text className="text-slate-500">{label}</Text>
      <Text className="max-w-[60%] text-right font-medium text-slate-900">{value}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const medicalData = useMedicalStore((s) => s.data);
  const hydrate = useMedicalStore((s) => s.hydrate);
  const { t } = useTranslation();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  if (!user) {
    return null;
  }

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerClassName="p-4 gap-4">
      <View className="rounded-3xl bg-indigo-600 p-6">
        <View className="h-14 w-14 items-center justify-center rounded-full bg-white/20">
          <Text className="text-2xl">🧳</Text>
        </View>
        <Text className="mt-4 text-2xl font-semibold text-white">{user.fullName}</Text>
        <Text className="mt-1 text-indigo-100">{t('profile.subtitle')}</Text>
      </View>

      <View className="rounded-2xl bg-white p-5">
        <Text className="mb-2 text-base font-bold text-slate-900">{t('profile.title')}</Text>
        <InfoRow label={t('home.touristId')} value={user.touristId} />
        <InfoRow label={t('home.email')} value={user.email} />
        <InfoRow label={t('home.phone')} value={user.phone} />
        <InfoRow label={t('home.emergencyContact')} value={user.emergencyContact.name} />
        <InfoRow label={t('home.emergencyPhone')} value={user.emergencyContact.phone} />
        <InfoRow label="Nationality" value={user.nationality} />
      </View>

      {/* Medical ID Card */}
      <Pressable
        accessibilityRole="button"
        onPress={() => navigation.navigate('MedicalID')}
        className={`rounded-2xl border-2 p-4 active:opacity-80 ${
          medicalData.bloodGroup || medicalData.allergies.length > 0 || medicalData.medications.length > 0
            ? 'border-red-200 bg-red-50'
            : 'border-slate-100 bg-white'
        }`}
      >
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <Text className="text-base font-semibold text-slate-900">🩺 Medical ID</Text>
            <Text className="mt-1 text-xs text-slate-500">
              {medicalData.bloodGroup || medicalData.allergies.length > 0 || medicalData.medications.length > 0
                ? 'Information saved'
                : 'Add emergency health info'}
            </Text>
            {medicalData.bloodGroup && (
              <Text className="mt-2 text-sm font-bold text-red-600">🩸 {medicalData.bloodGroup}</Text>
            )}
          </View>
          <Text className="text-lg text-slate-300">›</Text>
        </View>
      </Pressable>
    </ScrollView>
  );
}
