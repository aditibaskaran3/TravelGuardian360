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

const CHECKLIST_ITEMS = [
  'Share your live location with a trusted contact',
  'Save offline maps for your destination',
  'Note the nearest hospital and police station',
  'Keep copies of ID and travel documents',
  'Carry enough local currency for emergencies',
  'Charge your phone and pack a power bank',
];

type Helpline = { label: string; number: string; note: string };

const HELPLINES: Helpline[] = [
  { label: 'Emergency services', number: EMERGENCY_NUMBER, note: 'Police · Fire · Ambulance' },
  { label: 'Tourist helpline', number: '1363', note: 'Ministry of Tourism, 24×7' },
  { label: 'Women helpline', number: '1091', note: 'Nationwide' },
  { label: 'Disaster management', number: '108', note: 'Emergency response' },
];

const ADVISORY_URL = 'https://www.mea.gov.in/travel-advisories.htm';

async function dial(number: string) {
  const url = `tel:${number}`;
  const canOpen = await Linking.canOpenURL(url);
  if (!canOpen) {
    Alert.alert('Unable to place call', `Please dial ${number} manually.`);
    return;
  }
  await Linking.openURL(url);
}

async function openAdvisory() {
  const canOpen = await Linking.canOpenURL(ADVISORY_URL);
  if (!canOpen) {
    Alert.alert('Unable to open link', 'No browser is available on this device.');
    return;
  }
  await Linking.openURL(ADVISORY_URL);
}

export default function TripToolsScreen() {
  const [done, setDone] = useState<Record<number, boolean>>({});
  const toggle = (index: number) =>
    setDone((prev) => ({ ...prev, [index]: !prev[index] }));
  const completed = Object.values(done).filter(Boolean).length;

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerClassName="p-4 gap-4">
      <View className="rounded-3xl bg-emerald-600 p-5">
        <Text className="text-sm font-semibold uppercase tracking-widest text-emerald-100">
          Trip support
        </Text>
        <Text className="mt-1 text-xl font-semibold text-white">Helpful tools for safer travel</Text>
        <Text className="mt-2 text-sm text-emerald-100">
          Practical resources you can use before and during your journey.
        </Text>
      </View>

      {/* Interactive safety checklist */}
      <View className="rounded-2xl border border-slate-100 bg-white p-4">
        <View className="mb-1 flex-row items-center justify-between">
          <Text className="text-base font-semibold text-slate-900">Pre-trip safety checklist</Text>
          <Text className="text-xs font-medium text-emerald-600">
            {completed}/{CHECKLIST_ITEMS.length}
          </Text>
        </View>
        <Text className="mb-2 text-sm text-slate-500">Tap each item as you complete it.</Text>
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
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Local support contacts — tap to call */}
      <View className="rounded-2xl border border-slate-100 bg-white p-4">
        <Text className="text-base font-semibold text-slate-900">Local support contacts</Text>
        <Text className="mb-2 text-sm text-slate-500">Tap a helpline to call it directly.</Text>
        <View className="gap-2">
          {HELPLINES.map((line) => (
            <Pressable
              key={line.number}
              accessibilityRole="button"
              onPress={() => dial(line.number)}
              className="flex-row items-center justify-between rounded-xl bg-slate-50 px-3 py-3 active:opacity-70"
            >
              <View className="flex-1 pr-2">
                <Text className="text-sm font-semibold text-slate-900">{line.label}</Text>
                <Text className="text-xs text-slate-500">{line.note}</Text>
              </View>
              <Text className="text-sm font-bold text-emerald-600">📞 {line.number}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Route safety briefing */}
      <Pressable
        accessibilityRole="button"
        onPress={openAdvisory}
        className="rounded-2xl border border-slate-100 bg-white p-4 active:bg-slate-50"
      >
        <Text className="text-base font-semibold text-slate-900">Route safety briefing</Text>
        <Text className="mt-1 text-sm text-slate-500">
          Check official travel advisories before you move. Opens in your browser.
        </Text>
        <Text className="mt-2 text-sm font-semibold text-emerald-600">View advisories →</Text>
      </Pressable>
    </ScrollView>
  );
}
