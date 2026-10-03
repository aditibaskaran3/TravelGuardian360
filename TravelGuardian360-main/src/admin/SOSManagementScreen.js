import { t } from '../i18n';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import Button from '../components/Button';
import Icon from '../components/Icon';
import Input from '../components/Input';
import MapView from '../components/MapView';
import { ConfirmDialog, Sheet } from '../components/Sheet';
import StatusBadge from '../components/StatusBadge';
import { EmptyState, ErrorState, InlineMessage, Loading } from '../components/States';
import { useApi } from '../hooks/useApi';
import { adminApi } from '../services/adminService';
import { STATUS_META, colors, radius } from '../utils/constants';
import { coords, formatDateTime, timeAgo } from '../utils/format';
import AdminLayout from './components/AdminLayout';
import {
  AsyncBody, Field, FieldGrid, Flash, FilterChips, RowActions, usePolling, useFlash,
} from './components/ui';

const POLL_MS = 8000;
const STATUSES = ['active', 'acknowledged', 'resolved'];

function PulseDot({ color = colors.danger }) {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.25, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(anim, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);
  return (
    <View style={styles.pulseWrap}>
      <Animated.View style={[styles.pulseDot, { backgroundColor: color, opacity: anim }]} />
    </View>
  );
}

function SosCard({ sos, onView, onAcknowledge, onResolve, busyId }) {
  const active = sos.status === 'active';
  const contact = sos.emergency_contact;
  const busy = busyId === sos.id;
  return (
    <View style={[styles.card, active && styles.cardActive]}>
      <View style={styles.cardHead}>
        {active ? <PulseDot /> : <View style={[styles.staticDot, { backgroundColor: STATUS_META[sos.status]?.color || colors.muted }]} />}
        <View style={styles.flex1}>
          <Text style={styles.name} numberOfLines={1}>{sos.tourist_name || t('Unknown tourist')}</Text>
          <Text style={styles.sub}>{formatDateTime(sos.created_at)} ({timeAgo(sos.created_at)})</Text>
        </View>
        <StatusBadge status={sos.status} />
      </View>

      <FieldGrid>
        <Field label={t('Location')}>
          <View>
            <Text style={styles.value}>{sos.location_label || t('Location label unavailable')}</Text>
            <Text style={styles.sub}>{coords(sos.latitude, sos.longitude)}</Text>
          </View>
        </Field>
        <Field label={t('Emergency contact')}>
          {contact ? (
            <View>
              <Text style={styles.value}>{contact.name}</Text>
              <Text style={styles.sub}>{[contact.relationship, contact.phone].filter(Boolean).join(' - ')}</Text>
            </View>
          ) : (
            t('No contact on file')
          )}
        </Field>
        <Field label={t('Trip')}>{sos.trip_destination || t('No active trip')}</Field>
        <Field label={t('Tourist phone')}>{sos.tourist_phone || '-'}</Field>
      </FieldGrid>
      {sos.message ? <Text style={styles.message}>{`"${sos.message}"`}</Text> : null}

      <RowActions>
        <Button title={t('View')} icon="eye" variant="soft" small full={false} onPress={() => onView(sos)} />
        {sos.status === 'active' ? (
          <Button title={t('Acknowledge')} icon="check" variant="outline" small full={false} loading={busy} onPress={() => onAcknowledge(sos)} />
        ) : null}
        {sos.status !== 'resolved' ? (
          <Button title={t('Mark resolved')} icon="check-circle" variant="soft" small full={false} onPress={() => onResolve(sos)} />
        ) : null}
      </RowActions>
    </View>
  );
}

