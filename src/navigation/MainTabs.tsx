/**
 * Main authenticated experience: a custom bottom-tab shell.
 *
 * Holds the active tab locally and renders the matching screen between a
 * TopBar (with the language chip) and the BottomNavBar. Detail screens
 * (SafetyScore, Behaviour, Contacts, Language) are pushed on top via the stack.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import TopBar from '../components/ui/TopBar';
import BottomNavBar from '../components/ui/BottomNavBar';
import { TABS, type TabKey } from './tabs';
import { useTranslation } from '../i18n/useTranslation';

import HomeScreen from '../screens/HomeScreen';
import TrackingScreen from '../features/tracking/screens/TrackingScreen';
import SosScreen from '../features/sos/screens/SosScreen';
import GeofencingScreen from '../features/geofencing/screens/GeofencingScreen';
import MoreScreen from '../features/settings/screens/MoreScreen';

const SCREENS: Record<TabKey, React.ComponentType> = {
  home: HomeScreen,
  track: TrackingScreen,
  sos: SosScreen,
  zones: GeofencingScreen,
  more: MoreScreen,
};

export default function MainTabs() {
  const [active, setActive] = useState<TabKey>('home');
  const { t } = useTranslation();

  const ActiveScreen = SCREENS[active];
  const title = t(TABS.find((tab) => tab.key === active)!.labelKey);

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top', 'bottom']}>
      <TopBar title={active === 'home' ? t('app.name') : title} />
      <View className="flex-1">
        <ActiveScreen />
      </View>
      <BottomNavBar active={active} onChange={setActive} />
    </SafeAreaView>
  );
}
