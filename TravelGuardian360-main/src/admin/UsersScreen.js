import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Button from '../components/Button';
import Input from '../components/Input';
import { Sheet, ConfirmDialog } from '../components/Sheet';
import StatusBadge from '../components/StatusBadge';
import { ErrorState, InlineMessage, Loading } from '../components/States';
import { useApi } from '../hooks/useApi';
import { adminApi } from '../services/adminService';
import { colors, radius } from '../utils/constants';
import { formatDate, formatDateTime, timeAgo } from '../utils/format';
import { hasErrors, validateEmail, validateName, validatePhone } from '../utils/validation';
import AdminLayout from './components/AdminLayout';
import {
  AsyncBody, Cell, CellSub, DataTable, Field, FieldGrid, Flash, PageToolbar, RowActions, SectionCard,
  useDebounced, useFlash,
} from './components/ui';
import { t } from '../i18n';

const FILTERS = [
  { value: undefined, label: t('All') },
  { value: 'active', label: t('Active') },
  { value: 'inactive', label: t('Deactivated') },
];

function UserDetailSheet({ userId, onClose }) {
  const [state, setState] = useState({ loading: true, error: '', data: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!userId) return undefined;
    let alive = true;
    setState({ loading: true, error: '', data: null });
    adminApi
      .user(userId)
      .then((data) => alive && setState({ loading: false, error: '', data }))
      .catch((err) => alive && setState({ loading: false, error: err.message, data: null }));
    return () => {
      alive = false;
    };
  }, [userId, attempt]);

  const u = state.data;
  return (
    <Sheet visible={!!userId} title={t('User details')} onClose={onClose} wide>
      {state.loading ? <Loading /> : null}
      {state.error ? <ErrorState message={state.error} onRetry={() => setAttempt((n) => n + 1)} /> : null}
      {u ? (
        <View>
          <View style={styles.detailHead}>
            <View style={styles.flex1}>
              <Text style={styles.detailName}>{u.full_name}</Text>
              <Text style={styles.muted}>{u.email}</Text>
            </View>
            <StatusBadge status={u.is_active ? 'account_active' : 'inactive'} />
          </View>
          <FieldGrid>
            <Field label={t('Phone')}>{u.phone}</Field>
            <Field label={t('Tourist ID')}>{u.tourist_id || '-'}</Field>
            <Field label={t('Registered')}>{formatDate(u.created_at)}</Field>
            <Field label={t('Last sign in')}>{u.last_login_at ? formatDateTime(u.last_login_at) : t('Never')}</Field>
            <Field label={t('Current trip')}>{u.current_trip || t('None')}</Field>
            <Field label={t('Last known location')}>
              {u.last_location ? `${u.last_location.label || t('Unnamed location')} (${timeAgo(u.last_location.recorded_at)})` : t('Not available')}
            </Field>
          </FieldGrid>

          <Text style={styles.sectionLabel}>{t('Emergency contacts')}</Text>
          {(u.contacts || []).length === 0 ? (
            <Text style={styles.muted}>{t('No emergency contacts added.')}</Text>
          ) : (
            u.contacts.map((c) => (
              <View key={c.id} style={styles.item}>
                <Text style={styles.itemTitle}>{c.name}</Text>
                <Text style={styles.muted}>{[c.relationship, c.phone].filter(Boolean).join(' - ')}</Text>
              </View>
            ))
          )}

          <Text style={styles.sectionLabel}>{t('Family members')}</Text>
          {(u.family || []).length === 0 ? (
            <Text style={styles.muted}>{t('No family members added.')}</Text>
          ) : (
            u.family.map((f) => (
              <View key={f.id} style={styles.item}>
                <Text style={styles.itemTitle}>{f.full_name}</Text>
                <Text style={styles.muted}>{[f.relationship, f.phone, f.is_travelling ? t('Travelling') : t('Not travelling')].filter(Boolean).join(' - ')}</Text>
              </View>
            ))
          )}

          <Text style={styles.sectionLabel}>{t('Trips')}</Text>
          {(u.trips || []).length === 0 ? (
            <Text style={styles.muted}>{t('No trips planned.')}</Text>
          ) : (
            u.trips.map((trip) => (
              <View key={trip.id} style={styles.item}>
                <View style={styles.itemRow}>
                  <Text style={[styles.itemTitle, styles.flex1]}>{trip.destination}</Text>
                  <StatusBadge status={trip.status} />
                </View>
                <Text style={styles.muted}>{t('{from} to {to}', { from: formatDate(trip.start_date), to: formatDate(trip.end_date) })}</Text>
              </View>
            ))
          )}

          <Text style={styles.sectionLabel}>{t('SOS history')}</Text>
          {(u.sos_history || []).length === 0 ? (
            <Text style={styles.muted}>{t('No emergency requests.')}</Text>
          ) : (
            u.sos_history.map((s) => (
              <View key={s.id} style={styles.item}>
                <View style={styles.itemRow}>
                  <Text style={[styles.itemTitle, styles.flex1]}>{s.location_label || t('Location unavailable')}</Text>
                  <StatusBadge status={s.status} />
                </View>
                <Text style={styles.muted}>{formatDateTime(s.created_at)}</Text>
              </View>
            ))
          )}
        </View>
      ) : null}
    </Sheet>
  );
}

