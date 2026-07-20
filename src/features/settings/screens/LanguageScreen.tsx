/**
 * Language selection screen — switches the app language live.
 */
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { useTranslation } from '../../../i18n/useTranslation';
import { LANGUAGES } from '../../../i18n';

export default function LanguageScreen() {
  const { t, language, setLanguage } = useTranslation();

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerClassName="p-4 gap-4">
      <View className="mt-1">
        <Text className="text-2xl font-bold text-slate-900">{t('language.title')}</Text>
        <Text className="mt-1 text-slate-500">{t('language.subtitle')}</Text>
      </View>

      <View className="rounded-2xl bg-white p-2">
        {LANGUAGES.map((lang) => {
          const active = lang.code === language;
          return (
            <Pressable
              key={lang.code}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setLanguage(lang.code)}
              className={`flex-row items-center justify-between rounded-xl px-4 py-4 ${
                active ? 'bg-indigo-50' : ''
              }`}
            >
              <View>
                <Text className="text-lg font-semibold text-slate-900">{lang.nativeLabel}</Text>
                <Text className="text-sm text-slate-400">{lang.label}</Text>
              </View>
              {active ? <Text className="text-xl text-indigo-600">✓</Text> : null}
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}
