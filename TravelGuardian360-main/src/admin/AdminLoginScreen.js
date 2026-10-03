import React, { useState } from 'react';
import { KeyboardAvoidingView, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import Button from '../components/Button';
import Icon from '../components/Icon';
import Input from '../components/Input';
import Logo from '../components/Logo';
import { InlineMessage } from '../components/States';
import { useAuth } from '../context/AuthContext';
import { colors, radius } from '../utils/constants';
import { hasErrors, validateEmail } from '../utils/validation';
import { t } from '../i18n';
import LanguagePicker from '../components/LanguagePicker';

export default function AdminLoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (loading) return;
    const next = {
      email: validateEmail(email),
      password: password ? '' : t('Password is required.'),
    };
    setErrors(next);
    setFormError('');
    if (hasErrors(next)) return;
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setFormError(err.message || t('Sign in failed. Please try again.'));
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={{ alignSelf: 'center', marginBottom: 14 }}>
          <LanguagePicker />
        </View>
        <View style={styles.card}>
          <Logo size={44} align="column" />
          <View style={styles.badge}>
            <Icon name="shield" size={14} color={colors.accent} />
            <Text style={styles.badgeText}>{t('Administrator Console')}</Text>
          </View>
          <Text style={styles.title}>{t('Sign in to manage operations')}</Text>
          <Text style={styles.copy}>
            {t('Monitor tourists, respond to emergencies and manage safety zones. Access is restricted to authorised administrators and sensitive actions are logged.')}
          </Text>

          <View style={styles.form}>
            <InlineMessage>{formError}</InlineMessage>
            <Input
              label={t('Administrator email')}
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              icon="mail"
              placeholder={t('admin@example.com')}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              onSubmitEditing={submit}
            />
            <Input
              label={t('Password')}
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              icon="lock"
              secure
              placeholder={t('Your password')}
              onSubmitEditing={submit}
            />
            <Button title={t('Sign in')} icon="log-in" onPress={submit} loading={loading} />
          </View>

          <Pressable onPress={() => Linking.openURL('/')} style={styles.back} accessibilityRole="link">
            <Icon name="arrow-left" size={14} color={colors.muted} />
            <Text style={styles.backText}>{t('Back to the tourist app')}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgDeep, minHeight: '100vh' },
  scroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  card: {
    width: '100%', maxWidth: 440, backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 1,
    borderColor: colors.border, padding: 28, alignItems: 'center',
  },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 18, paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: radius.pill, backgroundColor: colors.accentSoft,
  },
  badgeText: { color: colors.accent, fontSize: 12, fontWeight: '700', letterSpacing: 0.4 },
  title: { color: colors.text, fontSize: 20, fontWeight: '800', marginTop: 16, textAlign: 'center' },
  copy: { color: colors.muted, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 8 },
  form: { width: '100%', marginTop: 22 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, padding: 6, cursor: 'pointer' },
  backText: { color: colors.muted, fontSize: 13 },
});
