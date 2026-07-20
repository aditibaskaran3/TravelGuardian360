/**
 * App top bar: screen title on the left, a compact language chip on the right.
 * The language chip is the small top-corner control for switching languages.
 */
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAuthStore } from '../../store/authStore';
import { useTranslation } from '../../i18n/useTranslation';
import type { AppStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<AppStackParamList>;

export default function TopBar({ title }: { title: string }) {
  const navigation = useNavigation<Nav>();
  const { language } = useTranslation();
  const user = useAuthStore((s) => s.user);

  return (
    <View className="flex-row items-center justify-between border-b border-slate-100 bg-white px-4 py-3">
      <Text className="text-lg font-bold text-slate-900">{title}</Text>
      <View className="flex-row items-center gap-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open notifications"
          onPress={() => navigation.navigate('Notifications')}
          className="h-10 w-10 items-center justify-center rounded-full bg-rose-50 active:opacity-70"
        >
          <Text className="text-lg">🔔</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Change language"
          onPress={() => navigation.navigate('Language')}
          className="flex-row items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 active:opacity-70"
        >
          <Text className="text-base">🌐</Text>
          <Text className="text-xs font-bold uppercase text-slate-600">{language}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open traveller profile"
          onPress={() => navigation.navigate('Profile')}
          className="flex-row items-center rounded-full bg-indigo-50 px-3 py-1.5 active:opacity-70"
        >
          <Text className="mr-1 text-sm">👤</Text>
          <Text className="text-xs font-semibold text-indigo-700">
            {user?.fullName?.split(' ')[0] ?? 'Profile'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