function SosDetailSheet({ sosId, onClose, onChanged }) {
  const [state, setState] = useState({ loading: true, error: '', sos: null });
  const [status, setStatus] = useState('active');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const load = useCallback(
    async (initial) => {
      if (initial) setState({ loading: true, error: '', sos: null });
      try {
        const sos = await adminApi.sos(sosId);
        setState({ loading: false, error: '', sos });
        setStatus(sos.status);
        setNote(sos.admin_note || '');
      } catch (err) {
        setState({ loading: false, error: err.message, sos: null });
      }
    },
    [sosId],
  );

  useEffect(() => {
    if (!sosId) return undefined;
    setMessage(null);
    load(true);
    return undefined;
  }, [sosId, load]);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await adminApi.updateSos(sosId, { status, admin_note: note.trim() });
      await load(false);
      setMessage({ tone: 'safe', text: t('Emergency request updated. The tourist has been notified of the change.') });
      onChanged();
    } catch (err) {
      setMessage({ tone: 'danger', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const sos = state.sos;
  const info = sos?.emergency_info;
  const medical = sos && sos.status !== 'resolved' ? info?.medical : null;

  return (
    <Sheet visible={!!sosId} title={t('Emergency request')} onClose={onClose} wide>
      {state.loading ? <Loading /> : null}
      {state.error ? <ErrorState message={state.error} onRetry={() => load(true)} /> : null}
      {sos ? (
        <View>
          <View style={styles.detailHead}>
            <View style={styles.flex1}>
              <Text style={styles.detailName}>{sos.tourist_name}</Text>
              <Text style={styles.sub}>{formatDateTime(sos.created_at)} ({timeAgo(sos.created_at)})</Text>
            </View>
            <StatusBadge status={sos.status} />
          </View>

          <MapView
            height={200}
            zoom={15}
            center={{ latitude: sos.latitude, longitude: sos.longitude }}
            markers={[{
              id: sos.id, latitude: sos.latitude, longitude: sos.longitude, color: colors.danger,
              pulse: sos.status === 'active', title: sos.tourist_name, subtitle: sos.location_label || undefined,
            }]}
          />

          <View style={styles.gap} />
          <FieldGrid>
            <Field label={t('Location')}>{sos.location_label || t('Location label unavailable')}</Field>
            <Field label={t('Coordinates')}>{coords(sos.latitude, sos.longitude)}</Field>
            <Field label={t('Tourist phone')}>{sos.tourist_phone || '-'}</Field>
            <Field label={t('Trip')}>{sos.trip_destination || t('No active trip')}</Field>
            <Field label={t('Acknowledged')}>{sos.acknowledged_at ? formatDateTime(sos.acknowledged_at) : t('Not yet')}</Field>
            <Field label={t('Resolved')}>{sos.resolved_at ? formatDateTime(sos.resolved_at) : t('Not yet')}</Field>
          </FieldGrid>
          {sos.message ? <Field label={t('Message from tourist')}>{sos.message}</Field> : null}

          <Text style={styles.blockTitle}>{t('Emergency contacts')}</Text>
          {(info?.contacts || (sos.emergency_contact ? [sos.emergency_contact] : [])).length === 0 ? (
            <Text style={styles.sub}>{t('No emergency contacts on file.')}</Text>
          ) : (
            (info?.contacts || [sos.emergency_contact]).map((c, i) => (
              <View key={`${c.phone}-${i}`} style={styles.contactRow}>
                <Icon name="phone" size={14} color={colors.accent} />
                <Text style={styles.value}>{c.name}</Text>
                <Text style={styles.sub}>{[c.relationship, c.phone].filter(Boolean).join(' - ')}</Text>
              </View>
            ))
          )}

          <View style={styles.restricted}>
            <View style={styles.restrictedHead}>
              <Icon name="lock" size={14} color={colors.caution} />
              <Text style={styles.restrictedTitle}>{t('Restricted emergency medical information - access is logged')}</Text>
            </View>
            {medical ? (
              <FieldGrid>
                <Field label={t('Blood group')}>{medical.blood_group || t('Not provided')}</Field>
                <Field label={t('Allergies')}>{medical.allergies || t('Not provided')}</Field>
                <Field label={t('Conditions')}>{medical.conditions || t('Not provided')}</Field>
              </FieldGrid>
            ) : (
              <Text style={styles.sub}>
                {sos.status === 'resolved'
                  ? t('Medical details are hidden once an emergency is resolved.')
                  : t('No medical information is available for this request.')}
              </Text>
            )}
          </View>

          <Text style={styles.blockTitle}>{t('Update request')}</Text>
          <FilterChips
            options={STATUSES.map((s) => ({ value: s, label: STATUS_META[s].label }))}
            value={status}
            onChange={setStatus}
          />
          <View style={styles.gap} />
          <Input
            label={t('Admin note')}
            value={note}
            onChangeText={setNote}
            multiline
            maxLength={500}
            placeholder={t('Actions taken, responders contacted...')}
            hint={t('Visible to administrators only.')}
          />
          {message ? <InlineMessage tone={message.tone}>{message.text}</InlineMessage> : null}
          <Button title={t('Save update')} icon="save" onPress={save} loading={saving} />
        </View>
      ) : null}
    </Sheet>
  );
}

export default function SOSManagementScreen() {
  const [tab, setTab] = useState(undefined);
  const { data, loading, error, reload } = useApi(() => adminApi.sosList(), []);
  const [flash, setFlash] = useFlash();
  const [viewId, setViewId] = useState(null);
  const [resolveTarget, setResolveTarget] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [resolving, setResolving] = useState(false);

  usePolling(() => reload({ silent: true }), POLL_MS);

  const all = data || [];
  const count = (s) => all.filter((x) => x.status === s).length;
  const rows = tab ? all.filter((x) => x.status === tab) : all;
  const activeCount = count('active');

  const change = async (sos, status, successText) => {
    try {
      await adminApi.updateSos(sos.id, { status });
      setFlash('safe', successText);
      reload({ silent: true });
      return true;
    } catch (err) {
      setFlash('danger', err.message);
      return false;
    }
  };

  const acknowledge = async (sos) => {
    setBusyId(sos.id);
    await change(sos, 'acknowledged', t('Request from {name} acknowledged.', { name: sos.tourist_name }));
    setBusyId(null);
  };

  const resolve = async () => {
    setResolving(true);
    await change(resolveTarget, 'resolved', t('Request from {name} marked as resolved.', { name: resolveTarget.tourist_name }));
    setResolving(false);
    setResolveTarget(null);
  };

  const tabs = [
    { value: undefined, label: t('All'), count: all.length },
    { value: 'active', label: t('Active'), count: activeCount },
    { value: 'acknowledged', label: t('Acknowledged'), count: count('acknowledged') },
    { value: 'resolved', label: t('Resolved'), count: count('resolved') },
  ];

  return (
    <AdminLayout title={t('SOS & Emergencies')} subtitle={t('Respond to emergency requests as they arrive. Refreshes every 8 seconds.')}>
      <Flash flash={flash} />
      <View style={[styles.banner, activeCount > 0 ? styles.bannerActive : styles.bannerOk]}>
        {activeCount > 0 ? <PulseDot /> : <Icon name="check-circle" size={18} color={colors.safe} />}
        <Text style={[styles.bannerText, { color: activeCount > 0 ? colors.danger : colors.safe }]}>
          {activeCount > 0
            ? t(activeCount === 1 ? '1 active emergency request needs attention' : '{n} active emergency requests need attention', { n: activeCount })
            : t('No active emergency requests')}
        </Text>
      </View>
      <View style={styles.tabs}>
        <FilterChips options={tabs} value={tab} onChange={setTab} />
      </View>
      <AsyncBody data={data} loading={loading} error={error} onRetry={reload}>
        {rows.length === 0 ? (
          <View style={styles.emptyBox}>
            <EmptyState
              icon="shield"
              title={tab ? t('No {status} requests', { status: STATUS_META[tab].label.toLowerCase() }) : t('No emergency requests')}
              message={t('New SOS requests from tourists appear here automatically.')}
            />
          </View>
        ) : (
          <View style={styles.list}>
            {rows.map((s) => (
              <SosCard
                key={s.id}
                sos={s}
                busyId={busyId}
                onView={(x) => setViewId(x.id)}
                onAcknowledge={acknowledge}
                onResolve={setResolveTarget}
              />
            ))}
          </View>
        )}
      </AsyncBody>

      <SosDetailSheet sosId={viewId} onClose={() => setViewId(null)} onChanged={() => reload({ silent: true })} />
      <ConfirmDialog
        visible={!!resolveTarget}
        title={t('Mark as resolved?')}
        message={t('The request from {name} will be closed and the tourist will be notified. Restricted medical details are hidden once resolved.', { name: resolveTarget?.tourist_name })}
        confirmLabel={t('Mark resolved')}
        loading={resolving}
        onConfirm={resolve}
        onCancel={() => setResolveTarget(null)}
      />
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1, minWidth: 0 },
  gap: { height: 12 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.md, borderWidth: 1, marginBottom: 14 },
  bannerActive: { backgroundColor: colors.dangerSoft, borderColor: colors.danger },
  bannerOk: { backgroundColor: colors.safeSoft, borderColor: 'rgba(47,203,138,0.4)' },
  bannerText: { fontSize: 15, fontWeight: '700', flex: 1 },
  tabs: { marginBottom: 16 },
  list: { gap: 12 },
  emptyBox: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 12 },
  cardActive: { borderColor: colors.danger, borderWidth: 2, backgroundColor: colors.dangerTint },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pulseWrap: { width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  pulseDot: { width: 14, height: 14, borderRadius: 7 },
  staticDot: { width: 12, height: 12, borderRadius: 6, margin: 3 },
  name: { color: colors.text, fontSize: 16, fontWeight: '800' },
  sub: { color: colors.muted, fontSize: 12, marginTop: 2, lineHeight: 17 },
  value: { color: colors.text, fontSize: 14, lineHeight: 20 },
  message: { color: colors.textSoft, fontSize: 13, fontStyle: 'italic' },

  detailHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  detailName: { color: colors.text, fontSize: 18, fontWeight: '800' },
  blockTitle: { color: colors.textSoft, fontSize: 13, fontWeight: '700', marginTop: 8, marginBottom: 8 },
  contactRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  restricted: {
    marginVertical: 14, padding: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.caution,
    backgroundColor: colors.cautionSoft,
  },
  restrictedHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  restrictedTitle: { flex: 1, color: colors.caution, fontSize: 12, fontWeight: '700' },
});
