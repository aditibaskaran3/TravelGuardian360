/**
 * Tourist Safety Score screen — live score gauge + transparent breakdown of
 * every factor and how to improve it.
 */
import React from 'react';
import { ScrollView, Text, View } from 'react-native';

import ScoreBadge from '../components/ScoreBadge';
import { useSafetyScore } from '../hooks/useSafetyScore';

export default function SafetyScoreScreen() {
  const score = useSafetyScore();

  const improvable = score.factors.filter((f) => f.impact < 0);

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerClassName="p-4 gap-4">
      <View className="items-center rounded-2xl bg-white p-6">
        <ScoreBadge value={score.value} band={score.band} size="lg" />
        <Text className="mt-4 text-center text-slate-500">
          Your safety score updates live from your location, nearby zones, profile and recent
          activity.
        </Text>
      </View>

      {/* Factor breakdown */}
      <View className="rounded-2xl bg-white p-5">
        <Text className="mb-2 text-base font-bold text-slate-900">What affects your score</Text>
        {score.factors.map((f) => (
          <View key={f.key} className="border-b border-slate-100 py-3">
            <View className="flex-row items-center justify-between">
              <Text className="flex-1 pr-2 font-medium text-slate-800">{f.label}</Text>
              <Text
                className={`font-bold ${
                  f.impact < 0 ? 'text-red-600' : 'text-emerald-600'
                }`}
              >
                {f.impact === 0 ? 'OK' : f.impact}
              </Text>
            </View>
            <Text className="mt-0.5 text-sm text-slate-500">{f.detail}</Text>
          </View>
        ))}
      </View>

      {/* Tips */}
      {improvable.length > 0 ? (
        <View className="rounded-2xl bg-indigo-50 p-5">
          <Text className="mb-2 text-base font-bold text-indigo-900">Improve your score</Text>
          {improvable.map((f) => (
            <Text key={f.key} className="mb-1 text-sm text-indigo-800">
              • {f.detail}
            </Text>
          ))}
        </View>
      ) : (
        <View className="rounded-2xl bg-emerald-50 p-5">
          <Text className="text-sm text-emerald-800">
            You're all set — keep tracking on and stay clear of flagged zones.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
