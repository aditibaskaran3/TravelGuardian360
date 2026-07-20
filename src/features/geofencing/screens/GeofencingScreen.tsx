/**
 * Geo-fencing screen — lists all zones with live status (inside / distance)
 * and highlights the ones to avoid. Reads live proximity from the store, which
 * is updated by the monitor as location samples arrive.
 */
import React, { useEffect } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { useGeofenceStore } from '../../../store/geofenceStore';
import { useLocationTracking } from '../../tracking/hooks/useLocationTracking';
import Button from '../../../components/ui/Button';
import { formatDistance } from '../../../utils/geo';
import type { ZoneProximity, ZoneType } from '../types';

const TYPE_STYLES: Record<ZoneType, { badge: string; label: string }> = {
  safe: { badge: 'bg-emerald-100 text-emerald-700', label: 'Safe' },
  hazardous: { badge: 'bg-amber-100 text-amber-700', label: 'Hazard' },
  restricted: { badge: 'bg-red-100 text-red-700', label: 'Restricted' },
};

function ZoneCard({ item }: { item: ZoneProximity }) {
  const style = TYPE_STYLES[item.zone.type];
  return (
    <View
      className={`rounded-2xl bg-white p-4 ${item.isInside ? 'border-2 border-indigo-500' : ''}`}
    >
      <View className="mb-1 flex-row items-center justify-between">
        <Text className="flex-1 pr-2 text-base font-bold text-slate-900">{item.zone.name}</Text>
        <Text className={`rounded-full px-2 py-0.5 text-xs font-semibold ${style.badge}`}>
          {style.label}
        </Text>
      </View>
      <Text className="mb-2 text-sm text-slate-500">{item.zone.description}</Text>
      <Text className={`text-sm font-medium ${item.isInside ? 'text-indigo-600' : 'text-slate-600'}`}>
        {item.isInside
          ? '● You are inside this zone'
          : `${formatDistance(item.distanceToEdgeMeters)} away`}
      </Text>
    </View>
  );
}

export default function GeofencingScreen() {
  const proximity = useGeofenceStore((s) => s.proximity);
  const zones = useGeofenceStore((s) => s.zones);
  const loadZones = useGeofenceStore((s) => s.loadZones);
  const { isTracking, startTracking } = useLocationTracking();

  useEffect(() => {
    if (zones.length === 0) {
      void loadZones();
    }
  }, [zones.length, loadZones]);

  // Before the first sample, show zones without live distance.
  const rows: ZoneProximity[] =
    proximity.length > 0
      ? proximity
      : zones.map((zone) => ({ zone, isInside: false, distanceToEdgeMeters: 0 }));

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerClassName="p-4 gap-3">
      <View className="rounded-2xl bg-indigo-600 p-5">
        <Text className="text-xs font-semibold uppercase tracking-widest text-indigo-200">
          Geo-fencing
        </Text>
        <Text className="mt-1 text-lg font-bold text-white">
          {isTracking ? 'Monitoring your location' : 'Tracking is off'}
        </Text>
        <Text className="mt-1 text-sm text-indigo-100">
          {proximity.length > 0
            ? 'Distances update live as you move.'
            : 'Start tracking to see live distances and receive zone alerts.'}
        </Text>
      </View>

      {!isTracking ? (
        <Button label="Start tracking" onPress={() => startTracking()} />
      ) : null}

      {rows.map((row) => (
        <ZoneCard key={row.zone.id} item={row} />
      ))}
    </ScrollView>
  );
}
