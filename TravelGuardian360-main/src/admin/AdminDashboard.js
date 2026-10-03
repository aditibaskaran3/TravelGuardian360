import { t } from '../i18n';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import Button from '../components/Button';
import Icon from '../components/Icon';
import StatusBadge from '../components/StatusBadge';
import { EmptyState } from '../components/States';
import { useApi } from '../hooks/useApi';
import { adminApi } from '../services/adminService';
import { ZONE_META, colors, radius } from '../utils/constants';
import { formatDate, timeAgo } from '../utils/format';
import AdminLayout from './components/AdminLayout';
import {
  AsyncBody, BarChart, DonutChart, SectionCard, StatCard, StatGrid, usePolling,
} from './components/ui';

const POLL_MS = 15000;

const shortDay = (iso) => {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' });
};

function RecentSos({ items, onOpen }) {
  if (!items.length) {
    return <EmptyState icon="check-circle" title={t('No emergency requests')} message={t('New SOS requests appear here as they arrive.')} />;
  }
  return (
    <View style={styles.list}>
      {items.map((s) => {
        const active = s.status === 'active';
        return (
          <Pressable key={s.id} onPress={onOpen} style={[styles.sosRow, active && styles.sosRowActive]}>
            <View style={[styles.sosIcon, { backgroundColor: active ? colors.danger : colors.cardAlt }]}>
              <Icon name="alert-triangle" size={16} color={active ? '#fff' : colors.muted} />
            </View>
            <View style={styles.flex1}>
              <Text style={styles.rowTitle} numberOfLines={1}>{s.tourist_name || t('Unknown tourist')}</Text>
              <Text style={styles.rowSub} numberOfLines={1}>
                {s.location_label || t('Location unavailable')} - {timeAgo(s.created_at)}
              </Text>
            </View>
            <StatusBadge status={s.status} />
          </Pressable>
        );
      })}
    </View>
  );
}

