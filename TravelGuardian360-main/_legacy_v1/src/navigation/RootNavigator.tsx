/**
 * Top-level navigator. Restores the persisted session on mount, then routes:
 *   hydrating        -> SplashScreen
 *   authenticated    -> AppNavigator
 *   otherwise        -> AuthNavigator
 */
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';

import { useAuthStore } from '../store/authStore';
import { useI18nStore } from '../store/i18nStore';
import SplashScreen from '../components/ui/SplashScreen';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';

export default function RootNavigator() {
  const hydrating = useAuthStore((s) => s.hydrating);
  const status = useAuthStore((s) => s.status);
  const hydrate = useAuthStore((s) => s.hydrate);
  const hydrateLanguage = useI18nStore((s) => s.hydrateLanguage);

  useEffect(() => {
    void hydrateLanguage();
    hydrate();
  }, [hydrate, hydrateLanguage]);

  if (hydrating) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      {status === 'authenticated' ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
