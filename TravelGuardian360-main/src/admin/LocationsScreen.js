import { t } from '../i18n';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import Button from '../components/Button';
import Icon from '../components/Icon';
import MapView from '../components/MapView';
import StatusBadge from '../components/StatusBadge';
import { EmptyState } from '../components/States';
import { useApi } from '../hooks/useApi';
import { adminApi } from '../services/adminService';
import { STATUS_META, colors, radius } from '../utils/constants';
import { coords, formatDateTime, timeAgo } from '../utils/format';
import AdminLayout from './components/AdminLayout';
import { AsyncBody, Field, FieldGrid, FilterChips, NARROW_BREAKPOINT, SectionCard, usePolling } from './components/ui';

const POLL_MS = 10000;
const FILTERS = [
  { value: undefined, label: t('All') },
  { value: 'live', label: t('Live') },
  { value: 'stale', label: t('Stale') },
  { value: 'paused', label: t('Paused') },
];

const markerColor = (row) =>
  row.has_active_sos ? colors.danger : (STATUS_META[row.status] || STATUS_META.unavailable).color;

export default function LocationsScreen() {
  const { width } = useWindowDimensions();
  const narrow = width < NARROW_BREAKPOINT;
  const [tracking, setTracking] = useState(undefined);
  const [selectedId, setSelectedId] = useState(null);
  const { data, loading, error, reload } = useApi(() => adminApi.locations({ tracking }), [tracking]);

  usePolling(() => reload({ silent: true }), POLL_MS);

  const rows = data || [];
  const selected = rows.find((r) => r.user_id === selectedId) || null;

  const signature = rows.map((r) => `${r.user_id}:${r.latitude}:${r.longitude}:${r.status}:${r.has_active_sos}`).join('|');
  const markers = useMemo(
    () =>
      rows.map((r) => ({
        id: r.user_id,
        latitude: r.latitude,
        longitude: r.longitude,
        color: markerColor(r),
        pulse: r.has_active_sos,
        title: r.tourist_name,
        subtitle: `${r.label || t('Unnamed location')} - ${timeAgo(r.recorded_at)}${r.has_active_sos ? t(' - open SOS') : ''}`,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [signature],
  );

  const mapHeight = narrow ? 320 : 560;

  const list = (
    <View style={[styles.list, !narrow && { maxHeight: mapHeight }]}>
      {rows.length === 0 ? (
        <EmptyState icon="map-pin" title={t('No tracked tourists')} message={t('Tourists appear here once they share their location.')} />
      ) : (
        rows.map((r) => {
          const active = r.user_id === selectedId;
          return (
            <Pressable
              key={r.user_id}
              onPress={() => setSelectedId(active ? null : r.user_id)}
              style={[styles.item, r.has_active_sos && styles.itemSos, active && styles.itemActive]}
            >
              <View style={[styles.dot, { backgroundColor: markerColor(r) }]} />
              <View style={styles.flex1}>
                <Text style={styles.name} numberOfLines={1}>{r.tourist_name}</Text>
                <Text style={styles.sub} numberOfLines={1}>{r.label || t('Unnamed location')}</Text>
                <Text style={styles.sub} numberOfLines={1}>
                  {timeAgo(r.recorded_at)}{r.trip ? ` - ${r.trip}` : ''}
                </Text>
              </View>
              <View style={styles.badges}>
                {r.has_active_sos ? <StatusBadge status="active" label={t('SOS')} /> : null}
                <StatusBadge status={r.status} />
              </View>
            </Pressable>
          );
        })
      )}
    </View>
  );

  const map = (
    <View style={styles.flex1}>
      {rows.length === 0 ? (
        <View style={[styles.emptyMap, { height: mapHeight }]}>
          <EmptyState icon="map" title={t('Nothing to plot')} message={t('No tourist locations match the current filter.')} />
        </View>
      ) : (
        <MapView
          height={mapHeight}
          zoom={13}
          markers={markers}
          fitMarkers={!selected && rows.length > 1}
          center={selected || rows[0] ? { latitude: (selected || rows[0]).latitude, longitude: (selected || rows[0]).longitude } : undefined}
          selectedId={selected ? selected.user_id : undefined}
          onMarkerPress={(m) => setSelectedId(m.id)}
        />
      )}
      {selected ? (
        <SectionCard
          title={selected.tourist_name}
          subtitle={selected.label || t('Unnamed location')}
          style={styles.detail}
          tone={selected.has_active_sos ? 'danger' : undefined}
          right={<Button title={t('Clear')} variant="ghost" small full={false} icon="x" onPress={() => setSelectedId(null)} />}
        >
          <FieldGrid>
            <Field label={t('Coordinates')}>{coords(selected.latitude, selected.longitude)}</Field>
            <Field label={t('Accuracy')}>{selected.accuracy != null ? `${Math.round(selected.accuracy)} m` : t('Not reported')}</Field>
            <Field label={t('Recorded')}>{`${formatDateTime(selected.recorded_at)} (${timeAgo(selected.recorded_at)})`}</Field>
            <Field label={t('Tracking')}><StatusBadge status={selected.status} /></Field>
            <Field label={t('Active trip')}>{selected.trip || t('None')}</Field>
            <Field label={t('Emergency')}>
              {selected.has_active_sos ? <StatusBadge status="active" label={t('Open SOS request')} /> : t('No open SOS')}
            </Field>
          </FieldGrid>
        </SectionCard>
      ) : null}
    </View>
  );

  return (
    <AdminLayout
      title={t('Live Locations')}
      subtitle={t('Latest reported position of each tracked tourist. Refreshes every 10 seconds.')}
      actions={<Button title={t('Refresh')} icon="refresh-cw" variant="outline" small full={false} onPress={() => reload({ silent: true })} />}
    >
      <View style={styles.filters}>
        <FilterChips options={FILTERS} value={tracking} onChange={(v) => { setTracking(v); setSelectedId(null); }} />
        <View style={styles.legend}>
          <Icon name="circle" size={10} color={colors.danger} />
          <Text style={styles.legendText}>{t('Open SOS')}</Text>
          <Icon name="circle" size={10} color={colors.safe} />
          <Text style={styles.legendText}>{t('Live')}</Text>
          <Icon name="circle" size={10} color={colors.caution} />
          <Text style={styles.legendText}>{t('Stale')}</Text>
        </View>
      </View>
      <AsyncBody data={data} loading={loading} error={error} onRetry={reload}>
        <View style={[styles.layout, narrow && styles.layoutNarrow]}>
          {narrow ? (
            <>
              {map}
              {list}
            </>
          ) : (
            <>
              <View style={styles.side}>{list}</View>
              {map}
            </>
          )}
        </View>
      </AsyncBody>
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1, minWidth: 0 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendText: { color: colors.muted, fontSize: 12, marginRight: 8 },
  layout: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  layoutNarrow: { flexDirection: 'column', alignItems: 'stretch' },
  side: { width: 340 },
  list: { gap: 8, overflow: 'scroll' },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.md, backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.border, cursor: 'pointer',
  },
  itemSos: { borderColor: colors.danger, backgroundColor: colors.dangerSoft },
  itemActive: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  dot: { width: 10, height: 10, borderRadius: 5 },
  name: { color: colors.text, fontSize: 14, fontWeight: '700' },
  sub: { color: colors.muted, fontSize: 12, marginTop: 1 },
  badges: { alignItems: 'flex-end', gap: 4 },
  detail: { marginTop: 12 },
  emptyMap: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, justifyContent: 'center' },
});
