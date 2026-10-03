/**
 * "More" tab — a richer mobile-friendly settings experience.
 */
import React from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAuthStore } from '../../../store/authStore';
import { useContactsStore } from '../../../store/contactsStore';
import { useMedicalStore } from '../../../store/medicalStore';
import { useFamilyStore } from '../../../store/familyStore';
import { useSosStore } from '../../../store/sosStore';
import { useLocationStore } from '../../../store/locationStore';
import { useNotificationsStore } from '../../../store/notificationsStore';
import { useTranslation } from '../../../i18n/useTranslation';
import { DEMO_MODE } from '../../../config/env';
import { resetDemo } from '../../../demo/demoReset';
import type { AppStackParamList } from '../../../navigation/types';
import type { TranslationKey } from '../../../i18n';

type Nav = NativeStackNavigationProp<AppStackParamList>;

type Item = {
  icon: string;
  labelKey: TranslationKey;
  descriptionKey: TranslationKey;
  route: keyof AppStackParamList;
};

const ITEMS: Item[] = [
  { icon: '📇', labelKey: 'more.contacts', descriptionKey: 'more.contactsDesc', route: 'Contacts' },
  { icon: '🩺', labelKey: 'more.medicalID', descriptionKey: 'more.medicalIDDesc', route: 'MedicalID' },
  { icon: '🧳', labelKey: 'more.documents', descriptionKey: 'more.documentsDesc', route: 'TravelDocuments' },
  { icon: '🚌', labelKey: 'more.tripTools', descriptionKey: 'more.tripToolsDesc', route: 'TripTools' },
  { icon: '📋', labelKey: 'more.itinerary', descriptionKey: 'more.itineraryDesc', route: 'Itinerary' },
  { icon: '👨‍👩‍👧‍👦', labelKey: 'more.familyMembers', descriptionKey: 'more.familyMembersDesc', route: 'FamilyMembers' },
  { icon: '📊', labelKey: 'more.behaviour', descriptionKey: 'more.behaviourDesc', route: 'Behavior' },
  { icon: '🛡️', labelKey: 'more.safetyScore', descriptionKey: 'more.safetyScoreDesc', route: 'SafetyScore' },
];

function Row({ icon, label, description, onPress }: { icon: string; label: string; description: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="flex-row items-start gap-3 rounded-2xl border border-slate-100 bg-white p-4 active:bg-slate-50"
    >
      <View className="h-11 w-11 items-center justify-center rounded-2xl bg-slate-100">
        <Text className="text-xl">{icon}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-slate-900">{label}</Text>
        <Text className="mt-1 text-sm text-slate-500">{description}</Text>
      </View>
      <Text className="pt-1 text-lg text-slate-300">›</Text>
    </Pressable>
  );
}

export default function MoreScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const logout = useAuthStore((s) => s.logout);

  const handleResetDemo = () => {
    Alert.alert(
      'Reset Demo State?',
      'This restores Jane Cooper, New Delhi safe zones, sample emergency contacts, and medical ID for a clean demo recording.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Demo',
          style: 'destructive',
          onPress: async () => {
            await resetDemo();
            await useAuthStore.getState().hydrate();
            await useContactsStore.getState().load();
            await useMedicalStore.getState().hydrate();
            await useFamilyStore.getState().hydrate();
            useSosStore.getState().reset();
            useLocationStore.getState().reset();
            useNotificationsStore.getState().clearAll();
            Alert.alert('Demo Reset', 'Demo state has been restored to default.');
          },
        },
      ],
    );
  };

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerClassName="p-4 gap-4">
      <View className="rounded-3xl bg-indigo-600 p-5">
        <Text className="text-sm font-semibold uppercase tracking-widest text-indigo-200">{t('more.quickAccess')}</Text>
        <Text className="mt-1 text-xl font-semibold text-white">{t('more.quickAccessTitle')}</Text>
        <Text className="mt-2 text-sm text-indigo-100">{t('more.quickAccessDesc')}</Text>
      </View>

      <View className="gap-3">
        {ITEMS.map((item) => (
          <Row
            key={item.route}
            icon={item.icon}
            label={t(item.labelKey)}
            description={t(item.descriptionKey)}
            onPress={() => navigation.navigate(item.route as never)}
          />
        ))}
      </View>

      {DEMO_MODE && (
        <View className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-sm font-bold text-indigo-900">Demo Controller</Text>
              <Text className="mt-0.5 text-xs text-indigo-600">
                Jane Cooper · New Delhi GPS simulation active
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={handleResetDemo}
              className="rounded-xl bg-indigo-600 px-3 py-2 active:opacity-80"
            >
              <Text className="text-xs font-semibold text-white">Reset Demo</Text>
            </Pressable>
          </View>
        </View>
      )}

      <Pressable
        accessibilityRole="button"
        onPress={() => logout()}
        className="items-center rounded-2xl border border-red-100 bg-red-50 px-5 py-4 active:opacity-80"
      >
        <Text className="text-base font-semibold text-red-600">{t('more.logout')}</Text>
      </Pressable>
    </ScrollView>
  );
}
