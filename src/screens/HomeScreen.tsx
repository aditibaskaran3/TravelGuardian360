import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { ActivityIndicator, Button, Card, Text } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import { fetchDemoPost } from '../lib/api';

const LAUNCH_COUNT_KEY = '@tg360/launch_count';

export default function HomeScreen() {
  const [launchCount, setLaunchCount] = useState<number | null>(null);

  // AsyncStorage: persist and read a simple launch counter.
  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(LAUNCH_COUNT_KEY);
      const next = (raw ? parseInt(raw, 10) : 0) + 1;
      await AsyncStorage.setItem(LAUNCH_COUNT_KEY, String(next));
      setLaunchCount(next);
    })();
  }, []);

  // React Query + Axios: fetch a demo post.
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['demo-post', 1],
    queryFn: () => fetchDemoPost(1),
  });

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerClassName="p-4 gap-4">
      {/* NativeWind: styled header */}
      <View className="rounded-2xl bg-indigo-600 p-5">
        <Text variant="headlineSmall" style={{ color: 'white', fontWeight: '700' }}>
          TravelGuardian360
        </Text>
        <Text style={{ color: 'white', marginTop: 4 }}>
          Launch #{launchCount ?? '…'} (persisted via AsyncStorage)
        </Text>
      </View>

      {/* React Native Paper Card + Material icons */}
      <Card>
        <Card.Title title="Demo request" subtitle="Axios + React Query" />
        <Card.Content>
          {isLoading ? (
            <ActivityIndicator />
          ) : isError ? (
            <Text style={{ color: 'crimson' }}>Failed to load. Check your connection.</Text>
          ) : (
            <Text variant="titleMedium">{data?.title}</Text>
          )}
        </Card.Content>
        <Card.Actions>
          <Button
            mode="contained"
            icon="refresh"
            loading={isFetching}
            onPress={() => refetch()}
          >
            Refetch
          </Button>
        </Card.Actions>
      </Card>
    </ScrollView>
  );
}
