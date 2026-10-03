import { t } from '../i18n';
import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ErrorState, Loading } from '../components/States';
import { useAuth } from '../context/AuthContext';
import AdminDashboard from '../admin/AdminDashboard';
import AdminLoginScreen from '../admin/AdminLoginScreen';
import AdminSettingsScreen from '../admin/AdminSettingsScreen';
import LocationsScreen from '../admin/LocationsScreen';
import NotificationsScreen from '../admin/NotificationsScreen';
import SafetyZonesManagementScreen from '../admin/SafetyZonesManagementScreen';
import SOSManagementScreen from '../admin/SOSManagementScreen';
import TouristsScreen from '../admin/TouristsScreen';
import TripsScreen from '../admin/TripsScreen';
import UsersScreen from '../admin/UsersScreen';
import { ADMIN_LOGIN_ROUTE, ADMIN_ROUTES } from '../admin/routes';
import { colors, isLight } from '../utils/constants';

const Stack = createNativeStackNavigator();

const COMPONENTS = {
  AdminDashboard,
  AdminUsers: UsersScreen,
  AdminTourists: TouristsScreen,
  AdminTrips: TripsScreen,
  AdminLocations: LocationsScreen,
  AdminSOS: SOSManagementScreen,
  AdminZones: SafetyZonesManagementScreen,
  AdminNotifications: NotificationsScreen,
  AdminSettings: AdminSettingsScreen,
};

const theme = {
  ...DarkTheme,
  dark: !isLight,
  colors: { ...DarkTheme.colors, background: colors.bg, card: colors.bg, border: colors.border, primary: colors.accent, text: colors.text },
};

const origin = typeof window !== 'undefined' && window.location ? window.location.origin : '';

const linking = {
  prefixes: origin ? [origin] : [],
  config: {
    screens: {
      [ADMIN_LOGIN_ROUTE.name]: ADMIN_LOGIN_ROUTE.path,
      ...Object.fromEntries(ADMIN_ROUTES.map((r) => [r.name, r.path])),
    },
  },
};

function Centered({ children }) {
  return <View style={styles.centered}>{children}</View>;
}

export default function AdminNavigator() {
  const { user, booting, bootError, retry, logout } = useAuth();
  const isAdmin = !!user && user.role === 'admin';
  const wrongRole = !!user && !isAdmin;

  useEffect(() => {
    if (wrongRole) logout();
  }, [wrongRole, logout]);

  const screens = useMemo(
    () => ADMIN_ROUTES.map((r) => <Stack.Screen key={r.name} name={r.name} component={COMPONENTS[r.name]} />),
    [],
  );

  if (booting || wrongRole) {
    return <Centered><Loading label={t('Starting the administrator console...')} /></Centered>;
  }
  if (bootError) {
    return <Centered><ErrorState message={bootError} onRetry={retry} /></Centered>;
  }

  return (
    <NavigationContainer
      linking={linking}
      theme={theme}
      fallback={<Centered><Loading /></Centered>}
      documentTitle={{ formatter: () => 'TravelGuardian360 Administrator Console' }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'none', contentStyle: { backgroundColor: colors.bg } }}>
        {isAdmin ? screens : <Stack.Screen name={ADMIN_LOGIN_ROUTE.name} component={AdminLoginScreen} />}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, minHeight: '100vh', backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
});
