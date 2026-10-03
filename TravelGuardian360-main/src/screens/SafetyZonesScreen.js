import { t } from '../i18n';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Card from '../components/Card';
import Chips from '../components/Chips';
import Header from '../components/Header';
import MapView from '../components/MapView';
import ScreenContainer, { Section } from '../components/ScreenContainer';
import { EmptyState, ErrorState, Loading } from '../components/States';
import StatusBadge from '../components/StatusBadge';
import { useLocation } from '../context/LocationContext';
import { useApi } from '../hooks/useApi';
import { zonesApi } from '../services/touristService';
import { ZONE_META, colors } from '../utils/constants';
import { distanceLabel } from '../utils/format';
import { distanceMeters } from '../utils/geo';
import { goBack } from '../utils/nav';

const FILTERS = [
  { value: 'all', label: t('All zones') },
  { value: 'safe', label: t('Safe') },
  { value: 'caution', label: t('Caution') },
  { value: 'high_risk', label: t('High Risk') },
];

export default function SafetyZonesScreen({ navigation }) {
  const { position } = useLocation();
  const zones = useApi(zonesApi.list);
  const lat = position ? position.latitude : null;
  const lon = position ? position.longitude : null;
  const current = useApi(() => zonesApi.status(lat, lon), [lat == null ? null : lat.toFixed(3), lon == null ? null : lon.toFixed(3)], { enabled: lat != null });
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  const rows = useMemo(() => {
    const list = (zones.data || []).map((z) => ({ ...z, distance: lat != null ? distanceMeters(lat, lon, z.latitude, z.longitude) : null }));
    const filtered = filter === 'all' ? list : list.filter((z) => z.zone_type === filter);
    return filtered.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
  }, [zones.data, filter, lat, lon]);

  const mapZones = useMemo(() => rows.map((z) => ({ ...z, color: ZONE_META[z.zone_type].color })), [rows]);
  const markers = useMemo(() => {
    const m = [];
    if (lat != null) m.push({ id: 'me', latitude: lat, longitude: lon, self: true, title: t('You are here') });
    const z = rows.find((r) => r.id === selected);
    if (z) m.push({ id: `z${z.id}`, latitude: z.latitude, longitude: z.longitude, color: ZONE_META[z.zone_type].color, title: z.name, subtitle: z.city });
    return m;
  }, [lat, lon, rows, selected]);

  const status = current.data;
  const meta = status ? ZONE_META[status.status] : null;
  const center = (() => {
    const z = rows.find((r) => r.id === selected);
    if (z) return { latitude: z.latitude, longitude: z.longitude };
    return position ? { latitude: lat, longitude: lon } : rows[0] ? { latitude: rows[0].latitude, longitude: rows[0].longitude } : undefined;
  })();

  return (
    <ScreenContainer
      refreshing={false}
      onRefresh={() => Promise.all([zones.reload({ silent: true }), current.reload({ silent: true })])}
      header={<Header title={t('Safety Zones')} subtitle={t('Know the area before you go')} onBack={() => goBack(navigation)} />}
    >
      {status ? (
        <View style={[styles.now, { backgroundColor: meta.soft, borderColor: `${meta.color}55` }]}>
          <View style={[styles.nowDot, { backgroundColor: meta.color }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.nowLabel}>{t('Where you are now')}</Text>
            <Text style={[styles.nowValue, { color: meta.color }]}>{status.label}{status.zone ? ` · ${status.zone.name}` : ''}</Text>
          </View>
        </View>
      ) : null}

      {center ? (
        <Section>
          <MapView center={center} zoom={selected ? 15 : 13} markers={markers} zones={mapZones} height={240} />
        </Section>
      ) : null}

      <Chips options={FILTERS} value={filter} onChange={(v) => { setFilter(v); setSelected(null); }} />

      {zones.loading && !zones.data ? (
        <Loading label={t('Loading safety zones…')} />
      ) : zones.error && !zones.data ? (
        <ErrorState message={zones.error} onRetry={zones.reload} />
      ) : rows.length === 0 ? (
        <EmptyState icon="shield" title={t('No zones to show')} message={t('Try a different filter.')} />
      ) : (
        rows.map((z) => {
          const m = ZONE_META[z.zone_type];
          return (
            <Card key={z.id} onPress={() => setSelected(z.id === selected ? null : z.id)} style={[styles.zone, selected === z.id && { borderColor: m.color }]}>
              <View style={styles.top}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{z.name}</Text>
                  <Text style={styles.muted}>{z.city}{z.distance != null ? ` · ${distanceLabel(z.distance)} away` : ''}</Text>
                </View>
                <StatusBadge status={z.zone_type} zone />
              </View>
              <Text style={styles.desc}>{z.description}</Text>
              <View style={styles.levelRow}>
                <Text style={styles.muted}>{t('Safety level')}</Text>
                <View style={styles.track}><View style={[styles.fill, { width: `${z.safety_level}%`, backgroundColor: m.color }]} /></View>
                <Text style={[styles.levelNum, { color: m.color }]}>{z.safety_level}</Text>
              </View>
            </Card>
          );
        })
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  now: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
  nowDot: { width: 12, height: 12, borderRadius: 6 },
  nowLabel: { color: colors.textSoft, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  nowValue: { fontSize: 16, fontWeight: '800', marginTop: 2 },
  zone: { marginBottom: 10 },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  name: { color: colors.text, fontSize: 15, fontWeight: '700' },
  muted: { color: colors.muted, fontSize: 12, marginTop: 2 },
  desc: { color: colors.textSoft, fontSize: 13, lineHeight: 19, marginTop: 10 },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  track: { flex: 1, height: 5, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' },
  fill: { height: 5, borderRadius: 3 },
  levelNum: { fontSize: 13, fontWeight: '800', width: 26, textAlign: 'right' },
});
