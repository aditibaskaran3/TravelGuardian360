import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import Card from './Card';
import Icon from './Icon';
import { colors } from '../utils/constants';
import { timeAgo } from '../utils/format';
import { t } from '../i18n';

const ICONS = {
  clear: 'sun', partly: 'cloud', cloudy: 'cloud', fog: 'align-justify', drizzle: 'cloud-drizzle',
  rain: 'cloud-rain', snow: 'cloud-snow', storm: 'cloud-lightning',
};

export const toDisplayTemp = (celsius, unit) => (unit === 'f' ? Math.round(celsius * 9 / 5 + 32) : Math.round(celsius));

export default function WeatherCard({ weather, loading, error, onRefresh, unit = 'c', style }) {
  return (
    <Card style={style}>
      {loading && !weather ? (
        <View style={styles.state}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.muted}>{t('Checking the weather…')}</Text>
        </View>
      ) : !weather ? (
        <View style={styles.state}>
          <Icon name="cloud-off" size={26} color={colors.muted} />
          <Text style={styles.muted}>{error || t('Weather is unavailable right now.')}</Text>
          {onRefresh ? (
            <Pressable onPress={onRefresh}>
              <Text style={styles.retry}>{t('Try again')}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <>
          <View style={styles.top}>
            <View style={styles.iconWrap}>
              <Icon name={ICONS[weather.icon] || 'cloud'} size={30} color={colors.accent} />
            </View>
            <View style={styles.main}>
              <Text style={styles.temp}>{toDisplayTemp(weather.temperature, unit)}°<Text style={styles.unit}>{unit === 'f' ? t('F') : t('C')}</Text></Text>
              <Text style={styles.condition}>{weather.condition}</Text>
            </View>
            {onRefresh ? (
              <Pressable onPress={onRefresh} hitSlop={10} accessibilityLabel={t('Refresh weather')}>
                {loading ? <ActivityIndicator size="small" color={colors.accent} /> : <Icon name="refresh-cw" size={18} color={colors.muted} />}
              </Pressable>
            ) : null}
          </View>
          <View style={styles.stats}>
            <Stat icon="droplet" label={t('Humidity')} value={`${weather.humidity}%`} />
            <Stat icon="wind" label={t('Wind')} value={`${Math.round(weather.wind_speed)} km/h`} />
            <Stat icon="thermometer" label={t('Feels like')} value={`${toDisplayTemp(weather.feels_like ?? weather.temperature, unit)}°`} />
          </View>
          <View style={styles.footer}>
            <Icon name="map-pin" size={13} color={colors.muted} />
            <Text style={styles.place} numberOfLines={1}>{weather.location_name}</Text>
            <Text style={styles.muted}>{weather.stale ? t('Last updated {time}', { time: timeAgo(weather.fetched_at) }) : t('Updated just now')}</Text>
          </View>
        </>
      )}
    </Card>
  );
}

function Stat({ icon, label, value }) {
  return (
    <View style={styles.stat}>
      <Icon name={icon} size={15} color={colors.muted} />
      <View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  state: { alignItems: 'center', gap: 8, paddingVertical: 14 },
  muted: { color: colors.muted, fontSize: 12, textAlign: 'center' },
  retry: { color: colors.accent, fontWeight: '600', fontSize: 13 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconWrap: { width: 56, height: 56, borderRadius: 18, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  main: { flex: 1 },
  temp: { color: colors.text, fontSize: 34, fontWeight: '800', letterSpacing: -1 },
  unit: { fontSize: 18, color: colors.muted, fontWeight: '600' },
  condition: { color: colors.textSoft, fontSize: 14, marginTop: -2 },
  stats: { flexDirection: 'row', marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.border },
  stat: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  statValue: { color: colors.text, fontSize: 14, fontWeight: '700' },
  statLabel: { color: colors.muted, fontSize: 11 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  place: { color: colors.textSoft, fontSize: 12, flex: 1 },
});
