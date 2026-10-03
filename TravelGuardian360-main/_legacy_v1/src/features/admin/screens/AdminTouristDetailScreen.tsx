import React from 'react';
import { Text, TextInput, View } from 'react-native';
import { useAdminStore } from '../store/adminStore';
import Button from '../../../components/ui/Button';

export default function AdminTouristDetailScreen() {
  const tourist = useAdminStore((s) => s.tourists.find((item) => item.id === s.selectedTouristId));
  const updateTouristStatus = useAdminStore((s) => s.updateTouristStatus);
  const updateTouristNotes = useAdminStore((s) => s.updateTouristNotes);

  if (!tourist) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 p-6">
        <Text className="text-base text-slate-600">Select a tourist to review their profile.</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50 p-4 gap-4">
      <View className="rounded-2xl bg-white p-4">
        <Text className="text-xl font-semibold text-slate-900">{tourist.fullName}</Text>
        <Text className="mt-1 text-sm text-slate-500">{tourist.country}</Text>
        <Text className="mt-1 text-sm text-slate-500">{tourist.phone}</Text>
        <Text className="mt-3 text-sm text-slate-700">Last seen: {tourist.lastSeen}</Text>
      </View>

      <View className="rounded-2xl bg-white p-4 gap-3">
        <Text className="text-sm font-semibold uppercase tracking-widest text-slate-500">
          Status
        </Text>
        <View className="flex-row gap-2">
          {(['active', 'monitoring', 'flagged', 'resolved'] as const).map((status) => (
            <Button
              key={status}
              label={status}
              variant={tourist.status === status ? 'primary' : 'secondary'}
              onPress={() => updateTouristStatus(tourist.id, status)}
            />
          ))}
        </View>
      </View>

      <View className="rounded-2xl bg-white p-4 gap-2">
        <Text className="text-sm font-semibold uppercase tracking-widest text-slate-500">
          Notes
        </Text>
        <TextInput
          multiline
          numberOfLines={5}
          value={tourist.notes}
          onChangeText={(value) => updateTouristNotes(tourist.id, value)}
          className="min-h-28 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800"
        />
      </View>
    </View>
  );
}
