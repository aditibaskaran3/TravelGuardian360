import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Icon from './Icon';
import { colors, setThemeMode, themeMode } from '../utils/constants';
import { t } from '../i18n';

const OPTIONS = [
  { value: 'dark', label: t('Dark'), icon: 'moon' },
  { value: 'light', label: t('Light'), icon: 'sun' },
];

export default function ThemeToggle() {
  return (
    <View style={styles.row}>
      {OPTIONS.map((o) => {
        const active = o.value === themeMode;
        return (
          <Pressable key={o.value} onPress={() => !active && setThemeMode(o.value)} style={[styles.option, active && styles.active]}>
            <Icon name={o.icon} size={16} color={active ? colors.accent : colors.muted} />
            <Text style={[styles.text, active && { color: colors.accent }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  option: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12,
    borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg, cursor: 'pointer',
  },
  active: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  text: { color: colors.muted, fontSize: 14, fontWeight: '600' },
});
