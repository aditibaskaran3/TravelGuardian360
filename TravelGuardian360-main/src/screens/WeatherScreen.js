import { t } from '../i18n';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Card from '../components/Card';
import Chips from '../components/Chips';
import Header from '../components/Header';
import Icon from '../components/Icon';
import ScreenContainer, { Section } from '../components/ScreenContainer';
import WeatherCard from '../components/WeatherCard';
import { useLocation } from '../context/LocationContext';
import { useApi } from '../hooks/useApi';
import { useSettings } from '../hooks/useSettings';
import { useWeather } from '../hooks/useWeather';
import { profileApi, tripsApi } from '../services/touristService';
import { colors } from '../utils/constants';
import { goBack } from '../utils/nav';

export default function WeatherScreen({ navigation }) {
  const { position } = useLocation();
  const trip = useApi(tripsApi.active);
  const { settings, setSettings } = useSettings();
  const [place, setPlace] = useState('here');

  const tripPlace = trip.data && trip.data.destination_lat != null
    ? { latitude: trip.data.destination_lat, longitude: trip.data.destination_lon, name: trip.data.destination }
    : null;
  const target = place === 'trip' && tripPlace ? tripPlace : position;
  const weather = useWeather(target, place === 'trip' && tripPlace ? tripPlace.name : undefined);

  const options = useMemo(
    () => [{ value: 'here', label: t('Current location') }, ...(tripPlace ? [{ value: 'trip', label: t('Trip: {place}', { place: tripPlace.name.split(',')[0] }) }] : [])],
    [tripPlace],
  );

  const setUnit = async (unit) => {
    setSettings({ ...settings, temperature_unit: unit });
    try {
      await profileApi.saveSettings({ temperature_unit: unit });
    } catch {
      // The choice still applies for this session.
    }
  };

  return (
    <ScreenContainer
      refreshing={false}
      onRefresh={weather.refresh}
      header={<Header title={t('Weather')} subtitle={t('Conditions where you are')} onBack={() => goBack(navigation)} />}
    >
      {options.length > 1 ? <Chips options={options} value={place} onChange={setPlace} /> : null}
      <Section>
        <WeatherCard weather={weather.weather} loading={weather.loading} error={weather.error} onRefresh={weather.refresh} unit={settings.temperature_unit} />
      </Section>

      <Section>
        <Text style={styles.title}>{t('Temperature unit')}</Text>
        <Chips
          options={[{ value: 'c', label: t('Celsius (°C)') }, { value: 'f', label: t('Fahrenheit (°F)') }]}
          value={settings.temperature_unit}
          onChange={setUnit}
        />
      </Section>

      {weather.weather && weather.weather.temperature >= 38 ? (
        <Card style={styles.tip}>
          <Icon name="alert-triangle" size={18} color={colors.caution} />
          <Text style={styles.tipText}>{t('It is very hot. Drink water regularly and avoid long outdoor stretches in the afternoon.')}</Text>
        </Card>
      ) : null}
      {weather.weather && ['rain', 'storm', 'drizzle'].includes(weather.weather.icon) ? (
        <Card style={styles.tip}>
          <Icon name="cloud-rain" size={18} color={colors.info} />
          <Text style={styles.tipText}>{t('Wet weather expected. Carry a rain cover and allow extra travel time.')}</Text>
        </Card>
      ) : null}
      <View style={{ height: 8 }} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 15, fontWeight: '700', marginBottom: 10 },
  tip: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 10 },
  tipText: { color: colors.textSoft, fontSize: 13, lineHeight: 19, flex: 1 },
});
