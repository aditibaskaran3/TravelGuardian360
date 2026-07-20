/**
 * Authenticated stack.
 *
 * `Main` is the bottom-tab shell (Home / Track / SOS / Zones / More). The
 * remaining entries are detail screens pushed on top of the tabs. Global
 * monitors (geo-fence + behaviour) are mounted here so they run for the whole
 * authenticated session regardless of the active tab.
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import MainTabs from './MainTabs';
import SafetyScoreScreen from '../features/safety/screens/SafetyScoreScreen';
import BehaviorScreen from '../features/behavior/screens/BehaviorScreen';
import ContactsScreen from '../features/contacts/screens/ContactsScreen';
import ContactFormScreen from '../features/contacts/screens/ContactFormScreen';
import LanguageScreen from '../features/settings/screens/LanguageScreen';
import ProfileScreen from '../features/settings/screens/ProfileScreen';
import NotificationsScreen from '../features/settings/screens/NotificationsScreen';
import TravelDocumentsScreen from '../features/settings/screens/TravelDocumentsScreen';
import TripToolsScreen from '../features/settings/screens/TripToolsScreen';
import { useGeofenceMonitor } from '../features/geofencing/hooks/useGeofenceMonitor';
import { useBehaviorMonitor } from '../features/behavior/hooks/useBehaviorMonitor';
import type { AppStackParamList } from './types';

const Stack = createNativeStackNavigator<AppStackParamList>();

export default function AppNavigator() {
  // Run zone monitoring + behaviour analysis for the whole authenticated session.
  useGeofenceMonitor();
  useBehaviorMonitor();

  return (
    <Stack.Navigator>
      <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="SafetyScore"
        component={SafetyScoreScreen}
        options={{ title: 'Safety Score' }}
      />
      <Stack.Screen
        name="Behavior"
        component={BehaviorScreen}
        options={{ title: 'Behaviour Analysis' }}
      />
      <Stack.Screen
        name="Contacts"
        component={ContactsScreen}
        options={{ title: 'Emergency Contacts' }}
      />
      <Stack.Screen
        name="ContactForm"
        component={ContactFormScreen}
        options={{ title: 'Contact' }}
      />
      <Stack.Screen name="Language" component={LanguageScreen} options={{ title: 'Language' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Traveller Profile' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
      <Stack.Screen name="TravelDocuments" component={TravelDocumentsScreen} options={{ title: 'Travel Documents' }} />
      <Stack.Screen name="TripTools" component={TripToolsScreen} options={{ title: 'Trip Tools' }} />
    </Stack.Navigator>
  );
}
