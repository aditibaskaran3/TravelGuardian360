import { t } from '../i18n';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Button from '../components/Button';
import Card from '../components/Card';
import { SosChip } from '../components/EmergencyButton';
import { Avatar, IconButton } from '../components/Header';
import Icon from '../components/Icon';
import MapView from '../components/MapView';
import NotificationItem from '../components/NotificationItem';
import ScreenContainer, { Section } from '../components/ScreenContainer';
import { InlineMessage } from '../components/States';
import StatusBadge from '../components/StatusBadge';
import WeatherCard from '../components/WeatherCard';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { useApi } from '../hooks/useApi';
import { useSettings } from '../hooks/useSettings';
import { useWeather } from '../hooks/useWeather';
import { notificationsApi, tripsApi, zonesApi } from '../services/touristService';
import { ZONE_META, colors } from '../utils/constants';
import { coords, firstName, formatDate, greeting, todayISO } from '../utils/format';

const STATUS_ICON = { safe: 'shield', caution: 'alert-circle', high_risk: 'alert-octagon' };

const SOURCE_NOTE = {
  device: t('Live location'),
  last_known: t('Using last shared location'),
  trip: t('Showing your trip destination'),
  default: t('Location unavailable'),
};

function daysBetween(a, b) {
  return Math.round((new Date(`${b}T00:00:00`) - new Date(`${a}T00:00:00`)) / 86400000);
}

