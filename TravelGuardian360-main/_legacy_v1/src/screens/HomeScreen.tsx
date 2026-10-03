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
import { useTripMode } from '../features/trip/hooks/useTripMode';
import ScoreBadge from '../features/safety/components/ScoreBadge';
import PulseDot from '../components/ui/PulseDot';
import Button from '../components/ui/Button';
import { useTranslation } from '../i18n/useTranslation';
import type { AppStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<AppStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const isTracking = useLocationStore((s) => s.status === 'tracking');
  const zonesNearby = useGeofenceStore((s) => s.proximity.length);
  const score = useSafetyScore();
  const { isActive, isPaused, trip, startTrip, endTrip, pauseTrip, resumeTrip } = useTripMode();
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

      {/* Trip Mode Status */}
      <View
        className={`rounded-2xl border p-4 ${
          isActive ? 'border-blue-100 bg-blue-50' : isPaused ? 'border-amber-100 bg-amber-50' : 'border-slate-100 bg-white'
        }`}
      >
        <View className="flex-row items-center gap-2">
          <PulseDot colorClass={isActive ? 'bg-blue-500' : isPaused ? 'bg-amber-500' : 'bg-slate-300'} active={isActive} />
          <Text
            className={`text-base font-semibold ${
              isActive ? 'text-blue-900' : isPaused ? 'text-amber-900' : 'text-slate-900'
            }`}
          >
            {t(isActive ? 'trip.active' : isPaused ? 'trip.paused' : 'trip.notActive')}
          </Text>
        </View>
        {trip && trip.startedAt ? (
          <Text className="mt-1 text-xs text-slate-500">
            Started {new Date(trip.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        ) : null}
        <View className="mt-3 flex-row gap-2">
          {!isActive && !isPaused ? (
            <Button label={t('trip.startButton')} onPress={startTrip} />
          ) : (
            <>
              {isActive ? (
                <>
                  <Pressable
                    accessibilityRole="button"
                    onPress={pauseTrip}
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 active:opacity-70"
                  >
                    <Text className="text-center text-xs font-semibold text-slate-600">
                      {t('trip.pauseButton')}
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={endTrip}
                    className="flex-1 rounded-xl bg-red-100 px-3 py-2 active:opacity-70"
                  >
                    <Text className="text-center text-xs font-semibold text-red-600">
                      {t('trip.endButton')}
                    </Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Pressable
                    accessibilityRole="button"
                    onPress={resumeTrip}
                    className="flex-1 rounded-xl bg-blue-100 px-3 py-2 active:opacity-70"
                  >
                    <Text className="text-center text-xs font-semibold text-blue-600">
                      {t('trip.resumeButton')}
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={endTrip}
                    className="flex-1 rounded-xl bg-red-100 px-3 py-2 active:opacity-70"
                  >
                    <Text className="text-center text-xs font-semibold text-red-600">
                      {t('trip.endButton')}
                    </Text>
                  </Pressable>
                </>
              )}
            </>
          )}
        </View>
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
