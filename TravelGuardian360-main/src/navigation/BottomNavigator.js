import { t } from '../i18n';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '../components/Icon';
import HomeScreen from '../screens/HomeScreen';
import LocationScreen from '../screens/LocationScreen';
import MoreScreen from '../screens/MoreScreen';
import SOSScreen from '../screens/SOSScreen';
import TripScreen from '../screens/TripScreen';
import { colors } from '../utils/constants';

const Tab = createBottomTabNavigator();

const TABS = {
  Home: { icon: 'home', label: t('Home') },
  Trip: { icon: 'briefcase', label: t('Trip') },
  Location: { icon: 'navigation', label: t('Location') },
  SOS: { icon: 'alert-triangle', label: t('SOS') },
  More: { icon: 'grid', label: t('More') },
};

function TabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const meta = TABS[route.name];
        const press = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };
        if (route.name === 'SOS') {
          return (
            <Pressable key={route.key} onPress={press} style={styles.sosSlot} accessibilityLabel={t('SOS')}>
              <View style={[styles.sos, focused && styles.sosFocused]}>
                <Icon name={meta.icon} size={24} color="#fff" />
              </View>
              <Text style={[styles.label, { color: colors.danger }]}>{t('SOS')}</Text>
            </Pressable>
          );
        }
        return (
          <Pressable key={route.key} onPress={press} style={styles.item} accessibilityLabel={meta.label}>
            <Icon name={meta.icon} size={21} color={focused ? colors.accent : colors.muted} />
            <Text style={[styles.label, focused && { color: colors.accent }]}>{meta.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function BottomNavigator() {
  return (
    <Tab.Navigator tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Trip" component={TripScreen} />
      <Tab.Screen name="Location" component={LocationScreen} />
      <Tab.Screen name="SOS" component={SOSScreen} />
      <Tab.Screen name="More" component={MoreScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'flex-end',
    backgroundColor: colors.tabBar, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8, paddingHorizontal: 6,
  },
  item: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 4, cursor: 'pointer' },
  label: { fontSize: 11, fontWeight: '600', color: colors.muted },
  sosSlot: { flex: 1, alignItems: 'center', gap: 3, marginTop: -26, cursor: 'pointer' },
  sos: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center',
    borderWidth: 4, borderColor: colors.bg,
  },
  sosFocused: { backgroundColor: colors.sosActive },
});
