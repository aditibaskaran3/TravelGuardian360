import React from 'react';
import { ScrollView, Text, View } from 'react-native';

export default function NotificationsScreen() {
  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerClassName="p-4 gap-3">
      <View className="rounded-2xl bg-white p-4">
        <Text className="text-base font-semibold text-slate-900">Travel updates</Text>
        <Text className="mt-1 text-sm text-slate-500">
          You’ll see important travel alerts, safety updates, and reminders here.
        </Text>
      </View>

      <View className="rounded-2xl bg-indigo-50 p-4">
        <Text className="text-base font-semibold text-indigo-900">New safety zone nearby</Text>
        <Text className="mt-1 text-sm text-indigo-700">
          A monitored area is active near your current location.
        </Text>
      </View>

      <View className="rounded-2xl bg-emerald-50 p-4">
        <Text className="text-base font-semibold text-emerald-900">Trip reminder</Text>
        <Text className="mt-1 text-sm text-emerald-700">
          Your next check-in is due in 30 minutes.
        </Text>
      </View>
    </ScrollView>
  );
}
