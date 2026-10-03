import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import Button from '../components/Button';
import Card from '../components/Card';
import DateField from '../components/DateField';
import Header, { IconButton } from '../components/Header';
import Icon from '../components/Icon';
import Input from '../components/Input';
import ScreenContainer from '../components/ScreenContainer';
import { ConfirmDialog, Sheet } from '../components/Sheet';
import { EmptyState, ErrorState, InlineMessage, Loading } from '../components/States';
import StatusBadge from '../components/StatusBadge';
import { useApi } from '../hooks/useApi';
import { tripsApi } from '../services/touristService';
import { colors } from '../utils/constants';
import { addDaysISO, formatDate, todayISO } from '../utils/format';
import { hasErrors, validateTrip } from '../utils/validation';
import { t } from '../i18n';

const TABS = [
  { key: 'active', label: t('Active') },
  { key: 'upcoming', label: t('Upcoming') },
  { key: 'completed', label: t('Completed') },
];

const blank = () => ({ destination: '', start_date: todayISO(), end_date: addDaysISO(5), accommodation: '', transport: '', notes: '', start_now: false });

export default function TripScreen({ navigation, route }) {
  const trips = useApi(() => tripsApi.list());
  const [tab, setTab] = useState('active');
  const [editing, setEditing] = useState(null); // null = closed, {} = new, trip = edit
  const [form, setForm] = useState(blank());
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null); // { type, trip }
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState({ tone: 'success', text: '' });

  const grouped = useMemo(() => {
    const g = { active: [], upcoming: [], completed: [] };
    (trips.data || []).forEach((t) => g[t.status].push(t));
    return g;
  }, [trips.data]);

  const openForm = (trip) => {
    setErrors({});
    setFormError('');
    setForm(
      trip
        ? { destination: trip.destination, start_date: trip.start_date, end_date: trip.end_date, accommodation: trip.accommodation || '', transport: trip.transport || '', notes: trip.notes || '', start_now: false }
        : blank(),
    );
    setEditing(trip || {});
  };

  useEffect(() => {
    if (route && route.params && route.params.create) {
      openForm(null);
      navigation.setParams({ create: undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route && route.params && route.params.create]);

  const set = (key) => (value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  const save = async () => {
    const found = validateTrip(form);
    setErrors(found);
    setFormError('');
    if (hasErrors(found)) return;
    const payload = {
      destination: form.destination.trim(), start_date: form.start_date, end_date: form.end_date,
      accommodation: form.accommodation, transport: form.transport, notes: form.notes,
    };
    setSaving(true);
    try {
      if (editing && editing.id) {
        await tripsApi.update(editing.id, payload);
      } else {
        await tripsApi.create({ ...payload, start_now: form.start_now });
        setTab(form.start_now ? 'active' : 'upcoming');
      }
      setEditing(null);
      setNotice({ tone: 'success', text: editing && editing.id ? t('Trip updated.') : t('Trip created.') });
      await trips.reload({ silent: true });
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const runConfirm = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      const { type, trip } = confirm;
      if (type === 'delete') await tripsApi.remove(trip.id);
      if (type === 'start') {
        await tripsApi.start(trip.id);
        setTab('active');
      }
      if (type === 'end') {
        await tripsApi.end(trip.id);
        setTab('completed');
      }
      setNotice({ tone: 'success', text: { delete: t('Trip deleted.'), start: t('Trip started. Stay safe!'), end: t('Trip ended.') }[type] });
      setConfirm(null);
      await trips.reload({ silent: true });
    } catch (err) {
      setNotice({ tone: 'danger', text: err.message });
      setConfirm(null);
    } finally {
      setBusy(false);
    }
  };

  const list = grouped[tab];
  const confirmCopy = confirm && {
    delete: { title: t('Delete this trip?'), message: t('{place} will be removed permanently.', { place: confirm.trip.destination }), label: t('Delete'), danger: true },
    start: { title: t('Start this trip?'), message: t('{place} becomes your active trip and appears on your dashboard.', { place: confirm.trip.destination }), label: t('Start trip'), danger: false },
    end: { title: t('End this trip?'), message: t('{place} will move to your completed trips.', { place: confirm.trip.destination }), label: t('End trip'), danger: false },
  }[confirm.type];

  return (
    <ScreenContainer
      tabBar
      refreshing={false}
      onRefresh={() => trips.reload({ silent: true })}
      header={<Header title={t('Trip Mode')} subtitle={t('Plan, start and review your journeys')} right={<IconButton icon="plus" label={t('New trip')} onPress={() => openForm(null)} />} />}
    >
      <View style={styles.segment}>
        {TABS.map((t) => (
          <Pressable key={t.key} onPress={() => setTab(t.key)} style={[styles.segItem, tab === t.key && styles.segActive]}>
            <Text style={[styles.segText, tab === t.key && styles.segTextActive]}>{t.label}</Text>
            <Text style={[styles.segCount, tab === t.key && { color: colors.accent }]}>{grouped[t.key].length}</Text>
          </Pressable>
        ))}
      </View>

      <InlineMessage tone={notice.tone === 'success' ? 'success' : 'danger'}>{notice.text}</InlineMessage>

      {trips.loading && !trips.data ? (
        <Loading label={t('Loading your trips…')} />
      ) : trips.error && !trips.data ? (
        <ErrorState message={trips.error} onRetry={trips.reload} />
      ) : list.length === 0 ? (
        <EmptyState
          icon="briefcase"
          title={t(tab === 'active' ? 'No active trips' : tab === 'upcoming' ? 'No upcoming trips' : 'No completed trips')}
          message={tab === 'active' ? t('Start an upcoming trip or create a new one.') : tab === 'upcoming' ? t('Plan your next journey to see it here.') : t('Completed trips will be listed here.')}
          action={tab !== 'completed' ? <Button title={t('Create trip')} icon="plus" variant="soft" full={false} small onPress={() => openForm(null)} /> : null}
        />
      ) : (
        list.map((trip) => (
          <Card key={trip.id} style={styles.trip}>
            <View style={styles.tripTop}>
              <View style={styles.tripIcon}><Icon name="map-pin" size={18} color={colors.accent} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.dest}>{trip.destination}</Text>
                <Text style={styles.dates}>{formatDate(trip.start_date)} – {formatDate(trip.end_date)}</Text>
              </View>
              <StatusBadge status={trip.status} />
            </View>
            {trip.accommodation || trip.transport || trip.notes ? (
              <View style={styles.info}>
                {trip.accommodation ? <Row icon="home" text={trip.accommodation} /> : null}
                {trip.transport ? <Row icon="navigation" text={trip.transport} /> : null}
                {trip.notes ? <Row icon="file-text" text={trip.notes} /> : null}
              </View>
            ) : null}
            <View style={styles.actions}>
              {trip.status === 'upcoming' ? <Button small title={t('Start')} icon="play" variant="soft" full={false} onPress={() => setConfirm({ type: 'start', trip })} /> : null}
              {trip.status === 'active' ? <Button small title={t('End trip')} icon="flag" variant="dangerSoft" full={false} onPress={() => setConfirm({ type: 'end', trip })} /> : null}
              <Button small title={t('Edit')} icon="edit-2" variant="outline" full={false} onPress={() => openForm(trip)} />
              <Button small title={t('Delete')} icon="trash-2" variant="ghost" full={false} onPress={() => setConfirm({ type: 'delete', trip })} style={{ marginLeft: 'auto' }} />
            </View>
          </Card>
        ))
      )}

      <Sheet visible={editing !== null} title={editing && editing.id ? t('Edit trip') : t('New trip')} onClose={() => setEditing(null)}>
        <InlineMessage>{formError}</InlineMessage>
        <Input label={t('Destination')} icon="map-pin" value={form.destination} onChangeText={set('destination')} error={errors.destination} placeholder={t('City or region')} />
        <View style={styles.dateRow}>
          <View style={{ flex: 1 }}><DateField label={t('Start date')} value={form.start_date} onChange={set('start_date')} error={errors.start_date} /></View>
          <View style={{ flex: 1 }}><DateField label={t('End date')} value={form.end_date} onChange={set('end_date')} error={errors.end_date} min={form.start_date} /></View>
        </View>
        <Input label={t('Accommodation')} icon="home" value={form.accommodation} onChangeText={set('accommodation')} placeholder={t('Hotel or address')} />
        <Input label={t('Transport')} icon="navigation" value={form.transport} onChangeText={set('transport')} placeholder={t('Flight, train, car…')} />
        <Input label={t('Notes')} multiline value={form.notes} onChangeText={set('notes')} placeholder={t('Bookings, reminders, meeting points')} />
        {!(editing && editing.id) ? (
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchTitle}>{t('Start this trip now')}</Text>
              <Text style={styles.switchSub}>{t('Makes it your active trip right away.')}</Text>
            </View>
            <Switch value={form.start_now} onValueChange={set('start_now')} trackColor={{ true: colors.accent, false: colors.border }} />
          </View>
        ) : null}
        <Button title={editing && editing.id ? t('Save changes') : t('Create trip')} onPress={save} loading={saving} style={{ marginTop: 8 }} />
      </Sheet>

      <ConfirmDialog
        visible={!!confirm}
        title={confirmCopy ? confirmCopy.title : ''}
        message={confirmCopy ? confirmCopy.message : ''}
        confirmLabel={confirmCopy ? confirmCopy.label : t('Confirm')}
        danger={confirmCopy ? confirmCopy.danger : false}
        loading={busy}
        onConfirm={runConfirm}
        onCancel={() => setConfirm(null)}
      />
    </ScreenContainer>
  );
}

const Row = ({ icon, text }) => (
  <View style={styles.infoRow}>
    <Icon name={icon} size={14} color={colors.muted} />
    <Text style={styles.infoText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  segment: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: 14, padding: 4, borderWidth: 1, borderColor: colors.border, marginBottom: 16 },
  segItem: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, cursor: 'pointer' },
  segActive: { backgroundColor: colors.accentSoft },
  segText: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  segTextActive: { color: colors.accent },
  segCount: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  trip: { marginBottom: 12 },
  tripTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tripIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  dest: { color: colors.text, fontSize: 16, fontWeight: '700' },
  dates: { color: colors.muted, fontSize: 13, marginTop: 2 },
  info: { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border, gap: 8 },
  infoRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  infoText: { color: colors.textSoft, fontSize: 13, flex: 1, lineHeight: 18 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 14, alignItems: 'center', flexWrap: 'wrap' },
  dateRow: { flexDirection: 'row', gap: 10 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: colors.bg, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  switchTitle: { color: colors.text, fontSize: 14, fontWeight: '600' },
  switchSub: { color: colors.muted, fontSize: 12, marginTop: 2 },
});
