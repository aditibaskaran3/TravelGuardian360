import React from 'react';
import { ScrollView, Text, View } from 'react-native';

import { useAuthStore } from '../../../store/authStore';
import { useTranslation } from '../../../i18n/useTranslation';

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between border-b border-slate-100 py-2.5">
      <Text className="text-slate-500">{label}</Text>
      <Text className="max-w-[60%] text-right font-medium text-slate-900">{value}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const { t } = useTranslation();

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
    </ScrollView>
  );
}
