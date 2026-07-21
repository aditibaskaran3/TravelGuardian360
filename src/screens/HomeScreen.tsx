/**
 * Home dashboard (the "Home" tab).
 *
 * A clean overview: greeting, Digital Tourist ID, live Safety Score, and
 * profile. Feature navigation lives in the bottom tab bar and the More menu,
 * so this screen stays uncluttered.
 */
import React, { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAuthStore } from '../store/authStore';
import { useLocationStore } from '../store/locationStore';
import { useGeofenceStore } from '../store/geofenceStore';
import { useSafetyScore } from '../features/safety/hooks/useSafetyScore';
import ScoreBadge from '../features/safety/components/ScoreBadge';
import PulseDot from '../components/ui/PulseDot';
import { useTranslation } from '../i18n/useTranslation';
import type { AppStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<AppStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const isTracking = useLocationStore((s) => s.status === 'tracking');
  const zonesNearby = useGeofenceStore((s) => s.proximity.length);
  const score = useSafetyScore();
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void useGeofenceStore.getState().loadZones();
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  if (!user) {
    return null;
  }

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      contentContainerClassName="p-4 gap-4"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
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

      {/* Live protection status */}
      <View
        className={`flex-row items-center gap-3 rounded-2xl border p-4 ${
          isTracking ? 'border-emerald-100 bg-emerald-50' : 'border-slate-100 bg-white'
        }`}
      >
        <PulseDot colorClass={isTracking ? 'bg-emerald-500' : 'bg-slate-300'} active={isTracking} />
        <View className="flex-1">
          <Text
            className={`text-base font-semibold ${
              isTracking ? 'text-emerald-900' : 'text-slate-900'
            }`}
          >
            {t(isTracking ? 'home.protectionOn' : 'home.protectionOff')}
          </Text>
          <Text className={`text-sm ${isTracking ? 'text-emerald-700' : 'text-slate-500'}`}>
            {isTracking
              ? zonesNearby > 0
                ? t('home.zonesNearby', { count: zonesNearby })
                : t('home.protectionOnDesc')
              : t('home.protectionOffDesc')}
          </Text>
        </View>
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
