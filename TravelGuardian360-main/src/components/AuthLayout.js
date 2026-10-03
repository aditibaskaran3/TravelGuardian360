import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from './Icon';
import { LogoMark } from './Logo';
import { colors } from '../utils/constants';
import { t } from '../i18n';
import LanguagePicker from './LanguagePicker';

export default function AuthLayout({ title, subtitle, onBack, children, footer }) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 14 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <Pressable onPress={onBack} style={styles.back} accessibilityLabel={t('Go back')}>
            <Icon name="arrow-left" size={20} />
          </Pressable>
          <LanguagePicker />
        </View>
        <View style={styles.hero}>
          <LogoMark size={48} />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        {children}
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 24, paddingBottom: 32, flexGrow: 1 },
  back: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hero: { marginTop: 24, marginBottom: 28, gap: 8 },
  title: { color: colors.text, fontSize: 28, fontWeight: '800', marginTop: 10, letterSpacing: -0.5 },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  footer: { marginTop: 22, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
});
