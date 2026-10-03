import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Icon from './Icon';
import { NOTIFICATION_TYPES, colors } from '../utils/constants';
import { timeAgo } from '../utils/format';

export default function NotificationItem({ item, onPress, compact = false }) {
  const meta = NOTIFICATION_TYPES[item.type] || NOTIFICATION_TYPES.general;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.8 }]}>
      <View style={[styles.icon, { backgroundColor: `${meta.color}22` }]}>
        <Icon name={meta.icon} size={18} color={meta.color} />
      </View>
      <View style={styles.text}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, !item.is_read && styles.unread]} numberOfLines={1}>{item.title}</Text>
          {!item.is_read ? <View style={styles.dot} /> : null}
        </View>
        <Text style={styles.message} numberOfLines={compact ? 2 : 6}>{item.message}</Text>
        <Text style={styles.meta}>{meta.label} · {timeAgo(item.created_at)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, paddingVertical: 12, cursor: 'pointer' },
  icon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { color: colors.textSoft, fontSize: 14, fontWeight: '600', flexShrink: 1 },
  unread: { color: colors.text, fontWeight: '700' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  message: { color: colors.muted, fontSize: 13, lineHeight: 18, marginTop: 3 },
  meta: { color: colors.muted, fontSize: 11, marginTop: 6, opacity: 0.8 },
});
