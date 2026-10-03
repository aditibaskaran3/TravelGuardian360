import React from 'react';
import { Platform, StatusBar, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import AdminNavigator from './src/navigation/AdminNavigator';
import { MOBILE_MAX_WIDTH, colors, isLight } from './src/utils/constants';

const isAdminRoute = () =>
  Platform.OS === 'web' && typeof window !== 'undefined' && /^\/admin(\/|$)/.test(window.location.pathname);

/** On desktop browsers the tourist app is shown as a centred phone-sized column. */
function PhoneFrame({ children }) {
  const { width, height } = useWindowDimensions();
  if (Platform.OS !== 'web' || width <= MOBILE_MAX_WIDTH + 40) {
    return <View style={styles.full}>{children}</View>;
  }
  return (
    <View style={styles.backdrop}>
      <View style={[styles.frame, { height: Math.min(height - 32, 880), width: MOBILE_MAX_WIDTH }]}>{children}</View>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isLight ? 'dark-content' : 'light-content'} backgroundColor={colors.bg} />
      {isAdminRoute() ? (
        <View style={styles.full}>
          <AuthProvider role="admin">
            <AdminNavigator />
          </AuthProvider>
        </View>
      ) : (
        <PhoneFrame>
          <AuthProvider role="user">
            <AppNavigator />
          </AuthProvider>
        </PhoneFrame>
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  full: { flex: 1, backgroundColor: colors.bg },
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgDeep },
  frame: {
    backgroundColor: colors.bg, borderRadius: 34, overflow: 'hidden', borderWidth: 1, borderColor: colors.borderStrong,
    position: 'relative',
  },
});
