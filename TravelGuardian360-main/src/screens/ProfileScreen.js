import { t } from '../i18n';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Button from '../components/Button';
import Card from '../components/Card';
import Header, { Avatar } from '../components/Header';
import Icon from '../components/Icon';
import Input from '../components/Input';
import ScreenContainer from '../components/ScreenContainer';
import { ConfirmDialog, Sheet } from '../components/Sheet';
import { ErrorState, InlineMessage, Loading } from '../components/States';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { profileApi } from '../services/touristService';
import { colors } from '../utils/constants';
import { formatDate } from '../utils/format';
import { hasErrors, validateEmail, validateName, validatePhone } from '../utils/validation';
import { goBack } from '../utils/nav';

export default function ProfileScreen({ navigation }) {
  const { setUser, logout } = useAuth();
  const profile = useApi(profileApi.get);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [confirmOut, setConfirmOut] = useState(false);

  const p = profile.data;

  const open = () => {
    setForm({ full_name: p.full_name, email: p.email, phone: p.phone, avatar_url: p.avatar_url || '' });
    setErrors({});
    setFormError('');
    setEditing(true);
  };
  const set = (key) => (value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  const save = async () => {
    const found = { full_name: validateName(form.full_name), email: validateEmail(form.email), phone: validatePhone(form.phone) };
    setErrors(found);
    if (hasErrors(found)) return;
    setSaving(true);
    setFormError('');
    try {
      const updated = await profileApi.update({
        full_name: form.full_name.trim(), email: form.email.trim(), phone: form.phone.trim(), avatar_url: form.avatar_url.trim() || null,
      });
      profile.setData(updated);
      setUser((u) => ({ ...u, full_name: updated.full_name, email: updated.email, phone: updated.phone, avatar_url: updated.avatar_url }));
      setEditing(false);
      setNotice(t('Profile updated.'));
    } catch (err) {
      if (err.status === 409) setErrors({ email: err.message });
      else setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenContainer
      refreshing={false}
      onRefresh={() => profile.reload({ silent: true })}
      header={<Header title={t('Profile')} onBack={() => goBack(navigation)} />}
    >
      <InlineMessage tone="success">{notice}</InlineMessage>
      {profile.loading && !p ? (
        <Loading label={t('Loading profile…')} />
      ) : profile.error && !p ? (
        <ErrorState message={profile.error} onRetry={profile.reload} />
      ) : (
        <>
          <View style={styles.hero}>
            <Avatar name={p.full_name} uri={p.avatar_url} size={92} />
            <Text style={styles.name}>{p.full_name}</Text>
            <Text style={styles.muted}>{t('Member since {date}', { date: formatDate(p.created_at) })}</Text>
          </View>

          <Card>
            <Row icon="mail" label={t('Email')} value={p.email} />
            <Row icon="phone" label={t('Phone')} value={p.phone} border />
            <Row icon="smile" label={t('Family Members')} value={p.family_count ? t('{n} added', { n: p.family_count }) : t('Not added')} border onPress={() => navigation.navigate('Family')} />
            <Row icon="credit-card" label={t('Tourist ID')} value={p.tourist_id} border onPress={() => navigation.navigate('TouristID')} />
            <Row
              icon="users"
              label={t('Emergency contact')}
              value={p.emergency_contact ? `${p.emergency_contact.name} · ${p.emergency_contact.phone}` : t('Not added')}
              border
              onPress={() => navigation.navigate('EmergencyContacts')}
            />
          </Card>

          <Button title={t('Edit profile')} icon="edit-2" onPress={open} style={{ marginTop: 18 }} />
          <Button title={t('Sign out')} icon="log-out" variant="dangerSoft" onPress={() => setConfirmOut(true)} style={{ marginTop: 10 }} />
        </>
      )}

      <Sheet visible={editing} title={t('Edit profile')} onClose={() => setEditing(false)}>
        <InlineMessage>{formError}</InlineMessage>
        <Input label={t('Full name')} icon="user" value={form.full_name || ''} onChangeText={set('full_name')} error={errors.full_name} />
        <Input label={t('Email')} icon="mail" value={form.email || ''} onChangeText={set('email')} error={errors.email} autoCapitalize="none" keyboardType="email-address" />
        <Input label={t('Phone number')} icon="phone" value={form.phone || ''} onChangeText={set('phone')} error={errors.phone} keyboardType="phone-pad" />
        <Input label={t('Profile photo URL')} icon="image" value={form.avatar_url || ''} onChangeText={set('avatar_url')} autoCapitalize="none" placeholder="https://…" hint={t('Optional. Link to a photo of you.')} />
        <Button title={t('Save changes')} loading={saving} onPress={save} />
      </Sheet>

      <ConfirmDialog visible={confirmOut} title={t('Sign out?')} message={t('You will need to sign in again to use TravelGuardian360.')} confirmLabel={t('Sign out')} onConfirm={logout} onCancel={() => setConfirmOut(false)} />
    </ScreenContainer>
  );
}

function Row({ icon, label, value, border, onPress }) {
  const content = (
    <View style={[styles.row, border && styles.border]}>
      <View style={styles.rowIcon}><Icon name={icon} size={16} color={colors.accent} /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
      {onPress ? <Icon name="chevron-right" size={18} color={colors.muted} /> : null}
    </View>
  );
  return onPress ? <Pressable onPress={onPress}>{content}</Pressable> : content;
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: 6, marginBottom: 22, marginTop: 4 },
  name: { color: colors.text, fontSize: 22, fontWeight: '800', marginTop: 8 },
  muted: { color: colors.muted, fontSize: 13 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  border: { borderTopWidth: 1, borderTopColor: colors.border },
  rowIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { color: colors.muted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  rowValue: { color: colors.text, fontSize: 14, marginTop: 3 },
});
