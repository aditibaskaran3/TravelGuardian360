import { t } from '../i18n';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Icon from '../components/Icon';

import Button from '../components/Button';
import { ConfirmDialog } from '../components/Sheet';
import StatusBadge from '../components/StatusBadge';
import { useApi } from '../hooks/useApi';
import { adminApi } from '../services/adminService';
import { colors } from '../utils/constants';
import { formatDate } from '../utils/format';
import AdminLayout from './components/AdminLayout';
import {
  AsyncBody, Cell, CellSub, DataTable, Flash, PageToolbar, Pill, RowActions, useDebounced, useFlash,
} from './components/ui';

const FILTERS = [
  { value: undefined, label: t('All') },
  { value: 'pending', label: t('Pending') },
  { value: 'verified', label: t('Verified') },
];

const shortHash = (h) => (h ? `${h.slice(0, 10)}...${h.slice(-6)}` : null);

export default function TouristsScreen() {
  const [search, setSearch] = useState('');
  const [verification, setVerification] = useState(undefined);
  const q = useDebounced(search.trim(), 300);
  const { data, loading, error, reload } = useApi(() => adminApi.tourists({ q: q || undefined, verification }), [q, verification]);
  const requests = useApi(() => adminApi.tourists({ verification: 'pending' }));
  const waiting = (requests.data || []).filter((r) => r.verification_requested);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [selected, setSelected] = useState([]);
  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const requestedIds = waiting.map((r) => r.user_id);
  const chosen = selected.filter((id) => requestedIds.includes(id));
  const [flash, setFlash] = useFlash();
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  const rows = data || [];
  const verifying = confirm ? confirm.verification_status !== 'verified' : true;

  const apply = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      await adminApi.setVerification(confirm.user_id, verifying);
      setFlash('safe', verifying ? t('{name} is now verified.', { name: confirm.full_name }) : t('Verification revoked for {name}.', { name: confirm.full_name }));
      setConfirm(null);
      reload({ silent: true });
      requests.reload({ silent: true });
    } catch (err) {
      setConfirm(null);
      setFlash('danger', err.message);
    } finally {
      setBusy(false);
    }
  };

  const verifyAll = async () => {
    setBusy(true);
    try {
      const { verified } = await adminApi.verifyRequested(chosen.length ? chosen : undefined);
      setSelected([]);
      setFlash('safe', t(verified === 1 ? '1 tourist verified.' : '{n} tourists verified.', { n: verified }));
      reload({ silent: true });
      requests.reload({ silent: true });
    } catch (err) {
      setFlash('danger', err.message);
    } finally {
      setBusy(false);
      setBulkOpen(false);
    }
  };

  const columns = [
    {
      key: 'select', title: '', width: 44,
      render: (row) => (row.verification_status !== 'verified' && row.verification_requested ? (
        <Pressable onPress={() => toggle(row.user_id)} accessibilityLabel={t('Select {name}', { name: row.full_name })} style={[styles.box, selected.includes(row.user_id) && styles.boxOn]}>
          {selected.includes(row.user_id) ? <Icon name="check" size={14} color="#fff" /> : null}
        </Pressable>
      ) : null),
    },
    {
      key: 'tid', title: t('Tourist ID'), width: 150,
      render: (row) => (
        <View>
          <Cell strong>{row.tourist_id}</Cell>
          <CellSub>{row.nationality || t('Nationality not set')}</CellSub>
        </View>
      ),
    },
    {
      key: 'name', title: t('Tourist'), flex: 1.4,
      render: (row) => (
        <View>
          <Cell strong>{row.full_name}</Cell>
          <CellSub>{row.email}</CellSub>
          <CellSub>{row.phone}</CellSub>
        </View>
      ),
    },
    {
      key: 'trip', title: t('Trip'), flex: 1.2,
      render: (row) =>
        row.trip ? (
          <View>
            <Cell>{row.trip.destination}</Cell>
            <CellSub>{t('{from} to {to}', { from: formatDate(row.trip.start_date), to: formatDate(row.trip.end_date) })}</CellSub>
            <StatusBadge status={row.trip.status} style={styles.tripBadge} />
          </View>
        ) : null,
    },
    {
      key: 'contacts', title: t('Emergency contacts'), flex: 1.3,
      render: (row) =>
        row.emergency_contacts?.length ? (
          <View>
            {row.emergency_contacts.map((c, i) => (
              <View key={`${c.phone}-${i}`} style={styles.contact}>
                <Cell numberOfLines={1}>{c.name}{c.relationship ? ` (${c.relationship})` : ''}</Cell>
                <CellSub>{c.phone}</CellSub>
              </View>
            ))}
          </View>
        ) : null,
    },
    {
      key: 'account', title: t('Account'), width: 110,
      render: (row) => <StatusBadge status={row.is_active ? 'account_active' : 'inactive'} />,
    },
    {
      key: 'verification', title: t('Verification'), flex: 1.2,
      render: (row) => (
        <View style={styles.verifyCol}>
          <StatusBadge status={row.verification_status} />
          {row.verification_status === 'verified' && row.verified_at ? <CellSub>{t('Verified {date}', { date: formatDate(row.verified_at) })}</CellSub> : null}
          {row.verification_status !== 'verified' && row.verification_requested ? (
            <Pill text={t('Verification requested')} color={colors.accent} soft={colors.accentSoft} />
          ) : null}
          <Text style={styles.ledger}>
            {t('Ledger verification: not connected')}
            {row.record_hash ? ` ${t('(record hash {hash}, {state})', { hash: shortHash(row.record_hash), state: row.ledger_status || t('not recorded') })}` : ''}
          </Text>
        </View>
      ),
    },
    {
      key: 'actions', title: t('Actions'), width: 150,
      render: (row) => (
        <RowActions>
          {row.verification_status === 'verified' ? (
            <Button title={t('Revoke')} icon="x-circle" variant="dangerSoft" small full={false} onPress={() => setConfirm(t)} />
          ) : (
            <Button title={t('Verify')} icon="check-circle" variant="soft" small full={false} onPress={() => setConfirm(t)} />
          )}
        </RowActions>
      ),
    },
  ];

  return (
    <AdminLayout title={t('Tourists')} subtitle={t('Tourist IDs, trips, emergency contacts and identity verification.')}>
      <Flash flash={flash} />
      {waiting.length > 0 ? (
        <View style={styles.banner}>
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>{t(waiting.length === 1 ? '1 verification request waiting' : '{n} verification requests waiting', { n: waiting.length })}</Text>
            <Text style={styles.bannerSub}>{t('Review them one by one, or approve all after checking the documents.')}</Text>
          </View>
          <Button title={t('Review requests')} variant="outline" small full={false} onPress={() => setVerification('pending')} />
          <Button
            title={chosen.length === requestedIds.length ? t('Clear selection') : t('Select all requests')}
            variant="outline" small full={false}
            onPress={() => setSelected(chosen.length === requestedIds.length ? [] : requestedIds)}
          />
          <Button
            title={chosen.length ? t('Verify selected ({n})', { n: chosen.length }) : t('Verify all ({n})', { n: waiting.length })}
            icon="check-circle" small full={false} onPress={() => setBulkOpen(true)}
          />
        </View>
      ) : null}
      <PageToolbar
        search={search}
        onSearch={setSearch}
        placeholder={t('Search name, email or tourist ID')}
        chips={FILTERS}
        chipValue={verification}
        onChip={setVerification}
      />
      <AsyncBody data={data} loading={loading} error={error} onRetry={reload}>
        <DataTable
          columns={columns}
          rows={rows}
          keyExtractor={(row) => row.user_id}
          empty={{
            title: q || verification ? t('No tourists match your filters') : t('No registered tourists yet'),
            message: q || verification ? t('Try a different search or filter.') : t('Tourist IDs are issued when a tourist registers.'),
          }}
        />
      </AsyncBody>
      <ConfirmDialog
        visible={bulkOpen}
        title={t((chosen.length || waiting.length) === 1 ? 'Verify 1 tourist?' : 'Verify {n} tourists?', { n: chosen.length || waiting.length })}
        message={chosen.length ? t('The selected tourists will be marked as verified and notified. Confirm only after checking their documents.') : t('Every tourist with an open request will be marked as verified and notified. Confirm only after checking their documents.')}
        confirmLabel={chosen.length ? t('Verify selected') : t('Verify all')}
        loading={busy}
        onConfirm={verifyAll}
        onCancel={() => setBulkOpen(false)}
      />
      <ConfirmDialog
        visible={!!confirm}
        danger={!verifying}
        title={verifying ? t('Verify this tourist?') : t('Revoke verification?')}
        message={
          verifying
            ? t('{name} will be marked as verified and notified. Confirm only after checking their documents.', { name: confirm?.full_name })
            : t('{name} will return to pending verification.', { name: confirm?.full_name })
        }
        confirmLabel={verifying ? t('Verify tourist') : t('Revoke')}
        loading={busy}
        onConfirm={apply}
        onCancel={() => setConfirm(null)}
      />
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, padding: 14, marginBottom: 14,
    borderRadius: 14, borderWidth: 1, borderColor: colors.accent, backgroundColor: colors.accentSoft,
  },
  box: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  boxOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  bannerText: { flex: 1, minWidth: 220 },
  bannerTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
  bannerSub: { color: colors.textSoft, fontSize: 12, marginTop: 2 },
  tripBadge: { marginTop: 4 },
  contact: { marginBottom: 4 },
  verifyCol: { gap: 4 },
  ledger: { color: colors.muted, fontSize: 11, lineHeight: 15 },
});
