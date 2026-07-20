/**
 * Home dashboard (the "Home" tab).
 *
 * A clean overview: greeting, Digital Tourist ID, live Safety Score, and
 * profile. Feature navigation lives in the bottom tab bar and the More menu,
 * so this screen stays uncluttered.
 */
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAuthStore } from '../store/authStore';
import { useSafetyScore } from '../features/safety/hooks/useSafetyScore';
import ScoreBadge from '../features/safety/components/ScoreBadge';
import { useTranslation } from '../i18n/useTranslation';
import type { AppStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<AppStackParamList>;

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between border-b border-slate-100 py-2.5">
      <Text className="text-slate-500">{label}</Text>
      <Text className="max-w-[60%] text-right font-medium text-slate-900">{value}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const score = useSafetyScore();
  const { t } = useTranslation();

  if (!user) {
    return null;
  }

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerClassName="p-4 gap-4">
      <View className="mt-1">
        <Text className="text-2xl font-bold text-slate-900">
          {t('home.greeting', { name: user.fullName.split(' ')[0] })} 👋
        </Text>
        <Text className="mt-1 text-slate-500">{t('home.subtitle')}</Text>
      </View>

      {/* Digital Tourist ID */}
      <View className="rounded-2xl bg-indigo-600 p-5">
        <Text className="text-xs font-semibold uppercase tracking-widest text-indigo-200">
          {t('home.touristId')}
        </Text>
        <Text className="mt-1 text-3xl font-bold tracking-widest text-white">
          {user.touristId}
        </Text>
        <Text className="mt-4 text-lg font-semibold text-white">{user.fullName}</Text>
        <Text className="text-indigo-100">{user.nationality}</Text>
      </View>

      {/* Safety score */}
      <Pressable
        accessibilityRole="button"
        onPress={() => navigation.navigate('SafetyScore')}
        className="flex-row items-center justify-between rounded-2xl bg-white p-5 active:opacity-80"
      >
        <View>
          <Text className="text-base font-bold text-slate-900">{t('home.safetyScore')}</Text>
          <Text className="text-sm text-slate-500">{t('home.tapBreakdown')}</Text>
        </View>
        <ScoreBadge value={score.value} band={score.band} />
      </Pressable>

    </ScrollView>
  );
}
