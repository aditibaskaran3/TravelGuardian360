import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import Icon from './Icon';
import { colors, radius } from '../utils/constants';

const VARIANTS = {
  primary: { bg: colors.accent, fg: '#fff', border: colors.accent },
  danger: { bg: colors.danger, fg: '#fff', border: colors.danger },
  soft: { bg: colors.accentSoft, fg: colors.accent, border: 'transparent' },
  outline: { bg: 'transparent', fg: colors.text, border: colors.borderStrong },
  ghost: { bg: 'transparent', fg: colors.accent, border: 'transparent' },
  dangerSoft: { bg: colors.dangerSoft, fg: colors.danger, border: 'transparent' },
};

export default function Button({
  title, onPress, variant = 'primary', icon, loading = false, disabled = false, small = false, style, full = true,
}) {
  const v = VARIANTS[variant];
  const inactive = disabled || loading;
  return (
    <Pressable
      onPress={inactive ? undefined : onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        small && styles.small,
        !full && styles.auto,
        { backgroundColor: v.bg, borderColor: v.border },
        inactive && styles.inactive,
        pressed && !inactive && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.fg} />
      ) : (
        <>
          {icon ? <Icon name={icon} size={small ? 15 : 18} color={v.fg} /> : null}
          <Text style={[styles.text, small && styles.textSmall, { color: v.fg }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 50, borderRadius: radius.md, borderWidth: 1, paddingHorizontal: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer',
  },
  small: { minHeight: 38, paddingHorizontal: 14, borderRadius: radius.sm },
  auto: { alignSelf: 'flex-start' },
  text: { fontSize: 15, fontWeight: '600' },
  textSmall: { fontSize: 13 },
  inactive: { opacity: 0.55 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
});
