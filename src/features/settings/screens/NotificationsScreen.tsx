/**
 * Notification centre — the live feed of everything the app has flagged this
 * session (geo-fence breaches, SOS activity, tracking state, safety changes).
 *
 * Reads straight from the notifications store, so it updates in real time.
 * Supports pull-to-refresh, mark-all-read, per-item dismiss, and a friendly
 * empty state.
 */
import React, { useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import {
  selectUnreadCount,
  useNotificationsStore,
} from '../../../store/notificationsStore';
import type {
  AppNotification,
  NotificationSeverity,
} from '../../notifications/types';

const SEVERITY_STYLE: Record<
  NotificationSeverity,
  { dot: string; card: string; title: string; icon: string }
> = {
  info: { dot: 'bg-slate-400', card: 'bg-white border-slate-100', title: 'text-slate-900', icon: 'ℹ️' },
  success: { dot: 'bg-emerald-500', card: 'bg-emerald-50 border-emerald-100', title: 'text-emerald-900', icon: '✅' },
  warning: { dot: 'bg-amber-500', card: 'bg-amber-50 border-amber-100', title: 'text-amber-900', icon: '⚠️' },
  critical: { dot: 'bg-red-500', card: 'bg-red-50 border-red-100', title: 'text-red-900', icon: '🚨' },
};

function relativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function NotificationCard({
  item,
  onPress,
  onDismiss,
}: {
  item: AppNotification;
  onPress: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const s = SEVERITY_STYLE[item.severity];
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress(item.id)}
      className={`flex-row items-start gap-3 rounded-2xl border p-4 active:opacity-80 ${s.card}`}
    >
      <Text className="text-xl">{s.icon}</Text>
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          {!item.read && <View className={`h-2 w-2 rounded-full ${s.dot}`} />}
          <Text className={`flex-1 text-base font-semibold ${s.title}`}>{item.title}</Text>
          <Text className="text-xs text-slate-400">{relativeTime(item.timestamp)}</Text>
        </View>
        <Text className="mt-1 text-sm text-slate-600">{item.body}</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Dismiss notification"
        hitSlop={8}
        onPress={() => onDismiss(item.id)}
        className="px-1"
      >
        <Text className="text-base text-slate-300">✕</Text>
      </Pressable>
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const items = useNotificationsStore((s) => s.items);
  const unread = useNotificationsStore(selectUnreadCount);
  const markAllRead = useNotificationsStore((s) => s.markAllRead);
  const markRead = useNotificationsStore((s) => s.markRead);
  const dismiss = useNotificationsStore((s) => s.dismiss);
  const clearAll = useNotificationsStore((s) => s.clearAll);
  const [refreshing, setRefreshing] = useState(false);

  // Opening the centre marks everything as read shortly after it renders.
  useEffect(() => {
    const t = setTimeout(markAllRead, 600);
    return () => clearTimeout(t);
  }, [markAllRead]);

  const onRefresh = () => {
    setRefreshing(true);
    markAllRead();
    setTimeout(() => setRefreshing(false), 500);
  };

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      contentContainerClassName="p-4 gap-3"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-lg font-bold text-slate-900">Activity</Text>
          <Text className="text-sm text-slate-500">
            {items.length === 0
              ? 'No alerts yet'
              : unread > 0
                ? `${unread} unread · ${items.length} total`
                : `${items.length} total`}
          </Text>
        </View>
        {items.length > 0 && (
          <Pressable
            accessibilityRole="button"
            onPress={clearAll}
            className="rounded-full bg-slate-100 px-3 py-1.5 active:opacity-70"
          >
            <Text className="text-xs font-semibold text-slate-600">Clear all</Text>
          </Pressable>
        )}
      </View>

      {items.length === 0 ? (
        <View className="mt-16 items-center gap-2">
          <Text className="text-5xl">🛡️</Text>
          <Text className="text-base font-semibold text-slate-700">You're all caught up</Text>
          <Text className="px-8 text-center text-sm text-slate-400">
            Safety alerts, geo-fence warnings, SOS updates, and reminders will appear here in real
            time.
          </Text>
        </View>
      ) : (
        items.map((item) => (
          <NotificationCard key={item.id} item={item} onPress={markRead} onDismiss={dismiss} />
        ))
      )}
    </ScrollView>
  );
}