function UserEditSheet({ user, onClose, onSaved }) {
  const [form, setForm] = useState({ full_name: '', email: '', phone: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({ full_name: user.full_name || '', email: user.email || '', phone: user.phone || '' });
      setErrors({});
      setFormError('');
    }
  }, [user]);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    const next = {
      full_name: validateName(form.full_name),
      email: validateEmail(form.email),
      phone: validatePhone(form.phone),
    };
    setErrors(next);
    setFormError('');
    if (hasErrors(next)) return;
    setSaving(true);
    try {
      await adminApi.updateUser(user.id, {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      });
      onSaved(t('User details updated.'));
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet visible={!!user} title={t('Edit user')} onClose={onClose}>
      <InlineMessage>{formError}</InlineMessage>
      <Input label={t('Full name')} value={form.full_name} onChangeText={set('full_name')} error={errors.full_name} icon="user" />
      <Input
        label={t('Email')}
        value={form.email}
        onChangeText={set('email')}
        error={errors.email}
        icon="mail"
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <Input label={t('Phone')} value={form.phone} onChangeText={set('phone')} error={errors.phone} icon="phone" keyboardType="phone-pad" />
      <View style={styles.formActions}>
        <Button title={t('Cancel')} variant="outline" onPress={onClose} style={styles.flex1} />
        <Button title={t('Save changes')} onPress={save} loading={saving} style={styles.flex1} />
      </View>
    </Sheet>
  );
}

