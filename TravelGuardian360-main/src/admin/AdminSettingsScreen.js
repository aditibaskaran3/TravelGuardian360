import { t } from '../i18n';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Button from '../components/Button';
import { Avatar } from '../components/Header';
import Input from '../components/Input';
import { InlineMessage } from '../components/States';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { adminApi } from '../services/adminService';
import { colors } from '../utils/constants';
import { formatDate, formatDateTime } from '../utils/format';
import { hasErrors, validatePassword } from '../utils/validation';
import AdminLayout from './components/AdminLayout';
import { AsyncBody, Cell, CellSub, DataTable, Field, FieldGrid, SectionCard } from './components/ui';
import LanguagePicker from '../components/LanguagePicker';

const humanize = (action = '') => {
  const text = action.replace(/_/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
};

function PasswordForm() {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async () => {
    const next = {
      current: form.current ? '' : t('Enter your current password.'),
      next: validatePassword(form.next),
      confirm: form.confirm === form.next ? '' : t('Passwords do not match.'),
    };
    if (!next.next && form.next === form.current) next.next = t('Choose a password different from the current one.');
    setErrors(next);
    setMessage(null);
    if (hasErrors(next)) return;
    setSaving(true);
    try {
      await adminApi.changePassword({ current_password: form.current, new_password: form.next });
      setForm({ current: '', next: '', confirm: '' });
      setMessage({ tone: 'safe', text: t('Your password was changed.') });
    } catch (err) {
      setMessage({ tone: 'danger', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View>
      {message ? <InlineMessage tone={message.tone}>{message.text}</InlineMessage> : null}
      <Input label={t('Current password')} value={form.current} onChangeText={set('current')} error={errors.current} icon="lock" secure />
      <Input
        label={t('New password')} value={form.next} onChangeText={set('next')} error={errors.next} icon="key" secure
        hint={t('At least 8 characters with letters and numbers.')}
      />
      <Input label={t('Confirm new password')} value={form.confirm} onChangeText={set('confirm')} error={errors.confirm} icon="key" secure onSubmitEditing={submit} />
      <Button title={t('Change password')} icon="check" onPress={submit} loading={saving} full={false} />
    </View>
  );
}

export default function AdminSettingsScreen() {
  const { user, logout } = useAuth();
  const { data, loading, error, reload } = useApi(() => adminApi.auditLogs(), []);

  const columns = [
    { key: 'when', title: t('When'), width: 150, render: (r) => <Cell>{formatDateTime(r.created_at)}</Cell> },
    { key: 'action', title: t('Action'), flex: 1.2, render: (r) => <Cell strong>{humanize(r.action)}</Cell> },
    { key: 'admin', title: t('Administrator'), flex: 1, render: (r) => <Cell>{r.admin}</Cell> },
    {
      key: 'target', title: t('Tourist'), flex: 1,
      render: (r) => (r.target ? <View><Cell>{r.target}</Cell>{r.detail ? <CellSub>{r.detail}</CellSub> : null}</View> : null),
    },
  ];

  return (
    <AdminLayout title={t('Settings')} subtitle={t('Your administrator account, password and the access log.')}>
      <View style={styles.grid}>
        <SectionCard title={t('Account')} style={styles.col}>
          <View style={styles.profile}>
            <Avatar name={user?.full_name} size={52} />
            <View style={styles.flex1}>
              <Text style={styles.name}>{user?.full_name}</Text>
              <Text style={styles.muted}>{t('Administrator')}</Text>
            </View>
          </View>
          <FieldGrid>
            <Field label={t('Email')}>{user?.email}</Field>
            <Field label={t('Phone')}>{user?.phone || '-'}</Field>
            <Field label={t('Last sign in')}>{user?.last_login_at ? formatDateTime(user.last_login_at) : '-'}</Field>
            <Field label={t('Account created')}>{formatDate(user?.created_at)}</Field>
          </FieldGrid>
          <Button title={t('Logout')} icon="log-out" variant="outline" full={false} onPress={logout} />
        </SectionCard>

        <View style={styles.col}>
          <SectionCard title={t('Appearance')}>
            <ThemeToggle />
          </SectionCard>
          <SectionCard title={t('Language')} style={{ marginTop: 16 }}>
            <LanguagePicker />
          </SectionCard>
          <SectionCard title={t('Change password')} style={{ marginTop: 16 }}>
            <PasswordForm />
          </SectionCard>
        </View>
      </View>

      <SectionCard
        title={t('Access log')}
        subtitle={t('Tourist medical details can only be opened during an open emergency, and every read is recorded here with the administrator and the request. Account changes, verifications and deletions are logged too.')}
        style={styles.logCard}
        padded={false}
        right={<Button title={t('Refresh')} icon="refresh-cw" variant="ghost" small full={false} onPress={() => reload({ silent: true })} />}
      >
        <View style={styles.logBody}>
          <AsyncBody data={data} loading={loading} error={error} onRetry={reload}>
            <DataTable
              columns={columns}
              rows={data || []}
              empty={{ title: t('No access events yet'), message: t('Sensitive actions will be listed here.') }}
            />
          </AsyncBody>
        </View>
      </SectionCard>
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1, minWidth: 0 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  col: { flexGrow: 1, flexBasis: 360 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  name: { color: colors.text, fontSize: 17, fontWeight: '800' },
  muted: { color: colors.muted, fontSize: 13 },
  logCard: { marginTop: 12 },
  logBody: { padding: 16, paddingTop: 12 },
});
