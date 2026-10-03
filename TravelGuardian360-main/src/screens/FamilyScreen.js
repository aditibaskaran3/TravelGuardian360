import React, { useState } from 'react';
import { Linking, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import Button from '../components/Button';
import Card from '../components/Card';
import DateField from '../components/DateField';
import Header, { IconButton } from '../components/Header';
import Icon from '../components/Icon';
import Input from '../components/Input';
import ScreenContainer from '../components/ScreenContainer';
import { ConfirmDialog, Sheet } from '../components/Sheet';
import { EmptyState, ErrorState, InlineMessage, Loading } from '../components/States';
import { useApi } from '../hooks/useApi';
import { t } from '../i18n';
import { familyApi } from '../services/touristService';
import { BLOOD_GROUPS, colors } from '../utils/constants';
import { formatDate } from '../utils/format';
import { goBack } from '../utils/nav';
import { hasErrors, required, validateDate, validatePhone } from '../utils/validation';

const blank = {
  full_name: '', relationship: '', date_of_birth: '', phone: '', nationality: '', passport_number: '',
  blood_group: '', allergies: '', medical_notes: '', is_travelling: true,
};

function ageFrom(dob) {
  if (!dob) return null;
  const born = new Date(`${dob}T00:00:00`);
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  if (now.getMonth() < born.getMonth() || (now.getMonth() === born.getMonth() && now.getDate() < born.getDate())) age -= 1;
  return age;
}

export default function FamilyScreen({ navigation }) {
  const family = useApi(familyApi.list);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState({ tone: 'success', text: '' });

  const open = (member) => {
    setErrors({});
    setFormError('');
    setForm(member ? {
      full_name: member.full_name, relationship: member.relationship, date_of_birth: member.date_of_birth || '',
      phone: member.phone || '', nationality: member.nationality || '', passport_number: member.passport_number || '',
      blood_group: member.blood_group || '', allergies: member.allergies || '', medical_notes: member.medical_notes || '',
      is_travelling: member.is_travelling,
    } : blank);
    setEditing(member || {});
  };
  const set = (key) => (value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  const save = async () => {
    const found = {
      full_name: required(form.full_name, t('Name')),
      relationship: required(form.relationship, t('Relationship')),
      date_of_birth: form.date_of_birth ? validateDate(form.date_of_birth, t('Date of birth')) : '',
      phone: form.phone.trim() ? validatePhone(form.phone) : '',
    };
    setErrors(found);
    if (hasErrors(found)) return;
    setSaving(true);
    setFormError('');
    try {
      const payload = { ...form, date_of_birth: form.date_of_birth || null, blood_group: form.blood_group || null };
      if (editing && editing.id) await familyApi.update(editing.id, payload);
      else await familyApi.create(payload);
      setNotice({ tone: 'success', text: editing && editing.id ? t('Family member updated.') : t('Family member added.') });
      setEditing(null);
      await family.reload({ silent: true });
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await familyApi.remove(removing.id);
      setNotice({ tone: 'success', text: t('Family member removed.') });
      setRemoving(null);
      await family.reload({ silent: true });
    } catch (err) {
      setNotice({ tone: 'danger', text: err.message });
      setRemoving(null);
    } finally {
      setBusy(false);
    }
  };

  const members = family.data || [];

  return (
    <ScreenContainer
      refreshing={false}
      onRefresh={() => family.reload({ silent: true })}
      header={<Header title={t('Family Members')} subtitle={t('People travelling with you')} onBack={() => goBack(navigation)} right={<IconButton icon="user-plus" label={t('Add family member')} onPress={() => open(null)} />} />}
    >
      <View style={styles.note}>
        <Icon name="users" size={16} color={colors.accent} />
        <Text style={styles.noteText}>{t('Family members travelling with you are included in your emergency details if you send an SOS.')}</Text>
      </View>
      <InlineMessage tone={notice.tone}>{notice.text}</InlineMessage>

      {family.loading && !family.data ? (
        <Loading label={t('Loading family members…')} />
      ) : family.error && !family.data ? (
        <ErrorState message={family.error} onRetry={family.reload} />
      ) : members.length === 0 ? (
        <EmptyState
          icon="users"
          title={t('No family members yet')}
          message={t('Add the people you are travelling with so help can reach everyone.')}
          action={<Button title={t('Add family member')} icon="user-plus" small full={false} variant="soft" onPress={() => open(null)} />}
        />
      ) : (
        members.map((m) => {
          const age = ageFrom(m.date_of_birth);
          return (
            <Card key={m.id} style={styles.card}>
              <View style={styles.top}>
                <View style={styles.avatar}><Text style={styles.avatarText}>{m.full_name.slice(0, 1).toUpperCase()}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{m.full_name}</Text>
                  <Text style={styles.muted}>{m.relationship}{age != null ? ` · ${t('{n} years', { n: age })}` : ''}</Text>
                </View>
                <View style={[styles.tag, !m.is_travelling && styles.tagOff]}>
                  <Text style={[styles.tagText, !m.is_travelling && { color: colors.muted }]}>{m.is_travelling ? t('Travelling') : t('Not travelling')}</Text>
                </View>
              </View>
              <View style={styles.details}>
                {m.date_of_birth ? <Row icon="calendar" text={formatDate(m.date_of_birth)} /> : null}
                {m.nationality ? <Row icon="flag" text={m.nationality} /> : null}
                {m.passport_number ? <Row icon="book" text={`${t('Passport')}: ${m.passport_number}`} /> : null}
                {m.blood_group ? <Row icon="droplet" text={`${t('Blood group')}: ${m.blood_group}`} /> : null}
                {m.allergies ? <Row icon="alert-circle" text={`${t('Allergies')}: ${m.allergies}`} /> : null}
                {m.medical_notes ? <Row icon="file-text" text={m.medical_notes} /> : null}
              </View>
              <View style={styles.actions}>
                {m.phone ? <Button small icon="phone" title={t('Call')} variant="soft" full={false} onPress={() => Linking.openURL(`tel:${m.phone.replace(/[^\d+]/g, '')}`)} /> : null}
                <Button small icon="edit-2" title={t('Edit')} variant="outline" full={false} onPress={() => open(m)} />
                <Button small icon="trash-2" title={t('Delete')} variant="ghost" full={false} style={{ marginLeft: 'auto' }} onPress={() => setRemoving(m)} />
              </View>
            </Card>
          );
        })
      )}

      <Sheet visible={editing !== null} title={editing && editing.id ? t('Edit family member') : t('Add family member')} onClose={() => setEditing(null)}>
        <InlineMessage>{formError}</InlineMessage>
        <Input label={t('Full name')} icon="user" value={form.full_name} onChangeText={set('full_name')} error={errors.full_name} placeholder={t('As shown on their passport')} />
        <Input label={t('Relationship')} icon="heart" value={form.relationship} onChangeText={set('relationship')} error={errors.relationship} placeholder={t('Spouse, child, parent, sibling…')} />
        <DateField label={t('Date of birth')} value={form.date_of_birth} onChange={set('date_of_birth')} error={errors.date_of_birth} />
        <Input label={t('Phone number')} icon="phone" value={form.phone} onChangeText={set('phone')} error={errors.phone} placeholder="+91 98765 43210" keyboardType="phone-pad" hint={t('Optional. Leave empty for young children.')} />
        <Input label={t('Nationality')} icon="flag" value={form.nationality} onChangeText={set('nationality')} />
        <Input label={t('Passport number')} icon="book" value={form.passport_number} onChangeText={set('passport_number')} autoCapitalize="characters" />
        <Text style={styles.formLabel}>{t('Blood group')}</Text>
        <View style={styles.groups}>
          {BLOOD_GROUPS.map((g) => (
            <Pressable key={g} onPress={() => set('blood_group')(form.blood_group === g ? '' : g)} style={[styles.group, form.blood_group === g && styles.groupActive]}>
              <Text style={[styles.groupText, form.blood_group === g && { color: '#fff' }]}>{g}</Text>
            </Pressable>
          ))}
        </View>
        <Input label={t('Allergies')} icon="alert-circle" multiline value={form.allergies} onChangeText={set('allergies')} />
        <Input label={t('Medical notes')} icon="file-text" multiline value={form.medical_notes} onChangeText={set('medical_notes')} placeholder={t('Conditions or medication responders should know')} />
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchTitle}>{t('Travelling with me')}</Text>
            <Text style={styles.muted}>{t('Included in your emergency details.')}</Text>
          </View>
          <Switch value={form.is_travelling} onValueChange={set('is_travelling')} trackColor={{ true: colors.accent, false: colors.border }} />
        </View>
        <Button title={editing && editing.id ? t('Save changes') : t('Add family member')} loading={saving} onPress={save} style={{ marginTop: 14 }} />
      </Sheet>

      <ConfirmDialog
        visible={!!removing}
        danger
        title={t('Remove this family member?')}
        message={removing ? t('{name} will be removed from your family details.', { name: removing.full_name }) : ''}
        confirmLabel={t('Delete')}
        loading={busy}
        onConfirm={remove}
        onCancel={() => setRemoving(null)}
      />
    </ScreenContainer>
  );
}

const Row = ({ icon, text }) => (
  <View style={styles.row}>
    <Icon name={icon} size={14} color={colors.muted} />
    <Text style={styles.rowText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  note: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', padding: 12, borderRadius: 12, backgroundColor: colors.accentSoft, marginBottom: 14 },
  noteText: { color: colors.textSoft, fontSize: 12, lineHeight: 18, flex: 1 },
  card: { marginBottom: 12 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.accent, fontWeight: '800', fontSize: 17 },
  name: { color: colors.text, fontSize: 16, fontWeight: '700' },
  muted: { color: colors.muted, fontSize: 12, marginTop: 2 },
  tag: { backgroundColor: colors.safeSoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  tagOff: { backgroundColor: colors.cardAlt },
  tagText: { color: colors.safe, fontSize: 11, fontWeight: '700' },
  details: { marginTop: 14, gap: 8 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  rowText: { color: colors.textSoft, fontSize: 13, flex: 1, lineHeight: 18 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 14, alignItems: 'center' },
  formLabel: { color: colors.textSoft, fontSize: 13, fontWeight: '600', marginBottom: 8 },
  groups: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  group: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg, cursor: 'pointer' },
  groupActive: { backgroundColor: colors.danger, borderColor: colors.danger },
  groupText: { color: colors.textSoft, fontWeight: '700', fontSize: 14 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: colors.bg, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  switchTitle: { color: colors.text, fontSize: 14, fontWeight: '600' },
});
