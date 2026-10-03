import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { colors } from '../utils/constants';

export default function Chips({ options, value, onChange, style }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.scroll, style]} contentContainerStyle={styles.row}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable key={String(o.value)} onPress={() => onChange(o.value)} style={[styles.chip, active && styles.active]}>
            <Text style={[styles.text, active && styles.activeText]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0, marginBottom: 14 },
  row: { gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, cursor: 'pointer' },
  active: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  text: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  activeText: { color: colors.accent },
});
