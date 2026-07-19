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
import type { AuthStackParamList } from '../../../navigation/types';
import { loginInitialValues, loginSchema } from '../schemas/authSchemas';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const login = useAuthStore((s) => s.login);
  const form = useForm(loginInitialValues, loginSchema);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await login({ email: values.email, password: values.password });
      // On success the RootNavigator swaps to the app stack automatically.
    } catch (error) {
      Alert.alert('Login failed', (error as Error).message);
    }
  });

  return (
    <ScreenContainer>
      <View className="mb-8 mt-4">
        <Text className="text-3xl font-bold text-slate-900">Welcome back</Text>
        <Text className="mt-2 text-base text-slate-500">
          Sign in to continue to TravelGuardian360.
        </Text>
      </View>

      <TextField
        label="Email"
        placeholder="you@example.com"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        {...form.field('email')}
      />

      <TextField
        label="Password"
        placeholder="Your password"
        secureTextEntry
        autoComplete="password"
        {...form.field('password')}
      />

      <View className="mt-2">
        <Button label="Sign in" loading={form.isSubmitting} onPress={onSubmit} />
      </View>

      <View className="mt-6 flex-row justify-center">
        <Text className="text-slate-500">Don't have an account? </Text>
        <Text
          className="font-semibold text-indigo-600"
          onPress={() => navigation.navigate('Register')}
        >
          Register
        </Text>
      </View>
    </ScreenContainer>
  );
}