export default function AdminDashboard() {
  const navigation = useNavigation();
  const { data, loading, error, reload } = useApi(() => adminApi.dashboard(), []);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (data) setUpdatedAt(new Date());
  }, [data]);

  usePolling(() => reload({ silent: true }), POLL_MS);

  const refresh = async () => {
    setRefreshing(true);
    await reload({ silent: true });
    setRefreshing(false);
  };

  const d = data || {};
  const registrations = (d.registrations || []).map((r) => ({ label: shortDay(r.date), value: r.count }));
  const trips = d.trips_by_status || {};
  const sos = d.sos_by_status || {};
  const zones = d.zones_by_type || {};
  const recentSos = d.recent_sos || [];
  const recentUsers = d.recent_users || [];
  const goSos = () => navigation.navigate('AdminSOS');

  const actions = (
    <>
      <Text style={styles.updated}>
        {updatedAt ? t('Updated {time}', { time: updatedAt.toLocaleTimeString('en-GB') }) : t('Not updated yet')}
      </Text>
      <Button title={t('Refresh')} icon="refresh-cw" variant="outline" small full={false} loading={refreshing} onPress={refresh} />
    </>
  );

  return (
    <AdminLayout title={t('Dashboard')} subtitle={t('Live overview of tourists, trips and emergencies. Refreshes every 15 seconds.')} actions={actions}>
      <AsyncBody data={data} loading={loading} error={error} onRetry={reload}>
        <StatGrid>
          <StatCard label={t('Total Users')} value={d.total_users} icon="users" onPress={() => navigation.navigate('AdminUsers')} />
          <StatCard label={t('Active Users')} value={d.active_users} icon="activity" color={colors.safe} hint={t('Signed in during the last 7 days')} />
          <StatCard label={t('Active Trips')} value={d.active_trips} icon="briefcase" onPress={() => navigation.navigate('AdminTrips')} />
          <StatCard label={t('SOS Requests')} value={d.sos_requests} icon="alert-circle" color={colors.caution} hint={t('All time')} onPress={goSos} />
          <StatCard label={t('Emergency Alerts')} value={d.emergency_alerts} icon="alert-triangle" color={colors.danger} hint={t('Active and acknowledged')} onPress={goSos} />
          <StatCard label={t('Registered Tourists')} value={d.registered_tourists} icon="user-check" onPress={() => navigation.navigate('AdminTourists')} />
          <StatCard label={t('Verified Tourists')} value={d.verified_tourists} icon="check-circle" color={colors.safe} />
          <StatCard label={t('Tracking Now')} value={d.tracking_now} icon="map-pin" color={colors.safe} hint={t('Live location updates')} onPress={() => navigation.navigate('AdminLocations')} />
          <StatCard label={t('Safety Zones')} value={d.safety_zones} icon="shield" onPress={() => navigation.navigate('AdminZones')} />
        </StatGrid>

        <View style={styles.grid}>
          <SectionCard title={t('Registrations, last 7 days')} subtitle={t('New tourist accounts per day')} style={styles.wide}>
            <BarChart data={registrations} />
          </SectionCard>
          <SectionCard title={t('Trips by status')} style={styles.narrow}>
            <DonutChart
              centerLabel={t('Trips')}
              data={[
                { label: t('Active'), value: trips.active || 0, color: colors.safe },
                { label: t('Upcoming'), value: trips.upcoming || 0, color: colors.accent },
                { label: t('Completed'), value: trips.completed || 0, color: colors.muted },
              ]}
            />
          </SectionCard>
        </View>

        <View style={styles.grid}>
          <SectionCard title={t('SOS by status')} style={styles.half}>
            <BarChart
              height={170}
              data={[
                { label: t('Active'), value: sos.active || 0, color: colors.danger },
                { label: t('Acknowledged'), value: sos.acknowledged || 0, color: colors.caution },
                { label: t('Resolved'), value: sos.resolved || 0, color: colors.safe },
              ]}
            />
          </SectionCard>
          <SectionCard title={t('Safety zones by type')} style={styles.half}>
            <DonutChart
              centerLabel={t('Zones')}
              data={['safe', 'caution', 'high_risk'].map((t) => ({ label: ZONE_META[t].label, value: zones[t] || 0, color: ZONE_META[t].color }))}
            />
          </SectionCard>
        </View>

        <View style={styles.grid}>
          <SectionCard
            title={t('Recent SOS')}
            style={styles.half}
            tone={recentSos.some((s) => s.status === 'active') ? 'danger' : undefined}
            right={<Button title={t('View all')} variant="ghost" small full={false} onPress={goSos} />}
          >
            <RecentSos items={recentSos} onOpen={goSos} />
          </SectionCard>
          <SectionCard
            title={t('Recent registrations')}
            style={styles.half}
            right={<Button title={t('View all')} variant="ghost" small full={false} onPress={() => navigation.navigate('AdminUsers')} />}
          >
            {recentUsers.length === 0 ? (
              <EmptyState icon="users" title={t('No registrations yet')} />
            ) : (
              <View style={styles.list}>
                {recentUsers.map((u) => (
                  <View key={u.id} style={styles.userRow}>
                    <View style={styles.flex1}>
                      <Text style={styles.rowTitle} numberOfLines={1}>{u.full_name}</Text>
                      <Text style={styles.rowSub} numberOfLines={1}>{u.email}</Text>
                    </View>
                    <View style={styles.userMeta}>
                      <Text style={styles.rowSub}>{formatDate(u.created_at)}</Text>
                      <Text style={styles.rowSub}>{u.tourist_id || '-'}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </SectionCard>
        </View>
      </AsyncBody>
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1, minWidth: 0 },
  updated: { color: colors.muted, fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  wide: { flexGrow: 2, flexBasis: 420 },
  narrow: { flexGrow: 1, flexBasis: 300 },
  half: { flexGrow: 1, flexBasis: 360 },
  list: { gap: 8 },
  sosRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.md,
    backgroundColor: colors.cardAlt, borderWidth: 1, borderColor: colors.border, cursor: 'pointer',
  },
  sosRowActive: { backgroundColor: colors.dangerSoft, borderColor: colors.danger },
  sosIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { color: colors.text, fontSize: 14, fontWeight: '600' },
  rowSub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  userRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.md,
    backgroundColor: colors.cardAlt, borderWidth: 1, borderColor: colors.border,
  },
  userMeta: { alignItems: 'flex-end' },
});
