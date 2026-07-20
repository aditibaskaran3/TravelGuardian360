/**
 * Authenticated landing screen.
 *
 * Displays the user's Digital Tourist ID and profile, and provides logout.
 * Future modules (live tracking, SOS, safety score) will surface their entry
 * points from here.
 */
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import Button from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';
import type { AppStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'Home'>;

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between border-b border-slate-100 py-2.5">
      <Text className="text-slate-500">{label}</Text>
      <Text className="max-w-[60%] text-right font-medium text-slate-900">{value}</Text>
    </View>
  );
}

export default function HomeScreen({ navigation }: Props) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  if (!user) {
    return null;
  }

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerClassName="p-4 gap-4">
      <View className="mt-1">
        <Text className="text-2xl font-bold text-slate-900">
          Hi, {user.fullName.split(' ')[0]} 👋
        </Text>
        <Text className="mt-1 text-slate-500">Stay safe on your travels.</Text>
      </View>

      {/* Digital Tourist ID */}
      <View className="rounded-2xl bg-indigo-600 p-5">
        <Text className="text-xs font-semibold uppercase tracking-widest text-indigo-200">
          Digital Tourist ID
        </Text>
        <Text className="mt-1 text-3xl font-bold tracking-widest text-white">
          {user.touristId}
        </Text>
        <Text className="mt-4 text-lg font-semibold text-white">{user.fullName}</Text>
        <Text className="text-indigo-100">{user.nationality}</Text>
      </View>

      {/* Profile */}
      <View className="rounded-2xl bg-white p-5">
        <Text className="mb-2 text-base font-bold text-slate-900">Profile</Text>
        <InfoRow label="Email" value={user.email} />
        <InfoRow label="Phone" value={user.phone} />
        <InfoRow label="Emergency contact" value={user.emergencyContact.name} />
        <InfoRow label="Emergency phone" value={user.emergencyContact.phone} />
      </View>

      {/* Safety features */}
      <View className="gap-3 rounded-2xl bg-white p-5">
        <Text className="text-base font-bold text-slate-900">Safety</Text>
        <Button label="Live location tracking" onPress={() => navigation.navigate('Tracking')} />
        <Button
          label="Safety zones (geo-fencing)"
          variant="secondary"
          onPress={() => navigation.navigate('Geofencing')}
        />
      </View>

      <View className="mt-2">
        <Button label="Log out" variant="secondary" onPress={() => logout()} />
      </View>
    </ScrollView>
  );
}
