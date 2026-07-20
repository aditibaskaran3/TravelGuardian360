/**
 * Custom bottom navigation bar (hand-rolled — no @react-navigation/bottom-tabs
 * dependency). Renders the tab set from navigation/tabs, highlights the active
 * tab, and emphasizes the central SOS tab.
 */
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { TABS, type TabKey } from '../../navigation/tabs';
import { useTranslation } from '../../i18n/useTranslation';

type Props = {
  active: TabKey;
  onChange: (key: TabKey) => void;
};

export default function BottomNavBar({ active, onChange }: Props) {
  const { t } = useTranslation();

  return (
    <View className="flex-row border-t border-slate-200 bg-white pb-1 pt-2">
      {TABS.map((tab) => {
        const isActive = tab.key === active;

        if (tab.emphasized) {
          return (
            <Pressable
              key={tab.key}
              accessibilityRole="button"
              accessibilityLabel={t(tab.labelKey)}
              onPress={() => onChange(tab.key)}
              className="flex-1 items-center"
            >
              <View className="-mt-6 h-14 w-14 items-center justify-center rounded-full bg-red-600 active:bg-red-700">
                <Text className="text-2xl">{tab.icon}</Text>
              </View>
              <Text className="mt-1 text-xs font-semibold text-red-600">{t(tab.labelKey)}</Text>
            </Pressable>
          );
        }

        return (
          <Pressable
            key={tab.key}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={t(tab.labelKey)}
            onPress={() => onChange(tab.key)}
            className="flex-1 items-center py-1"
          >
            <Text className={`text-xl ${isActive ? '' : 'opacity-40'}`}>{tab.icon}</Text>
            <Text
              className={`mt-1 text-xs ${
                isActive ? 'font-semibold text-indigo-600' : 'text-slate-400'
              }`}
            >
              {t(tab.labelKey)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
