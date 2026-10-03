import { t } from '../i18n';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Card from '../components/Card';
import Chips from '../components/Chips';
import Header from '../components/Header';
import NotificationItem from '../components/NotificationItem';
import ScreenContainer from '../components/ScreenContainer';
import { EmptyState, ErrorState, Loading } from '../components/States';
import { useApi } from '../hooks/useApi';
import { notificationsApi } from '../services/touristService';
import { NOTIFICATION_TYPES, colors } from '../utils/constants';
import { goBack } from '../utils/nav';

const FILTERS = [{ value: 'all', label: t('All') }, ...Object.entries(NOTIFICATION_TYPES).map(([value, m]) => ({ value, label: m.label }))];

export default function NotificationsScreen({ navigation }) {
  const list = useApi(() => notificationsApi.list(100));
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState('recent');

  const items = useMemo(() => {
    let rows = list.data || [];
    if (filter !== 'all') rows = rows.filter((n) => n.type === filter);
    if (view === 'recent') rows = rows.slice(0, 5);
    return rows;
  }, [list.data, filter, view]);

  const unread = (list.data || []).filter((n) => !n.is_read).length;

  const open = async (n) => {
    if (n.is_read) return;
    try {
      await notificationsApi.read(n.id);
      list.setData((list.data || []).map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
    } catch {
      // The next refresh will bring the read state back in line.
    }
  };

  const markAll = async () => {
    try {
      await notificationsApi.readAll();
      list.setData((list.data || []).map((x) => ({ ...x, is_read: true })));
    } catch {
      list.reload({ silent: true });
    }
  };

  return (
    <ScreenContainer
      refreshing={false}
      onRefresh={() => list.reload({ silent: true })}
      header={
        <Header
          title={t('Notifications')}
          subtitle={unread ? t('{n} unread', { n: unread }) : t('You are all caught up')}
          onBack={() => goBack(navigation)}
          right={unread ? (
            <Pressable onPress={markAll}><Text style={styles.link}>{t('Mark all read')}</Text></Pressable>
          ) : null}
        />
      }
    >
      <View style={styles.segment}>
        {[['recent', t('Recent')], ['all', t('All')]].map(([key, label]) => (
          <Pressable key={key} onPress={() => setView(key)} style={[styles.segItem, view === key && styles.segActive]}>
            <Text style={[styles.segText, view === key && { color: colors.accent }]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      <Chips options={FILTERS} value={filter} onChange={setFilter} />

      {list.loading && !list.data ? (
        <Loading label={t('Loading notifications…')} />
      ) : list.error && !list.data ? (
        <ErrorState message={list.error} onRetry={list.reload} />
      ) : items.length === 0 ? (
        <EmptyState icon="bell-off" title={t('No notifications')} message={t('Safety, weather and trip alerts will show up here.')} />
      ) : (
        <Card style={{ paddingVertical: 4 }}>
          {items.map((n, i) => (
            <View key={n.id} style={i > 0 && styles.divider}>
              <NotificationItem item={n} onPress={() => open(n)} />
            </View>
          ))}
        </Card>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  link: { color: colors.accent, fontSize: 13, fontWeight: '600' },
  segment: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: colors.border, marginBottom: 14 },
  segItem: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 9, cursor: 'pointer' },
  segActive: { backgroundColor: colors.accentSoft },
  segText: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
});
