import { t } from '../i18n';
import React, { useState } from 'react';
import { Linking, StyleSheet, Switch, Text, View } from 'react-native';

import Button from '../components/Button';
import Card from '../components/Card';
import Header, { IconButton } from '../components/Header';
import Icon from '../components/Icon';
import Input from '../components/Input';
import ScreenContainer from '../components/ScreenContainer';
import { ConfirmDialog, Sheet } from '../components/Sheet';
import { EmptyState, ErrorState, InlineMessage, Loading } from '../components/States';
import { useApi } from '../hooks/useApi';
import { contactsApi } from '../services/touristService';
import { colors } from '../utils/constants';
import { hasErrors, required, validatePhone } from '../utils/validation';
import { goBack } from '../utils/nav';

const blank = { name: '', phone: '', relationship: '', is_primary: false };

export default function EmergencyContactsScreen({ navigation }) {
  const contacts = useApi(contactsApi.list);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState({ tone: 'success', text: '' });

  const open = (contact) => {
    setErrors({});
    setFormError('');
    setForm(contact ? { name: contact.name, phone: contact.phone, relationship: contact.relationship, is_primary: contact.is_primary } : blank);
    setEditing(contact || {});
  };
  const set = (key) => (value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  const save = async () => {
    const found = { name: required(form.name, t('Name')), phone: validatePhone(form.phone), relationship: required(form.relationship, t('Relationship')) };
    setErrors(found);
    if (hasErrors(found)) return;
    setSaving(true);
    setFormError('');
    try {
      const payload = { ...form, name: form.name.trim(), phone: form.phone.trim(), relationship: form.relationship.trim() };
      if (editing && editing.id) await contactsApi.update(editing.id, payload);
      else await contactsApi.create(payload);
      setNotice({ tone: 'success', text: editing && editing.id ? t('Contact updated.') : t('Contact added.') });
      setEditing(null);
      await contacts.reload({ silent: true });
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await contactsApi.remove(removing.id);
      setNotice({ tone: 'success', text: t('Contact removed.') });
      setRemoving(null);
      await contacts.reload({ silent: true });
    } catch (err) {
      setNotice({ tone: 'danger', text: err.message });
      setRemoving(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenContainer
      refreshing={false}
      onRefresh={() => contacts.reload({ silent: true })}
      header={<Header title={t('Emergency Contacts')} subtitle={t('People we reach when you need help')} onBack={() => goBack(navigation)} right={<IconButton icon="plus" label={t('Add contact')} onPress={() => open(null)} />} />}
    >
      <InlineMessage tone={notice.tone}>{notice.text}</InlineMessage>
      {contacts.loading && !contacts.data ? (
        <Loading label={t('Loading contacts…')} />
      ) : contacts.error && !contacts.data ? (
        <ErrorState message={contacts.error} onRetry={contacts.reload} />
      ) : !contacts.data || contacts.data.length === 0 ? (
        <EmptyState icon="users" title={t('No emergency contacts')} message={t('Add someone we can reach if you ever need help.')} action={<Button title={t('Add contact')} icon="plus" small full={false} variant="soft" onPress={() => open(null)} />} />
      ) : (
        contacts.data.map((c) => (
          <Card key={c.id} style={styles.card}>
            <View style={styles.top}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{c.name.slice(0, 1).toUpperCase()}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{c.name}</Text>
                <Text style={styles.muted}>{c.relationship}</Text>
              </View>
              {c.is_primary ? <View style={styles.primary}><Text style={styles.primaryText}>{t('Primary')}</Text></View> : null}
            </View>
            <Text style={styles.phone}>{c.phone}</Text>
            <View style={styles.actions}>
              <Button small icon="phone" title={t('Call')} variant="soft" full={false} onPress={() => Linking.openURL(`tel:${c.phone.replace(/[^\d+]/g, '')}`)} />
              <Button small icon="edit-2" title={t('Edit')} variant="outline" full={false} onPress={() => open(c)} />
              <Button small icon="trash-2" title={t('Delete')} variant="ghost" full={false} style={{ marginLeft: 'auto' }} onPress={() => setRemoving(c)} />
            </View>
          </Card>
        ))
      )}

      <Sheet visible={editing !== null} title={editing && editing.id ? t('Edit contact') : t('Add contact')} onClose={() => setEditing(null)}>
        <InlineMessage>{formError}</InlineMessage>
        <Input label={t('Name')} icon="user" value={form.name} onChangeText={set('name')} error={errors.name} placeholder={t('Full name')} />
        <Input label={t('Phone number')} icon="phone" value={form.phone} onChangeText={set('phone')} error={errors.phone} placeholder="+91 98765 43210" keyboardType="phone-pad" />
        <Input label={t('Relationship')} icon="heart" value={form.relationship} onChangeText={set('relationship')} error={errors.relationship} placeholder={t('Mother, friend, colleague…')} />
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchTitle}>{t('Primary contact')}</Text>
            <Text style={styles.muted}>{t('Shown first and on your Tourist ID.')}</Text>
          </View>
          <Switch value={form.is_primary} onValueChange={set('is_primary')} trackColor={{ true: colors.accent, false: colors.border }} />
        </View>
        <Button title={editing && editing.id ? t('Save changes') : t('Add contact')} loading={saving} onPress={save} style={{ marginTop: 14 }} />
      </Sheet>

      <ConfirmDialog
        visible={!!removing}
        danger
        title={t('Delete this contact?')}
        message={removing ? t('{name} will no longer be contacted in an emergency.', { name: removing.name }) : ''}
        confirmLabel={t('Delete')}
        loading={busy}
        onConfirm={remove}
        onCancel={() => setRemoving(null)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.accent, fontWeight: '800', fontSize: 17 },
  name: { color: colors.text, fontSize: 16, fontWeight: '700' },
  muted: { color: colors.muted, fontSize: 12, marginTop: 2 },
  primary: { backgroundColor: colors.accentSoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  primaryText: { color: colors.accent, fontSize: 11, fontWeight: '700' },
  phone: { color: colors.textSoft, fontSize: 15, fontWeight: '600', marginTop: 14 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 14, alignItems: 'center' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: colors.bg, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  switchTitle: { color: colors.text, fontSize: 14, fontWeight: '600' },
});
