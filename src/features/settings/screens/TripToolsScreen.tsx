/**
 * Trip tools — practical, working utilities for safer travel:
 *   1) an interactive pre-trip safety checklist (tap to tick items off),
 *   2) local support helplines that dial directly, and
 *   3) a route-safety briefing link that opens the official travel advisory.
 *
 * All actions are real: the checklist is stateful, helplines use the phone
 * dialer, and the advisory opens the device browser.
 */
import React, { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';

import { EMERGENCY_NUMBER } from '../../../config/env';
import { useTranslation } from '../../../i18n/useTranslation';
import type { TranslationKey } from '../../../i18n';

const CHECKLIST_ITEMS = [
  'tripTools.items.0',
  'tripTools.items.1',
  'tripTools.items.2',
  'tripTools.items.3',
  'tripTools.items.4',
  'tripTools.items.5',
];

type Helpline = { key: TranslationKey; number: string; noteKey: TranslationKey };

const HELPLINES: Helpline[] = [
  { key: 'tripTools.emergencyServices', number: EMERGENCY_NUMBER, noteKey: 'tripTools.emergencyServicesNote' },
  { key: 'tripTools.touristHelpline', number: '1363', noteKey: 'tripTools.touristHelplineNote' },
  { key: 'tripTools.womenHelpline', number: '1091', noteKey: 'tripTools.womenHelplineNote' },
  { key: 'tripTools.disasterManagement', number: '108', noteKey: 'tripTools.disasterManagementNote' },
];

const ADVISORY_URL = 'https://www.mea.gov.in/travel-advisories.htm';

async function dial(number: string, t: (key: TranslationKey, params?: Record<string, string | number>) => string) {
  const url = `tel:${number}`;
  const canOpen = await Linking.canOpenURL(url);
  if (!canOpen) {
    Alert.alert(t('tripTools.callFailedTitle'), t('tripTools.callFailedMessage', { number }));
    return;
  }
  await Linking.openURL(url);
}

async function openAdvisory(t: (key: TranslationKey, params?: Record<string, string | number>) => string) {
  const canOpen = await Linking.canOpenURL(ADVISORY_URL);
  if (!canOpen) {
    Alert.alert(t('tripTools.linkFailedTitle'), t('tripTools.linkFailedMessage'));
    return;
  }
  await Linking.openURL(ADVISORY_URL);
}

export default function TripToolsScreen() {
  const { t } = useTranslation();
  const [done, setDone] = useState<Record<number, boolean>>({});
  const toggle = (index: number) =>
    setDone((prev) => ({ ...prev, [index]: !prev[index] }));
  const completed = Object.values(done).filter(Boolean).length;

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerClassName="p-4 gap-4">
      <View className="rounded-3xl bg-emerald-600 p-5">
        <Text className="text-sm font-semibold uppercase tracking-widest text-emerald-100">
          {t('tripTools.title')}
        </Text>
        <Text className="mt-1 text-xl font-semibold text-white">{t('tripTools.subtitle')}</Text>
        <Text className="mt-2 text-sm text-emerald-100">{t('tripTools.description')}</Text>
      </View>

      {/* Interactive safety checklist */}
      <View className="rounded-2xl border border-slate-100 bg-white p-4">
        <View className="mb-1 flex-row items-center justify-between">
          <Text className="text-base font-semibold text-slate-900">{t('tripTools.checklistTitle')}</Text>
          <Text className="text-xs font-medium text-emerald-600">
            {completed}/{CHECKLIST_ITEMS.length}
          </Text>
        </View>
        <Text className="mb-2 text-sm text-slate-500">{t('tripTools.checklistHint')}</Text>
        <View className="gap-2">
          {CHECKLIST_ITEMS.map((item, index) => {
            const checked = !!done[index];
            return (
              <Pressable
                key={item}
                accessibilityRole="checkbox"
                accessibilityState={{ checked }}
                onPress={() => toggle(index)}
                className="flex-row items-center gap-3 rounded-xl py-2 active:opacity-70"
              >
                <View
                  className={`h-6 w-6 items-center justify-center rounded-md border ${
                    checked ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 bg-white'
                  }`}
                >
                  {checked ? <Text className="text-xs font-bold text-white">✓</Text> : null}
                </View>
                <Text
                  className={`flex-1 text-sm ${
                    checked ? 'text-slate-400 line-through' : 'text-slate-700'
                  }`}
                >
                  {t(item as any)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Local support contacts — tap to call */}
      <View className="rounded-2xl border border-slate-100 bg-white p-4">
        <Text className="text-base font-semibold text-slate-900">{t('tripTools.contactsTitle')}</Text>
        <Text className="mb-2 text-sm text-slate-500">{t('tripTools.contactsHint')}</Text>
        <View className="gap-2">
          {HELPLINES.map((line) => (
            <Pressable
              key={line.number}
              accessibilityRole="button"
              onPress={() => dial(line.number, t)}
              className="flex-row items-center justify-between rounded-xl bg-slate-50 px-3 py-3 active:opacity-70"
            >
              <View className="flex-1 pr-2">
                <Text className="text-sm font-semibold text-slate-900">{t(line.key)}</Text>
                <Text className="text-xs text-slate-500">{t(line.noteKey)}</Text>
              </View>
              <Text className="text-sm font-bold text-emerald-600">📞 {line.number}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Route safety briefing */}
      <Pressable
        accessibilityRole="button"
        onPress={() => openAdvisory(t)}
        className="rounded-2xl border border-slate-100 bg-white p-4 active:bg-slate-50"
      >
        <Text className="text-base font-semibold text-slate-900">{t('tripTools.advisoryTitle')}</Text>
        <Text className="mt-1 text-sm text-slate-500">{t('tripTools.advisoryBody')}</Text>
        <Text className="mt-2 text-sm font-semibold text-emerald-600">{t('tripTools.advisoryLink')}</Text>
      </Pressable>
    </ScrollView>
  );
}
