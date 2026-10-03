import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import Icon from './Icon';
import { colors } from '../utils/constants';
import { initials } from '../utils/format';
import { t } from '../i18n';

export function Avatar({ name, uri, size = 44, style }) {
  const dimension = { width: size, height: size, borderRadius: size / 2 };
  if (uri) return <Image source={{ uri }} style={[dimension, styles.avatarImage, style]} />;
  return (
    <View style={[dimension, styles.avatar, style]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.36 }]}>{initials(name)}</Text>
    </View>
  );
}

/** Top bar for inner screens: back button, title, optional right action. */
export default function Header({ title, subtitle, onBack, right }) {
  return (
    <View style={styles.bar}>
      {onBack ? (
        <Pressable onPress={onBack} style={styles.iconButton} accessibilityLabel={t('Go back')}>
          <Icon name="arrow-left" size={20} />
        </Pressable>
      ) : null}
      <View style={styles.titles}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function IconButton({ icon, onPress, badge, label }) {
  return (
    <Pressable onPress={onPress} style={styles.iconButton} accessibilityLabel={label}>
      <Icon name={icon} size={20} />
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10 },
  titles: { flex: 1 },
  title: { color: colors.text, fontSize: 22, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 13, marginTop: 2 },
  iconButton: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
  },
  badge: {
    position: 'absolute', top: -3, right: -3, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.danger,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderWidth: 2, borderColor: colors.bg,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  avatar: { backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderStrong },
  avatarImage: { backgroundColor: colors.cardAlt },
  avatarText: { color: colors.accent, fontWeight: '800' },
});
