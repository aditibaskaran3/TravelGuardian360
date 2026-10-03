import React, { useState } from 'react';
import { Pressable, Text } from 'react-native';

import AuthLayout from '../components/AuthLayout';
import Button from '../components/Button';
import Input from '../components/Input';
import { InlineMessage } from '../components/States';
import { useAuth } from '../context/AuthContext';
import { colors } from '../utils/constants';
import { validateEmail } from '../utils/validation';
import { t } from '../i18n';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const next = { email: validateEmail(email), password: password ? '' : t('Password is required.') };
    setErrors(next);
    setFormError('');
    if (next.email || next.password) return;
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setFormError(err.message);
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={t('Welcome back')}
      subtitle={t('Sign in to continue your journey.')}
      onBack={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Splash'))}
      footer={
        <>
          <Text style={{ color: colors.muted, fontSize: 14 }}>{t('New to TravelGuardian360?')}</Text>
          <Pressable onPress={() => navigation.navigate('Register')}>
            <Text style={{ color: colors.accent, fontSize: 14, fontWeight: '700' }}>{t('Create account')}</Text>
          </Pressable>
        </>
      }
    >
      <InlineMessage>{formError}</InlineMessage>
      <Input
        label={t('Email')} icon="mail" value={email} error={errors.email} placeholder={t('you@example.com')}
        onChangeText={(v) => { setEmail(v); setErrors((e) => ({ ...e, email: '' })); }}
        autoCapitalize="none" keyboardType="email-address" autoComplete="email" textContentType="emailAddress"
        onSubmitEditing={submit}
      />
      <Input
        label={t('Password')} icon="lock" secure value={password} error={errors.password} placeholder={t('Your password')}
        onChangeText={(v) => { setPassword(v); setErrors((e) => ({ ...e, password: '' })); }}
        autoComplete="password" textContentType="password" onSubmitEditing={submit}
      />
      <Button title={t('Sign in')} onPress={submit} loading={loading} style={{ marginTop: 6 }} />
    </AuthLayout>
  );
}