function tripProgress(trip) {
  const today = todayISO();
  const total = daysBetween(trip.start_date, trip.end_date) + 1;
  if (trip.status === 'active') {
    const day = Math.min(total, Math.max(1, daysBetween(trip.start_date, today) + 1));
    const left = Math.max(0, daysBetween(today, trip.end_date));
    return { text: t('Day {day} of {total}', { day, total }), sub: left === 0 ? t('Ends today') : t(left === 1 ? '1 day left' : '{n} days left', { n: left }), ratio: day / total };
  }
  return { text: t('Not started'), sub: t('Starts {date}', { date: formatDate(trip.start_date) }), ratio: 0 };
}

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { position, status: locStatus, refresh: refreshLocation } = useLocation();
  const { settings } = useSettings();
  const [refreshing, setRefreshing] = useState(false);

  const lat = position ? position.latitude : null;
  const lon = position ? position.longitude : null;
  const safety = useApi(() => zonesApi.status(lat, lon), [lat == null ? null : lat.toFixed(3), lon == null ? null : lon.toFixed(3)], { enabled: lat != null });
  const trip = useApi(tripsApi.active);
  const alerts = useApi(() => notificationsApi.list(3));
  const unread = useApi(notificationsApi.unread);
  const weather = useWeather(position);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshLocation(), trip.reload({ silent: true }), alerts.reload({ silent: true }), unread.reload({ silent: true }), weather.reload({ silent: true })]);
    await safety.reload({ silent: true });
    setRefreshing(false);
  }, [refreshLocation, trip, alerts, unread, weather, safety]);

  const status = safety.data ? safety.data.status : 'safe';
  const meta = ZONE_META[status];
  const markers = useMemo(
    () => (position ? [{ id: 'me', latitude: lat, longitude: lon, self: true, title: t('You are here'), subtitle: position.label || coords(lat, lon) }] : []),
    [position, lat, lon],
  );
  const zones = useMemo(
    () => (safety.data ? safety.data.nearby.filter((z) => z.distance_m < 5000).map((z) => ({ ...z, color: ZONE_META[z.zone_type].color })) : []),
    [safety.data],
  );

  const activeTrip = trip.data;
  const progress = activeTrip ? tripProgress(activeTrip) : null;
  const items = alerts.data || [];

  return (
    <ScreenContainer
      tabBar
      refreshing={refreshing}
      onRefresh={onRefresh}
      header={
        <View style={styles.header}>
          <Pressable onPress={() => navigation.navigate('Profile')} accessibilityLabel={t('Open profile')}>
            <Avatar name={user.full_name} uri={user.avatar_url} size={48} />
          </Pressable>
          <View style={styles.greeting}>
            <Text style={styles.hello}>{greeting()}</Text>
            <Text style={styles.name} numberOfLines={1}>{firstName(user.full_name)}</Text>
          </View>
          <IconButton icon="bell" label={t('Notifications')} badge={unread.data ? unread.data.count : 0} onPress={() => navigation.navigate('Notifications')} />
        </View>
      }
    >
      <Text style={styles.tagline}>{t('Stay safe during your journey.')}</Text>

      <Section>
        <View style={[styles.safety, { backgroundColor: meta.soft, borderColor: `${meta.color}55` }]}>
          <View style={styles.safetyTop}>
            <View style={[styles.safetyIcon, { backgroundColor: meta.color }]}>
              <Icon name={STATUS_ICON[status]} size={26} color="#0A1020" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.safetyLabel}>{t('Current safety status')}</Text>
              {safety.loading && !safety.data ? (
                <Text style={styles.safetyValue}>{t('Checking…')}</Text>
              ) : (
                <Text style={[styles.safetyValue, { color: meta.color }]}>{safety.data ? safety.data.label : t('Unknown')}</Text>
              )}
            </View>
            {safety.data ? (
              <View style={styles.levelBox}>
                <Text style={[styles.levelNumber, { color: meta.color }]}>{safety.data.safety_level}</Text>
                <Text style={styles.levelCaption}>{t('Safety level')}</Text>
              </View>
            ) : null}
          </View>
          {safety.data ? (
            <View style={styles.meter}>
              <View style={[styles.meterFill, { width: `${safety.data.safety_level}%`, backgroundColor: meta.color }]} />
            </View>
          ) : null}
          <Text style={styles.safetyMessage}>
            {safety.error ? t('Safety information could not be loaded. Pull down to retry.') : safety.data ? safety.data.message : t('Looking up safety information for your area.')}
          </Text>
          {safety.data && safety.data.zone ? (
            <Text style={styles.zoneName}>{safety.data.zone.name}{safety.data.zone.city ? ` · ${safety.data.zone.city}` : ''}</Text>
          ) : null}
          <View style={styles.safetyFoot}>
            <Icon name="map-pin" size={14} color={colors.textSoft} />
            <Text style={styles.footText} numberOfLines={1}>{position ? position.label || coords(lat, lon) : t('Locating…')}</Text>
            <View style={[styles.availability, position && position.source !== 'device' && { backgroundColor: colors.cautionSoft }]}>
              <View style={[styles.availabilityDot, { backgroundColor: position && position.source === 'device' ? colors.safe : colors.caution }]} />
              <Text style={styles.availabilityText}>{position ? SOURCE_NOTE[position.source] : t('Locating')}</Text>
            </View>
          </View>
        </View>
      </Section>

      <Section>
        <Card padded={false} style={styles.mapCard}>
          <View style={styles.mapHead}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{t('Current Location')}</Text>
              <Text style={styles.cardSub} numberOfLines={1}>{position ? position.label || t('Resolving address…') : t('Finding you…')}</Text>
            </View>
            <Pressable onPress={refreshLocation} hitSlop={10} accessibilityLabel={t('Update location')} style={styles.smallButton}>
              <Icon name="crosshair" size={16} color={colors.accent} />
            </Pressable>
          </View>
          {position ? (
            <MapView center={{ latitude: lat, longitude: lon }} markers={markers} zones={zones} height={230} zoom={15} style={styles.map} />
          ) : (
            <View style={[styles.map, styles.mapLoading]}><Text style={styles.cardSub}>{locStatus === 'loading' ? t('Finding your location…') : t('Map unavailable')}</Text></View>
          )}
          <View style={styles.mapFoot}>
            <View style={styles.youDot} />
            <Text style={styles.you}>{t('You are here')}</Text>
            <Text style={styles.coords}>{position ? coords(lat, lon) : ''}</Text>
          </View>
          {position && position.source !== 'device' ? (
            <InlineMessage tone="warn" style={styles.mapWarn}>
              {t('Your device position is not available. Allow location access in the browser to see your live position.')}
            </InlineMessage>
          ) : null}
        </Card>
      </Section>

      <Section>
        <Text style={styles.sectionTitle}>{t('Active Trip')}</Text>
        {trip.loading && !activeTrip ? (
          <Card><Text style={styles.cardSub}>{t('Loading your trip…')}</Text></Card>
        ) : trip.error ? (
          <Card><Text style={styles.cardSub}>{trip.error}</Text></Card>
        ) : activeTrip ? (
          <Card onPress={() => navigation.navigate('Trip')}>
            <View style={styles.tripTop}>
              <View style={styles.tripIcon}><Icon name="map" size={20} color={colors.accent} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.tripDest} numberOfLines={1}>{activeTrip.destination}</Text>
                <Text style={styles.cardSub}>{formatDate(activeTrip.start_date)} – {formatDate(activeTrip.end_date)}</Text>
              </View>
              <StatusBadge status={activeTrip.status} />
            </View>
            <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.round(progress.ratio * 100)}%` }]} /></View>
            <View style={styles.tripFoot}>
              <View style={styles.tripStat}>
                <Text style={styles.statLabel}>{t('Travel status')}</Text>
                <Text style={styles.statValue}>{progress.text}</Text>
                <Text style={styles.statSub}>{progress.sub}</Text>
              </View>
              <View style={[styles.tripStat, { flex: 1.3 }]}>
                <Text style={styles.statLabel}>{t('Current location')}</Text>
                <Text style={styles.statValue} numberOfLines={2}>{position ? position.label || coords(lat, lon) : '—'}</Text>
              </View>
            </View>
          </Card>
        ) : (
          <Card>
            <View style={styles.noTrip}>
              <View style={styles.tripIcon}><Icon name="briefcase" size={20} color={colors.accent} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.tripDest}>{t('No active trip')}</Text>
                <Text style={styles.cardSub}>{t('Plan a trip to keep your itinerary and safety in sync.')}</Text>
              </View>
            </View>
            <Button title={t('Create a trip')} icon="plus" variant="soft" onPress={() => navigation.navigate('Trip', { create: true })} style={{ marginTop: 14 }} />
          </Card>
        )}
      </Section>

      <Section>
        <SosChip onPress={() => navigation.navigate('SOS')} />
        <View style={styles.grid}>
          {[
            { icon: 'briefcase', label: t('Trip Mode'), go: () => navigation.navigate('Trip') },
            { icon: 'navigation', label: t('Live Location'), go: () => navigation.navigate('Location') },
            { icon: 'users', label: t('Contacts'), go: () => navigation.navigate('EmergencyContacts') },
            { icon: 'heart', label: t('Medical ID'), go: () => navigation.navigate('MedicalID') },
            { icon: 'credit-card', label: t('Tourist ID'), go: () => navigation.navigate('TouristID') },
            { icon: 'shield', label: t('Safety Zones'), go: () => navigation.navigate('SafetyZones') },
            { icon: 'cloud', label: t('Weather'), go: () => navigation.navigate('Weather') },
            { icon: 'grid', label: t('More'), go: () => navigation.navigate('More') },
          ].map((a) => (
            <Pressable key={a.label} onPress={a.go} style={({ pressed }) => [styles.tile, pressed && { opacity: 0.8 }]}>
              <View style={styles.tileIcon}><Icon name={a.icon} size={20} color={colors.accent} /></View>
              <Text style={styles.tileLabel} numberOfLines={1}>{a.label}</Text>
            </Pressable>
          ))}
        </View>
      </Section>

      <Section>
        <Text style={styles.sectionTitle}>{t('Weather')}</Text>
        <WeatherCard weather={weather.weather} loading={weather.loading} error={weather.error} onRefresh={weather.refresh} unit={settings.temperature_unit} />
      </Section>

      <Section>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>{t('Recent Alerts')}</Text>
          <Pressable onPress={() => navigation.navigate('Notifications')}><Text style={styles.link}>{t('View all')}</Text></Pressable>
        </View>
        <Card style={{ paddingVertical: 4 }}>
          {alerts.loading && !alerts.data ? (
            <Text style={[styles.cardSub, { padding: 12 }]}>{t('Loading alerts…')}</Text>
          ) : alerts.error ? (
            <Text style={[styles.cardSub, { padding: 12 }]}>{alerts.error}</Text>
          ) : items.length === 0 ? (
            <Text style={[styles.cardSub, { padding: 12 }]}>{t('You are all caught up. New alerts will appear here.')}</Text>
          ) : (
            items.map((n, i) => (
              <View key={n.id} style={i > 0 && styles.divider}>
                <NotificationItem item={n} compact onPress={() => navigation.navigate('Notifications')} />
              </View>
            ))
          )}
        </Card>
      </Section>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  greeting: { flex: 1 },
  hello: { color: colors.muted, fontSize: 13 },
  name: { color: colors.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.4 },
  tagline: { color: colors.muted, fontSize: 14, marginBottom: 16 },
  safety: { borderRadius: 22, borderWidth: 1, padding: 18 },
  safetyTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  safetyIcon: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  safetyLabel: { color: colors.textSoft, fontSize: 12, fontWeight: '600' },
  safetyValue: { color: colors.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.5, marginTop: 1 },
  levelBox: { alignItems: 'flex-end' },
  levelNumber: { fontSize: 26, fontWeight: '800' },
  levelCaption: { color: colors.muted, fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6 },
  meter: { height: 6, borderRadius: 3, backgroundColor: colors.track, marginTop: 16, overflow: 'hidden' },
  meterFill: { height: 6, borderRadius: 3 },
  safetyMessage: { color: colors.text, fontSize: 14, lineHeight: 20, marginTop: 14 },
  zoneName: { color: colors.textSoft, fontSize: 12, marginTop: 6, fontWeight: '600' },
  safetyFoot: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.trackLine },
  footText: { color: colors.textSoft, fontSize: 12, flex: 1 },
  availability: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.safeSoft, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  availabilityDot: { width: 6, height: 6, borderRadius: 3 },
  availabilityText: { color: colors.textSoft, fontSize: 10, fontWeight: '600' },
  mapCard: { overflow: 'hidden' },
  mapHead: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, paddingBottom: 12 },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  cardSub: { color: colors.muted, fontSize: 13, marginTop: 2 },
  smallButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  map: { marginHorizontal: 12, borderRadius: 14 },
  mapLoading: { height: 230, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.mapBg },
  mapFoot: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16, paddingTop: 12 },
  youDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent },
  you: { color: colors.text, fontSize: 14, fontWeight: '700', flex: 1 },
  coords: { color: colors.muted, fontSize: 12 },
  mapWarn: { marginHorizontal: 12, marginBottom: 12 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '700', marginBottom: 12 },
  link: { color: colors.accent, fontSize: 13, fontWeight: '600', marginBottom: 12 },
  tripTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tripIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  tripDest: { color: colors.text, fontSize: 16, fontWeight: '700' },
  progressTrack: { height: 5, borderRadius: 3, backgroundColor: colors.border, marginTop: 16, overflow: 'hidden' },
  progressFill: { height: 5, borderRadius: 3, backgroundColor: colors.accent },
  tripFoot: { flexDirection: 'row', gap: 14, marginTop: 14 },
  tripStat: { flex: 1 },
  statLabel: { color: colors.muted, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { color: colors.text, fontSize: 14, fontWeight: '700', marginTop: 4 },
  statSub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  noTrip: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, marginHorizontal: -4 },
  tile: { width: '25%', padding: 4, alignItems: 'center', cursor: 'pointer' },
  tileIcon: { width: '100%', height: 56, borderRadius: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  tileLabel: { color: colors.textSoft, fontSize: 11, fontWeight: '600', marginTop: 7, marginBottom: 8 },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
});
