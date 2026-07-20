import React from 'react';
import { ScrollView, Text, View } from 'react-native';

const TOOLS = [
  { title: 'Emergency checklist', description: 'Keep a quick list of contacts and steps ready.' },
  { title: 'Local support contacts', description: 'View nearby helplines and embassy guidance.' },
  { title: 'Route safety briefing', description: 'Check travel advisories before you move.' },
];

export default function TripToolsScreen() {
  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerClassName="p-4 gap-4">
      <View className="rounded-3xl bg-emerald-600 p-5">
        <Text className="text-sm font-semibold uppercase tracking-widest text-emerald-100">Trip support</Text>
        <Text className="mt-1 text-xl font-semibold text-white">Helpful tools for safer travel</Text>
        <Text className="mt-2 text-sm text-emerald-100">
          Access practical resources before and during your journey.
        </Text>
      </View>

      <View className="gap-3">
        {TOOLS.map((tool) => (
          <View key={tool.title} className="rounded-2xl border border-slate-100 bg-white p-4">
            <Text className="text-base font-semibold text-slate-900">{tool.title}</Text>
            <Text className="mt-1 text-sm text-slate-500">{tool.description}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
