/**
 * Minimal splash shown while the persisted session is being restored.
 */
import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

export default function SplashScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-indigo-600">
      <Text className="mb-4 text-2xl font-bold text-white">TravelGuardian360</Text>
      <ActivityIndicator color="#ffffff" />
    </View>
  );
}
