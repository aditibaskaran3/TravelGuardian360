/**
 * LiveBanner — the in-app "push notification".
 *
 * Watches the notifications store's `latest` value and slides a compact banner
 * down from the top whenever a new (non-silent) event arrives. Auto-dismisses
 * after a few seconds, or on tap (which opens the notification centre).
 * `critical` events also fire a short device vibration.
 *
 * Mounted once, globally, above the tab shell so it appears on every screen.
 * Uses React Native's built-in Animated API (no Reanimated worklets) so it is
 * unaffected by this project's custom Babel config (see build-env notes).
 */
import React, { useCallback, useEffect, useRef } from 'react';
import { Animated, Pressable, Text, Vibration, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useNotificationsStore } from '../../../store/notificationsStore';
import type { NotificationSeverity } from '../types';
import type { AppStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<AppStackParamList>;

const VISIBLE_MS = 4200;

const STYLES: Record<
  NotificationSeverity,
  { container: string; title: string; body: string; icon: string }
> = {
  info: { container: 'bg-slate-900', title: 'text-white', body: 'text-slate-300', icon: 'ℹ️' },
  success: { container: 'bg-emerald-600', title: 'text-white', body: 'text-emerald-50', icon: '✅' },
  warning: { container: 'bg-amber-500', title: 'text-white', body: 'text-amber-50', icon: '⚠️' },
  critical: { container: 'bg-red-600', title: 'text-white', body: 'text-red-50', icon: '🚨' },
};

export default function LiveBanner() {
  const navigation = useNavigation<Nav>();
  const latest = useNotificationsStore((s) => s.latest);
  const clearLatest = useNotificationsStore((s) => s.clearLatest);

  const anim = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    Animated.timing(anim, { toValue: 0, duration: 220, useNativeDriver: true }).start();
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, [anim]);

  useEffect(() => {
    if (!latest) {
      return;
    }
    if (latest.severity === 'critical') {
      Vibration.vibrate([0, 220, 120, 220]);
    }
    Animated.timing(anim, { toValue: 1, duration: 260, useNativeDriver: true }).start();

    if (timer.current) {
      clearTimeout(timer.current);
    }
    timer.current = setTimeout(hide, VISIBLE_MS);
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, [latest, hide, anim]);

  if (!latest) {
    return null;
  }

  const s = STYLES[latest.severity];
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [-160, 0] });

  return (
    <Animated.View
      pointerEvents="box-none"
      style={{ transform: [{ translateY }], opacity: anim }}
      className="absolute inset-x-0 top-0 z-50 px-3 pt-2"
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${latest.title}. ${latest.body}. Open notifications.`}
        onPress={() => {
          hide();
          clearLatest();
          navigation.navigate('Notifications');
        }}
        className={`flex-row items-start gap-3 rounded-2xl ${s.container} px-4 py-3 shadow-lg active:opacity-90`}
      >
        <Text className="text-lg">{s.icon}</Text>
        <View className="flex-1">
          <Text className={`text-sm font-bold ${s.title}`} numberOfLines={1}>
            {latest.title}
          </Text>
          <Text className={`mt-0.5 text-xs ${s.body}`} numberOfLines={2}>
            {latest.body}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          hitSlop={10}
          onPress={hide}
          className="px-1"
        >
          <Text className={`text-base ${s.body}`}>✕</Text>
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}
