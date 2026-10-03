import { t } from '../i18n';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ErrorState, Loading } from '../components/States';
import { LogoMark } from '../components/Logo';
import { LocationProvider } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import BottomNavigator from './BottomNavigator';
import FamilyScreen from '../screens/FamilyScreen';
import EmergencyContactsScreen from '../screens/EmergencyContactsScreen';
import InfoScreen from '../screens/InfoScreen';
import LoginScreen from '../screens/LoginScreen';
import MedicalIDScreen from '../screens/MedicalIDScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RegisterScreen from '../screens/RegisterScreen';
import SafetyZonesScreen from '../screens/SafetyZonesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SplashScreen from '../screens/SplashScreen';
import TouristIDScreen from '../screens/TouristIDScreen';
import WeatherScreen from '../screens/WeatherScreen';
import { colors, isLight } from '../utils/constants';

const Stack = createNativeStackNavigator();

const theme = {
  ...DarkTheme,
  dark: !isLight,
  colors: { ...DarkTheme.colors, background: colors.bg, card: colors.bg, border: colors.border, primary: colors.accent, text: colors.text },
};

const linking = {
  prefixes: [],
  config: {
    screens: {
      Splash: '',
      Login: 'login',
      Register: 'register',
      Main: { path: 'app', screens: { Home: 'home', Trip: 'trip', Location: 'location', SOS: 'sos', More: 'more' } },
      Notifications: 'notifications',
      EmergencyContacts: 'contacts',
      Family: 'family',
      MedicalID: 'medical-id',
      TouristID: 'tourist-id',
      SafetyZones: 'safety-zones',
      Weather: 'weather',
      Profile: 'profile',
      Settings: 'settings',
      Info: 'info/:category',
    },
  },
};

const screenOptions = { headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: colors.bg } };

export default function AppNavigator() {
  const { user, booting, bootError, retry } = useAuth();

  if (booting || bootError) {
    return (
      <View style={styles.boot}>
        <LogoMark size={64} />
        {bootError ? <ErrorState message={bootError} onRetry={retry} /> : <Loading label={t('Starting TravelGuardian360…')} />}
      </View>
    );
  }

  return (
    <NavigationContainer theme={theme} linking={linking} key={user ? 'in' : 'out'}>
      {user ? (
        <LocationProvider>
          <Stack.Navigator screenOptions={screenOptions}>
            <Stack.Screen name="Main" component={BottomNavigator} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="EmergencyContacts" component={EmergencyContactsScreen} />
            <Stack.Screen name="Family" component={FamilyScreen} />
            <Stack.Screen name="MedicalID" component={MedicalIDScreen} />
            <Stack.Screen name="TouristID" component={TouristIDScreen} />
            <Stack.Screen name="SafetyZones" component={SafetyZonesScreen} />
            <Stack.Screen name="Weather" component={WeatherScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Info" component={InfoScreen} />
          </Stack.Navigator>
        </LocationProvider>
      ) : (
        <Stack.Navigator screenOptions={screenOptions}>
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  boot: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', gap: 20 },
});
