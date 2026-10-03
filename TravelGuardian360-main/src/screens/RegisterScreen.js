import React, { useState } from 'react';
import { Pressable, Text } from 'react-native';

import AuthLayout from '../components/AuthLayout';
import Button from '../components/Button';
import Input from '../components/Input';
import { InlineMessage } from '../components/States';
import { useAuth } from '../context/AuthContext';
import { colors } from '../utils/constants';
import { hasErrors, validateEmail, validateName, validatePassword, validatePhone } from '../utils/validation';
import { t } from '../i18n';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '', confirm_password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key) => (value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  const submit = async () => {
    const next = {
      full_name: validateName(form.full_name),
      email: validateEmail(form.email),
      phone: validatePhone(form.phone),
      password: validatePassword(form.password),
      confirm_password: form.confirm_password === form.password ? '' : t('Passwords do not match.'),
    };
    setErrors(next);
    setFormError('');
    if (hasErrors(next)) return;
    setLoading(true);
    try {
      await register({ ...form, full_name: form.full_name.trim(), email: form.email.trim(), phone: form.phone.trim() });
    } catch (err) {
      if (err.status === 409) setErrors({ email: err.message });
      else setFormError(err.message);
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={t('Create your account')}
      subtitle={t('Your Tourist ID is generated as soon as you sign up.')}
      onBack={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Splash'))}
      footer={
        <>
          <Text style={{ color: colors.muted, fontSize: 14 }}>{t('Already registered?')}</Text>
          <Pressable onPress={() => navigation.navigate('Login')}>
            <Text style={{ color: colors.accent, fontSize: 14, fontWeight: '700' }}>{t('Sign in')}</Text>
          </Pressable>
        </>
      }
    >
      <InlineMessage>{formError}</InlineMessage>
      <Input label={t('Full name')} icon="user" value={form.full_name} onChangeText={set('full_name')} error={errors.full_name} placeholder={t('As shown on your passport')} autoComplete="name" />
      <Input label={t('Email')} icon="mail" value={form.email} onChangeText={set('email')} error={errors.email} placeholder={t('you@example.com')} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
      <Input label={t('Phone number')} icon="phone" value={form.phone} onChangeText={set('phone')} error={errors.phone} placeholder="+91 98765 43210" keyboardType="phone-pad" autoComplete="tel" />
      <Input label={t('Password')} icon="lock" secure value={form.password} onChangeText={set('password')} error={errors.password} hint={t('At least 8 characters with letters and numbers.')} placeholder={t('Create a password')} />
      <Input label={t('Confirm password')} icon="lock" secure value={form.confirm_password} onChangeText={set('confirm_password')} error={errors.confirm_password} placeholder={t('Repeat your password')} onSubmitEditing={submit} />
      <Button title={t('Create account')} onPress={submit} loading={loading} style={{ marginTop: 6 }} />
    </AuthLayout>
  );
}
