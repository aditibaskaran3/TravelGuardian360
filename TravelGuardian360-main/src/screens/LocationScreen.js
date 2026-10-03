import { t } from '../i18n';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Button from '../components/Button';
import Card from '../components/Card';
import Header from '../components/Header';
import Icon from '../components/Icon';
import MapView from '../components/MapView';
import ScreenContainer, { Section } from '../components/ScreenContainer';
import { InlineMessage } from '../components/States';
import StatusBadge from '../components/StatusBadge';
import { useLocation } from '../context/LocationContext';
import { useApi } from '../hooks/useApi';
import { locationsApi } from '../services/touristService';
import { colors } from '../utils/constants';
import { coords, formatDateTime, timeAgo } from '../utils/format';

export default function LocationScreen() {
  const { position, status, error, tracking, lastSync, syncError, refresh, startTracking, stopTracking } = useLocation();
  const history = useApi(() => locationsApi.history(6));
  const [busy, setBusy] = useState(false);
  const [, tick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 30000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (lastSync) history.reload({ silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastSync]);

  const toggle = async () => {
    setBusy(true);
    if (tracking) await stopTracking();
    else await startTracking();
    setBusy(false);
  };

  const markers = useMemo(
    () => (position ? [{ id: 'me', latitude: position.latitude, longitude: position.longitude, self: true, title: t('You are here'), subtitle: position.label }] : []),
    [position],
  );

  const rows = [
    { label: t('Current location'), value: position ? position.label || t('Resolving address…') : '—' },
    { label: t('Latitude'), value: position ? position.latitude.toFixed(6) : '—' },
    { label: t('Longitude'), value: position ? position.longitude.toFixed(6) : '—' },
    { label: t('Accuracy'), value: position && position.accuracy ? `± ${Math.round(position.accuracy)} m` : '—' },
    { label: t('Last updated'), value: position ? `${formatDateTime(position.updatedAt)} (${timeAgo(position.updatedAt)})` : '—' },
  ];

  return (
    <ScreenContainer tabBar header={<Header title={t('Live Location')} subtitle={t('Share your position while you travel')} />}>
      <InlineMessage tone="warn">{error}</InlineMessage>
      <InlineMessage>{syncError}</InlineMessage>

      <Section>
        {position ? (
          <MapView center={position} markers={markers} height={280} zoom={16} />
        ) : (
          <View style={styles.mapEmpty}><Text style={styles.muted}>{status === 'loading' ? t('Finding your location…') : t('Map unavailable')}</Text></View>
        )}
      </Section>

      <Section>
        <Card>
          <View style={styles.statusRow}>
            <View style={[styles.statusIcon, { backgroundColor: tracking ? colors.safeSoft : colors.cardAlt }]}>
              <Icon name="radio" size={20} color={tracking ? colors.safe : colors.muted} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.statusTitle}>{t('Tracking status')}</Text>
              <Text style={styles.muted}>
                {tracking ? (lastSync ? t('Sharing your position · synced {time}', { time: timeAgo(lastSync) }) : t('Sharing your position')) : t('Your position is not being shared')}
              </Text>
            </View>
            <StatusBadge status={tracking ? 'live' : 'paused'} label={tracking ? t('Active') : t('Stopped')} />
          </View>
          <View style={styles.buttons}>
            <Button title={t('Start Tracking')} icon="play" onPress={toggle} disabled={tracking} loading={busy && !tracking} style={styles.btn} />
            <Button title={t('Stop Tracking')} icon="square" variant="outline" onPress={toggle} disabled={!tracking} loading={busy && tracking} style={styles.btn} />
          </View>
          <Button title={t('Update position')} icon="crosshair" variant="ghost" onPress={refresh} style={{ marginTop: 8 }} />
        </Card>
      </Section>

      <Section>
        <Card>
          {rows.map((r, i) => (
            <View key={r.label} style={[styles.row, i > 0 && styles.rowBorder]}>
              <Text style={styles.rowLabel}>{r.label}</Text>
              <Text style={styles.rowValue}>{r.value}</Text>
            </View>
          ))}
        </Card>
      </Section>

      <Section>
        <Text style={styles.title}>{t('Recent shared positions')}</Text>
        <Card style={{ paddingVertical: 4 }}>
          {history.loading && !history.data ? (
            <Text style={[styles.muted, styles.pad]}>{t('Loading…')}</Text>
          ) : history.error ? (
            <Text style={[styles.muted, styles.pad]}>{history.error}</Text>
          ) : !history.data || history.data.length === 0 ? (
            <Text style={[styles.muted, styles.pad]}>{t('Start tracking to build your location history.')}</Text>
          ) : (
            history.data.map((h, i) => (
              <View key={h.id} style={[styles.hist, i > 0 && styles.rowBorder]}>
                <Icon name={h.tracking_active ? 'map-pin' : 'pause-circle'} size={16} color={h.tracking_active ? colors.accent : colors.muted} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.histLabel} numberOfLines={1}>{h.label || coords(h.latitude, h.longitude)}</Text>
                  <Text style={styles.muted}>{coords(h.latitude, h.longitude)}</Text>
                </View>
                <Text style={styles.muted}>{timeAgo(h.recorded_at)}</Text>
              </View>
            ))
          )}
        </Card>
      </Section>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  mapEmpty: { height: 280, borderRadius: 16, backgroundColor: colors.mapBg, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  muted: { color: colors.muted, fontSize: 12 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  statusTitle: { color: colors.text, fontSize: 15, fontWeight: '700', marginBottom: 2 },
  buttons: { flexDirection: 'row', gap: 10, marginTop: 16 },
  btn: { flex: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, paddingVertical: 12 },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  rowLabel: { color: colors.muted, fontSize: 13 },
  rowValue: { color: colors.text, fontSize: 13, fontWeight: '600', flex: 1, textAlign: 'right' },
  title: { color: colors.text, fontSize: 17, fontWeight: '700', marginBottom: 12 },
  pad: { padding: 12 },
  hist: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 4 },
  histLabel: { color: colors.text, fontSize: 13, fontWeight: '600' },
});
