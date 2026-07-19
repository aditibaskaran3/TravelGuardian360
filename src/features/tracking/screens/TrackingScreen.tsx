/**
 * Live GPS Tracking screen.
 *
 * Shows the current position, accuracy, speed, distance traveled and a list of
 * recent points, with start/stop controls. Works today via the mock provider;
 * switches to real device GPS when the native package is installed.
 */
import React from 'react';
import { ScrollView, Text, View } from 'react-native';

import Button from '../../../components/ui/Button';
import { useLocationTracking } from '../hooks/useLocationTracking';
import { USE_MOCK_LOCATION } from '../../../config/env';
import { formatCoord, formatDistance, formatSpeed } from '../../../utils/geo';

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 rounded-2xl bg-white p-4">
      <Text className="text-xs uppercase tracking-wide text-slate-400">{label}</Text>
      <Text className="mt-1 text-lg font-bold text-slate-900">{value}</Text>
    </View>
  );
}

export default function TrackingScreen() {
  const {
    current,
    history,
    distanceMeters,
    error,
    isTracking,
    startTracking,
    stopTracking,
    reset,
  } = useLocationTracking();

  const recent = [...history].reverse().slice(0, 8);

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerClassName="p-4 gap-4">
      {USE_MOCK_LOCATION ? (
        <View className="rounded-xl bg-amber-100 px-4 py-2">
          <Text className="text-xs text-amber-800">
            Simulated GPS (mock). Install geolocation + flip USE_MOCK_LOCATION for real device GPS.
          </Text>
        </View>
      ) : null}

      {/* Current position card */}
      <View className="rounded-2xl bg-indigo-600 p-5">
        <Text className="text-xs font-semibold uppercase tracking-widest text-indigo-200">
          Current position
        </Text>
        {current ? (
          <>
            <Text className="mt-2 text-2xl font-bold text-white">
              {formatCoord(current.latitude)}, {formatCoord(current.longitude)}
            </Text>
            <Text className="mt-1 text-indigo-100">
              Accuracy: {current.accuracy != null ? `${Math.round(current.accuracy)} m` : '—'}
            </Text>
          </>
        ) : (
          <Text className="mt-2 text-lg text-indigo-100">
            {isTracking ? 'Acquiring signal…' : 'Not tracking'}
          </Text>
        )}
      </View>

      {/* Stats */}
      <View className="flex-row gap-3">
        <Stat label="Distance" value={formatDistance(distanceMeters)} />
        <Stat label="Speed" value={formatSpeed(current?.speed ?? null)} />
        <Stat label="Points" value={String(history.length)} />
      </View>

      {error ? (
        <View className="rounded-xl bg-red-100 px-4 py-3">
          <Text className="text-sm text-red-700">{error.message}</Text>
        </View>
      ) : null}

      {/* Controls */}
      <View className="gap-3">
        {isTracking ? (
          <Button label="Stop tracking" variant="secondary" onPress={stopTracking} />
        ) : (
          <Button label="Start tracking" onPress={() => startTracking()} />
        )}
        {history.length > 0 && !isTracking ? (
          <Button label="Clear track" variant="ghost" onPress={reset} />
        ) : null}
      </View>

      {/* Recent points */}
      {recent.length > 0 ? (
        <View className="rounded-2xl bg-white p-4">
          <Text className="mb-2 text-base font-bold text-slate-900">Recent points</Text>
          {recent.map((s) => (
            <View
              key={s.timestamp}
              className="flex-row justify-between border-b border-slate-100 py-2"
            >
              <Text className="text-slate-600">
                {formatCoord(s.latitude)}, {formatCoord(s.longitude)}
              </Text>
              <Text className="text-slate-400">
                {new Date(s.timestamp).toLocaleTimeString()}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}
