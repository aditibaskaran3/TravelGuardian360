/**
 * Login screen — email/password sign-in.
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
import { loginInitialValues, loginSchema } from '../schemas/authSchemas';
import { DEMO_MODE, DEMO_TRAVELLER } from '../../../config/env';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const login = useAuthStore((s) => s.login);
  const { t } = useTranslation();
  const form = useForm(loginInitialValues, loginSchema);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await login({ email: values.email, password: values.password });
      // On success the RootNavigator swaps to the app stack automatically.
    } catch (error) {
      Alert.alert(t('auth.loginFailed'), (error as Error).message);
    }
  });

  return (
    <ScreenContainer>
      <View className="mb-8 mt-4">
        <Text className="text-3xl font-bold text-slate-900">{t('auth.welcomeBack')}</Text>
        <Text className="mt-2 text-base text-slate-500">
          {t('auth.loginSubtitle')}
        </Text>
      </View>

      <TextField
        label={t('auth.email')}
        placeholder="you@example.com"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        {...form.field('email')}
      />

      <TextField
        label={t('auth.password')}
        placeholder="Your password"
        secureTextEntry
        autoComplete="password"
        {...form.field('password')}
      />

      <View className="mt-2">
        <Button label={t('auth.signIn')} loading={form.isSubmitting} onPress={onSubmit} />
      </View>

      {DEMO_MODE && (
        <View className="mt-3">
          <Button
            label="Quick Demo Sign-In (Jane Cooper)"
            variant="secondary"
            loading={form.isSubmitting}
            onPress={async () => {
              try {
                await login({ email: DEMO_TRAVELLER.email, password: DEMO_TRAVELLER.password });
              } catch (error) {
                Alert.alert(t('auth.loginFailed'), (error as Error).message);
              }
            }}
          />
        </View>
      )}

      <View className="mt-6 flex-row justify-center">
        <Text className="text-slate-500">{t('auth.dontHaveAccount')} </Text>
        <Text
          className="font-semibold text-indigo-600"
          onPress={() => navigation.navigate('Register')}
        >
          {t('auth.register')}
        </Text>
      </View>
    </ScreenContainer>
  );
}
