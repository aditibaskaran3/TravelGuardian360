import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAdminStore } from '../store/adminStore';
import type { AppStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<AppStackParamList>;

export default function AdminDashboardScreen() {
  const navigation = useNavigation<Nav>();
  const tourists = useAdminStore((s) => s.tourists);

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerClassName="p-4 gap-4">
      <View className="rounded-3xl bg-slate-900 p-5">
        <Text className="text-sm font-semibold uppercase tracking-widest text-slate-300">
          Admin portal
        </Text>
        <Text className="mt-1 text-xl font-semibold text-white">Tourist control centre</Text>
        <Text className="mt-2 text-sm text-slate-400">
          Review tourist records, monitor activity, and update case notes from one place.
        </Text>
      </View>

      <View className="gap-3">
        {tourists.map((tourist) => (
          <Pressable
            key={tourist.id}
            accessibilityRole="button"
            onPress={() => navigation.navigate('AdminTouristDetail' as never)}
            className="rounded-2xl border border-slate-100 bg-white p-4"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-2">
                <Text className="text-base font-semibold text-slate-900">{tourist.fullName}</Text>
                <Text className="mt-1 text-sm text-slate-500">{tourist.country}</Text>
                <Text className="mt-1 text-sm text-slate-500">{tourist.phone}</Text>
              </View>
              <View className="rounded-full bg-indigo-100 px-3 py-1">
                <Text className="text-xs font-semibold text-indigo-700">{tourist.status}</Text>
              </View>
            </View>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
