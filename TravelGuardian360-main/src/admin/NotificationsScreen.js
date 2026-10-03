import { t } from '../i18n';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import Button from '../components/Button';
import Icon from '../components/Icon';
import Input from '../components/Input';
import { ConfirmDialog, Sheet } from '../components/Sheet';
import { EmptyState, InlineMessage, Loading } from '../components/States';
import { useApi } from '../hooks/useApi';
import { adminApi } from '../services/adminService';
import { NOTIFICATION_TYPES, colors, radius } from '../utils/constants';
import { formatDateTime } from '../utils/format';
import AdminLayout from './components/AdminLayout';
import {
  AsyncBody, Cell, CellSub, DataTable, Flash, FilterChips, Label, Pill, RowActions, useDebounced, useFlash,
} from './components/ui';

const TYPE_ORDER = ['safety', 'weather', 'travel', 'general', 'emergency'];
const TYPE_OPTIONS = TYPE_ORDER.map((t) => ({ value: t, label: NOTIFICATION_TYPES[t].label }));

function TypePill({ type }) {
  const meta = NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.general;
  return <Pill text={meta.label} color={meta.color} soft={`${meta.color}22`} />;
}

function RecipientPicker({ selected, onToggle }) {
  const [search, setSearch] = useState('');
  const q = useDebounced(search.trim(), 300);
  const [state, setState] = useState({ loading: true, error: '', rows: [] });

  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: '' }));
    adminApi
      .users({ q: q || undefined, account: 'active' })
      .then((rows) => alive && setState({ loading: false, error: '', rows: rows || [] }))
      .catch((err) => alive && setState({ loading: false, error: err.message, rows: [] }));
    return () => {
      alive = false;
    };
  }, [q]);

  return (
    <View>
      <Input value={search} onChangeText={setSearch} placeholder={t('Search tourists')} icon="search" style={styles.pickerSearch} autoCapitalize="none" />
      <InlineMessage>{state.error}</InlineMessage>
      <View style={styles.picker}>
        {state.loading && state.rows.length === 0 ? (
          <Loading style={styles.pickerState} />
        ) : state.rows.length === 0 ? (
          <EmptyState icon="users" title={t('No tourists found')} style={styles.pickerState} />
        ) : (
          <ScrollView nestedScrollEnabled style={styles.pickerScroll}>
            {state.rows.map((u) => {
              const on = !!selected[u.id];
              return (
                <Pressable key={u.id} onPress={() => onToggle(u)} style={[styles.pickRow, on && styles.pickRowOn]} accessibilityRole="checkbox" accessibilityState={{ checked: on }}>
                  <Icon name={on ? 'check-square' : 'square'} size={18} color={on ? colors.accent : colors.muted} />
                  <View style={styles.flex1}>
                    <Text style={styles.pickName} numberOfLines={1}>{u.full_name}</Text>
                    <Text style={styles.pickSub} numberOfLines={1}>{u.email}</Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

function NotificationSheet({ visible, notification, onClose, onSaved }) {
  const editing = !!notification;
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('general');
  const [everyone, setEveryone] = useState(true);
  const [selected, setSelected] = useState({});
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setErrors({});
    setFormError('');
    setSelected({});
    setEveryone(true);
    setTitle(notification?.title || '');
    setMessage(notification?.message || '');
    setType(notification?.type || 'general');
  }, [visible, notification]);

  const toggle = (user) =>
    setSelected((s) => {
      const next = { ...s };
      if (next[user.id]) delete next[user.id];
      else next[user.id] = user.full_name;
      return next;
    });

  const selectedCount = Object.keys(selected).length;

  const save = async () => {
    const next = {
      title: title.trim().length < 2 ? t('Title is required.') : '',
      message: message.trim().length < 2 ? t('Message is required.') : '',
      recipients: !editing && !everyone && selectedCount === 0 ? t('Select at least one tourist.') : '',
    };
    setErrors(next);
    setFormError('');
    if (next.title || next.message || next.recipients) return;
    setSaving(true);
    try {
      if (editing) {
        await adminApi.updateNotification(notification.id, { title: title.trim(), message: message.trim(), type });
        onSaved(t('Notification updated.'));
      } else {
        await adminApi.createNotification({
          title: title.trim(),
          message: message.trim(),
          type,
          target_all: everyone,
          target_user_ids: everyone ? [] : Object.keys(selected).map(Number),
        });
        onSaved(everyone ? t('Notification sent to all tourists.') : t(selectedCount === 1 ? 'Notification sent to 1 tourist.' : 'Notification sent to {n} tourists.', { n: selectedCount }));
      }
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet visible={visible} title={editing ? t('Edit notification') : t('Create notification')} onClose={onClose} wide>
      <InlineMessage>{formError}</InlineMessage>
      {editing ? (
        <InlineMessage tone="warn">{t('Editing changes the text shown to recipients. The audience cannot be changed.')}</InlineMessage>
      ) : null}
      <Input label={t('Title')} value={title} onChangeText={setTitle} error={errors.title} maxLength={150} />
      <Input label={t('Message')} value={message} onChangeText={setMessage} error={errors.message} multiline maxLength={2000} />
      <Label>{t('Type')}</Label>
      <FilterChips options={type === 'trip' ? [...TYPE_OPTIONS, { value: 'trip', label: NOTIFICATION_TYPES.trip.label }] : TYPE_OPTIONS} value={type} onChange={setType} />
      <View style={styles.gap} />
      {!editing ? (
        <>
          <Label>{t('Target users')}</Label>
          <Pressable onPress={() => setEveryone((v) => !v)} style={styles.toggleRow} accessibilityRole="switch" accessibilityState={{ checked: everyone }}>
            <Icon name={everyone ? 'check-square' : 'square'} size={18} color={everyone ? colors.accent : colors.muted} />
            <Text style={styles.toggleText}>{t('Send to everyone')}</Text>
          </Pressable>
          {!everyone ? (
            <View>
              <Text style={styles.selectedCount}>{t(selectedCount === 1 ? '1 tourist selected' : '{n} tourists selected', { n: selectedCount })}</Text>
              <RecipientPicker selected={selected} onToggle={toggle} />
              {errors.recipients ? <Text style={styles.error}>{errors.recipients}</Text> : null}
            </View>
          ) : null}
          <View style={styles.gap} />
        </>
      ) : null}
      <View style={styles.formActions}>
        <Button title={t('Cancel')} variant="outline" onPress={onClose} style={styles.flex1} />
        <Button title={editing ? t('Save changes') : t('Send notification')} icon={editing ? 'save' : 'send'} onPress={save} loading={saving} style={styles.flex1} />
      </View>
    </Sheet>
  );
}

export default function NotificationsScreen() {
  const { data, loading, error, reload } = useApi(() => adminApi.notifications(), []);
  const [flash, setFlash] = useFlash();
  const [sheet, setSheet] = useState({ open: false, notification: null });
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    setBusy(true);
    try {
      await adminApi.deleteNotification(deleting.id);
      setFlash('safe', t('Notification deleted.'));
      setDeleting(null);
      reload({ silent: true });
    } catch (err) {
      setDeleting(null);
      setFlash('danger', err.message);
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    {
      key: 'title', title: t('Notification'), flex: 2,
      render: (n) => (
        <View>
          <Cell strong>{n.title}</Cell>
          <Text style={styles.preview} numberOfLines={2}>{n.message}</Text>
        </View>
      ),
    },
    { key: 'type', title: t('Type'), width: 130, render: (n) => <TypePill type={n.type} /> },
    {
      key: 'audience', title: t('Audience'), flex: 1,
      render: (n) =>
        n.target_all ? (
          <Cell>{t('Everyone')}</Cell>
        ) : (
          <View>
            <Cell>{t(n.recipient_count === 1 ? '1 tourist' : '{n} tourists', { n: n.recipient_count })}</Cell>
            {n.recipients?.length ? <CellSub>{n.recipients.join(', ')}{n.recipient_count > n.recipients.length ? '...' : ''}</CellSub> : null}
          </View>
        ),
    },
    { key: 'reads', title: t('Read'), width: 100, render: (n) => <Cell>{t('{read} of {total}', { read: n.read_count, total: n.recipient_count })}</Cell> },
    { key: 'date', title: t('Sent'), width: 140, render: (n) => <Cell>{formatDateTime(n.created_at)}</Cell> },
    {
      key: 'actions', title: t('Actions'), width: 200,
      render: (n) => (
        <RowActions>
          <Button title={t('Edit')} icon="edit-2" variant="soft" small full={false} onPress={() => setSheet({ open: true, notification: n })} />
          <Button title={t('Delete')} variant="dangerSoft" small full={false} onPress={() => setDeleting(n)} />
        </RowActions>
      ),
    },
  ];

  return (
    <AdminLayout
      title={t('Notifications')}
      subtitle={t('Send safety, weather and travel alerts to tourists.')}
      actions={<Button title={t('Create notification')} icon="plus" small full={false} onPress={() => setSheet({ open: true, notification: null })} />}
    >
      <Flash flash={flash} />
      <AsyncBody data={data} loading={loading} error={error} onRetry={reload}>
        <DataTable
          columns={columns}
          rows={data || []}
          empty={{ title: t('No notifications yet'), message: t('Create a notification to alert tourists.') }}
        />
      </AsyncBody>
      <NotificationSheet
        visible={sheet.open}
        notification={sheet.notification}
        onClose={() => setSheet({ open: false, notification: null })}
        onSaved={(text) => {
          setSheet({ open: false, notification: null });
          setFlash('safe', text);
          reload({ silent: true });
        }}
      />
      <ConfirmDialog
        visible={!!deleting}
        danger
        title={t('Delete this notification?')}
        message={t('"{title}" will be removed from every recipient\'s inbox. This cannot be undone.', { title: deleting?.title })}
        confirmLabel={t('Delete')}
        loading={busy}
        onConfirm={remove}
        onCancel={() => setDeleting(null)}
      />
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1, minWidth: 0 },
  gap: { height: 14 },
  preview: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 2 },
  formActions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 40 },
  toggleText: { color: colors.text, fontSize: 14, fontWeight: '600' },
  selectedCount: { color: colors.muted, fontSize: 12, marginBottom: 8 },
  pickerSearch: { marginBottom: 8 },
  picker: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.bg, overflow: 'hidden' },
  pickerScroll: { maxHeight: 240 },
  pickerState: { paddingVertical: 20 },
  pickRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  pickRowOn: { backgroundColor: colors.accentSoft },
  pickName: { color: colors.text, fontSize: 14, fontWeight: '600' },
  pickSub: { color: colors.muted, fontSize: 12 },
  error: { color: colors.danger, fontSize: 12, marginTop: 6 },
});
