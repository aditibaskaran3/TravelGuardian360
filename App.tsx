/**
 * TravelGuardian360
 *
 * Provider tree:
 *   SafeAreaProvider > PaperProvider > QueryClientProvider > RootNavigator
 *
 * RootNavigator handles session restore and auth-gated routing.
 *
 * @format
 */

import './global.css';

import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from 'react-native-paper';
import { QueryClientProvider } from '@tanstack/react-query';

import { queryClient } from './src/lib/queryClient';
import RootNavigator from './src/navigation/RootNavigator';

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const paperTheme = isDarkMode ? MD3DarkTheme : MD3LightTheme;

  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <QueryClientProvider client={queryClient}>
          <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
          <RootNavigator />
        </QueryClientProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

export default App;
