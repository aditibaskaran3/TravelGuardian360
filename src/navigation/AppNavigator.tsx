/**
 * Stack shown to authenticated users. New feature modules (Tracking, SOS,
 * Geo-fencing, etc.) register their screens here.
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/HomeScreen';
import TrackingScreen from '../features/tracking/screens/TrackingScreen';
import type { AppStackParamList } from './types';

const Stack = createNativeStackNavigator<AppStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'TravelGuardian360' }}
      />
      <Stack.Screen
        name="Tracking"
        component={TrackingScreen}
        options={{ title: 'Live Tracking' }}
      />
    </Stack.Navigator>
  );
}