export default function UsersScreen() {
  const [search, setSearch] = useState('');
  const [account, setAccount] = useState(undefined);
  const q = useDebounced(search.trim(), 300);
  const { data, loading, error, reload } = useApi(() => adminApi.users({ q: q || undefined, account }), [q, account]);
  const [flash, setFlash] = useFlash();

  const [viewId, setViewId] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [confirm, setConfirm] = useState(null); // { type: 'toggle' | 'delete', user }
  const [busy, setBusy] = useState(false);

  const rows = data || [];

  const runConfirm = async () => {
    if (!confirm) return;
    const { type, user } = confirm;
    setBusy(true);
    try {
      if (type === 'delete') {
        await adminApi.deleteUser(user.id);
        setFlash('safe', t('{name} was deleted permanently.', { name: user.full_name }));
      } else {
        await adminApi.updateUser(user.id, { is_active: !user.is_active });
        setFlash('safe', t(user.is_active ? '{name} was deactivated.' : '{name} was reactivated.', { name: user.full_name }));
      }
      setConfirm(null);
      reload({ silent: true });
    } catch (err) {
      setConfirm(null);
      setFlash('danger', err.message);
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    {
      key: 'name', title: t('Name'), flex: 1.4,
      render: (u) => (
        <View>
          <Cell strong>{u.full_name}</Cell>
        </View>
      ),
    },
    { key: 'email', title: t('Email'), flex: 1.6, render: (u) => <Cell>{u.email}</Cell> },
    { key: 'phone', title: t('Phone'), width: 140, render: (u) => <Cell>{u.phone}</Cell> },
    { key: 'tid', title: t('Tourist ID'), width: 130, render: (u) => <Cell>{u.tourist_id}</Cell> },
    {
      key: 'status', title: t('Account'), width: 120,
      render: (u) => <StatusBadge status={u.is_active ? 'account_active' : 'inactive'} />,
    },
    { key: 'registered', title: t('Registered'), width: 110, render: (u) => <Cell>{formatDate(u.created_at)}</Cell> },
    { key: 'trip', title: t('Current trip'), width: 130, render: (u) => <Cell>{u.current_trip}</Cell> },
    {
      key: 'location', title: t('Last known location'), flex: 1.4,
      render: (u) =>
        u.last_location ? (
          <View>
            <Cell>{u.last_location.label || t('Unnamed location')}</Cell>
            <CellSub>{timeAgo(u.last_location.recorded_at)}</CellSub>
          </View>
        ) : null,
    },
    {
      key: 'actions', title: t('Actions'), width: 330,
      render: (u) => (
        <RowActions>
          <Button title={t('View')} icon="eye" variant="soft" small full={false} onPress={() => setViewId(u.id)} />
          <Button title={t('Edit')} icon="edit-2" variant="outline" small full={false} onPress={() => setEditUser(u)} />
          <Button
            title={u.is_active ? t('Deactivate') : t('Reactivate')}
            variant="outline"
            small
            full={false}
            onPress={() => setConfirm({ type: 'toggle', user: u })}
          />
          <Button title={t('Delete')} variant="dangerSoft" small full={false} onPress={() => setConfirm({ type: 'delete', user: u })} />
        </RowActions>
      ),
    },
  ];

  const target = confirm?.user;
  const isDelete = confirm?.type === 'delete';

  return (
    <AdminLayout title={t('Users')} subtitle={t('Tourist accounts registered with TravelGuardian360.')}>
      <Flash flash={flash} />
      <PageToolbar
        search={search}
        onSearch={setSearch}
        placeholder={t('Search name, email, phone or tourist ID')}
        chips={FILTERS}
        chipValue={account}
        onChip={setAccount}
      />
      <AsyncBody data={data} loading={loading} error={error} onRetry={reload}>
        <DataTable
          columns={columns}
          rows={rows}
          empty={{
            title: q || account ? t('No users match your filters') : t('No users yet'),
            message: q || account ? t('Try a different search or filter.') : t('Tourists appear here after they register.'),
          }}
        />
      </AsyncBody>

      <UserDetailSheet userId={viewId} onClose={() => setViewId(null)} />
      <UserEditSheet
        user={editUser}
        onClose={() => setEditUser(null)}
        onSaved={(message) => {
          setEditUser(null);
          setFlash('safe', message);
          reload({ silent: true });
        }}
      />
      <ConfirmDialog
        visible={!!confirm}
        danger={isDelete || target?.is_active}
        title={isDelete ? t('Delete this user?') : target?.is_active ? t('Deactivate this account?') : t('Reactivate this account?')}
        message={
          isDelete
            ? t('{name} and all of their trips, contacts, locations and emergency history will be removed permanently. This cannot be undone.', { name: target?.full_name })
            : target?.is_active
              ? t('{name} will no longer be able to sign in until the account is reactivated.', { name: target?.full_name })
              : t('{name} will be able to sign in again.', { name: target?.full_name })
        }
        confirmLabel={isDelete ? t('Delete permanently') : target?.is_active ? t('Deactivate') : t('Reactivate')}
        loading={busy}
        onConfirm={runConfirm}
        onCancel={() => setConfirm(null)}
      />
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  detailHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  detailName: { color: colors.text, fontSize: 18, fontWeight: '800' },
  sectionLabel: { color: colors.textSoft, fontSize: 13, fontWeight: '700', marginTop: 12, marginBottom: 8 },
  item: { backgroundColor: colors.cardAlt, borderRadius: radius.md, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemTitle: { color: colors.text, fontSize: 14, fontWeight: '600', marginBottom: 2 },
  formActions: { flexDirection: 'row', gap: 10, marginTop: 6 },
});
