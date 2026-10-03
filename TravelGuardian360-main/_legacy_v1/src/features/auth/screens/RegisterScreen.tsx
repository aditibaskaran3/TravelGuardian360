/**
 * Registration screen — creates the account + Digital Tourist ID.
 */
import React from 'react';
import { Alert, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import ScreenContainer from '../../../components/ui/ScreenContainer';
import TextField from '../../../components/ui/TextField';
import Button from '../../../components/ui/Button';
import { useForm } from '../../../hooks/useForm';
import { useAuthStore } from '../../../store/authStore';
import { useTranslation } from '../../../i18n/useTranslation';
import type { AuthStackParamList } from '../../../navigation/types';
import { registerInitialValues, registerSchema } from '../schemas/authSchemas';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const register = useAuthStore((s) => s.register);
  const { t } = useTranslation();
  const form = useForm(registerInitialValues, registerSchema);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await register({
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        nationality: values.nationality,
        password: values.password,
        emergencyContactName: values.emergencyContactName,
        emergencyContactPhone: values.emergencyContactPhone,
      });
    } catch (error) {
      Alert.alert(t('auth.registrationFailed'), (error as Error).message);
    }
  });

  return (
    <ScreenContainer>
      <View className="mb-6 mt-2">
        <Text className="text-3xl font-bold text-slate-900">{t('auth.createAccount')}</Text>
        <Text className="mt-2 text-base text-slate-500">
          {t('auth.createAccountSubtitle')}
        </Text>
      </View>

      <TextField
        label={t('auth.fullName')}
        placeholder="Jane Traveler"
        autoCapitalize="words"
        {...form.field('fullName')}
      />
      <TextField
        label={t('auth.email')}
        placeholder="you@example.com"
        autoCapitalize="none"
        keyboardType="email-address"
        {...form.field('email')}
      />
      <TextField
        label={t('auth.phone')}
        placeholder="+1 555 123 4567"
        keyboardType="phone-pad"
        {...form.field('phone')}
      />
      <TextField
        label={t('auth.nationality')}
        placeholder="e.g. Indian"
        autoCapitalize="words"
        {...form.field('nationality')}
      />
      <TextField
        label={t('auth.password')}
        placeholder="At least 8 characters"
        secureTextEntry
        {...form.field('password')}
      />
      <TextField
        label={t('auth.confirmPassword')}
        placeholder="Re-enter your password"
        secureTextEntry
        {...form.field('confirmPassword')}
      />

      <Text className="mb-3 mt-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
        {t('auth.emergencyContact')}
      </Text>
      <TextField
        label={t('auth.contactName')}
        placeholder="Full name"
        autoCapitalize="words"
        {...form.field('emergencyContactName')}
      />
      <TextField
        label={t('auth.contactPhone')}
        placeholder="+1 555 987 6543"
        keyboardType="phone-pad"
        {...form.field('emergencyContactPhone')}
      />

      <View className="mt-2">
        <Button label={t('auth.createAccountButton')} loading={form.isSubmitting} onPress={onSubmit} />
      </View>

      <View className="mt-6 flex-row justify-center">
        <Text className="text-slate-500">{t('auth.alreadyHaveAccount')} </Text>
        <Text
          className="font-semibold text-indigo-600"
          onPress={() => navigation.navigate('Login')}
        >
          {t('auth.signIn')}
        </Text>
      </View>
    </ScreenContainer>
  );
}
