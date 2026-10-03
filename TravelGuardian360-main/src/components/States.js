import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import Button from './Button';
import Icon from './Icon';
import { colors } from '../utils/constants';
import { t } from '../i18n';

export function Loading({ label = t('Loading…'), style }) {
  return (
    <View style={[styles.center, style]}>
      <ActivityIndicator color={colors.accent} />
      <Text style={styles.muted}>{label}</Text>
    </View>
  );
}

export function ErrorState({ message, onRetry, style }) {
  return (
    <View style={[styles.center, style]}>
      <View style={[styles.iconWrap, { backgroundColor: colors.dangerSoft }]}>
        <Icon name="wifi-off" size={22} color={colors.danger} />
      </View>
      <Text style={styles.title}>{t('Something went wrong')}</Text>
      <Text style={styles.muted}>{message}</Text>
      {onRetry ? <Button title={t('Try again')} variant="soft" small full={false} onPress={onRetry} icon="refresh-cw" /> : null}
    </View>
  );
}

export function EmptyState({ icon = 'inbox', title, message, action, style }) {
  return (
    <View style={[styles.center, style]}>
      <View style={styles.iconWrap}>
        <Icon name={icon} size={22} color={colors.accent} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.muted}>{message}</Text> : null}
      {action}
    </View>
  );
}

export function InlineMessage({ tone = 'danger', children, style }) {
  if (!children) return null;
  const color = tone === 'danger' ? colors.danger : tone === 'warn' ? colors.caution : colors.safe;
  const bg = tone === 'danger' ? colors.dangerSoft : tone === 'warn' ? colors.cautionSoft : colors.safeSoft;
  const icon = tone === 'danger' ? 'alert-circle' : tone === 'warn' ? 'alert-triangle' : 'check-circle';
  return (
    <View style={[styles.inline, { backgroundColor: bg }, style]}>
      <Icon name={icon} size={16} color={color} />
      <Text style={[styles.inlineText, { color }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 36, paddingHorizontal: 24 },
  iconWrap: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.text, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  muted: { color: colors.muted, fontSize: 13, textAlign: 'center', lineHeight: 19 },
  inline: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 12, marginBottom: 14 },
  inlineText: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: '500' },
});
