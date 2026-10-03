import React from 'react';
import { StatusBar, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import Button from '../../../components/ui/Button';
import ScreenContainer from '../../../components/ui/ScreenContainer';
import type { AuthStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <ScreenContainer contentClassName="justify-between bg-slate-50">
      <StatusBar barStyle="dark-content" />

      <View className="mt-2 flex-row items-center">
        <View className="mr-3 h-11 w-11 items-center justify-center rounded-2xl bg-emerald-700">
          <Text className="text-sm font-bold text-white">TG</Text>
        </View>
        <Text className="text-lg font-bold text-slate-900">TravelGuardian360</Text>
      </View>

      <View className="my-8">
        <View className="mb-8 h-64 items-center justify-center overflow-hidden rounded-3xl bg-emerald-800">
          <View className="absolute -right-10 -top-12 h-48 w-48 rounded-full bg-emerald-600/60" />
          <View className="absolute -bottom-20 -left-8 h-56 w-56 rounded-full bg-teal-600/50" />
          <View className="h-36 w-36 items-center justify-center rounded-full border border-white/30 bg-white/10">
            <Text className="text-4xl font-bold text-white">360°</Text>
          </View>
          <View className="absolute bottom-5 right-5 flex-row items-center rounded-full bg-white px-3 py-2">
            <View className="mr-2 h-2 w-2 rounded-full bg-emerald-600" />
            <Text className="ml-1.5 text-xs font-semibold text-emerald-800">Travel with confidence</Text>
          </View>
        </View>

        <Text className="text-4xl font-bold leading-tight text-slate-900">
          The world is yours to explore.
        </Text>
        <Text className="mt-4 text-base leading-6 text-slate-600">
          Keep your trips, trusted contacts, and safety tools together, wherever the journey takes you.
        </Text>

        <View className="mt-7 flex-row items-center">
          <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
            <Text className="text-xs font-bold text-emerald-800">360</Text>
          </View>
          <Text className="flex-1 text-sm font-medium text-slate-700">Your journey, organized</Text>
          <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-rose-100">
            <Text className="text-lg font-bold text-rose-700">+</Text>
          </View>
          <Text className="flex-1 text-sm font-medium text-slate-700">People you trust, close by</Text>
        </View>
      </View>

      <View className="mb-2">
        <Button label="Create your account" onPress={() => navigation.navigate('Register')} />
        <View className="mt-4 flex-row justify-center">
          <Text className="text-slate-500">Already have an account? </Text>
          <Text
            className="font-semibold text-indigo-600"
            accessibilityRole="button"
            onPress={() => navigation.navigate('Login')}
          >
            Sign in
          </Text>
        </View>
      </View>
    </ScreenContainer>
  );
}