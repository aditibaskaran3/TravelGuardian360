import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { STATUS_META, ZONE_META, colors } from '../utils/constants';

export default function StatusBadge({ status, label, zone = false, dot = true, style }) {
  const meta = (zone ? ZONE_META[status] : STATUS_META[status]) || { label: status, color: colors.muted, soft: colors.cardAlt };
  return (
    <View style={[styles.badge, { backgroundColor: meta.soft }, style]}>
      {dot ? <View style={[styles.dot, { backgroundColor: meta.color }]} /> : null}
      <Text style={[styles.text, { color: meta.color }]}>{label || meta.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, alignSelf: 'flex-start' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 12, fontWeight: '600' },
});
