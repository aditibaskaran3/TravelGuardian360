import { t } from '../i18n';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Button from '../components/Button';
import Card from '../components/Card';
import Header from '../components/Header';
import Icon from '../components/Icon';
import Input from '../components/Input';
import ScreenContainer from '../components/ScreenContainer';
import { Sheet } from '../components/Sheet';
import { ErrorState, InlineMessage, Loading } from '../components/States';
import { useApi } from '../hooks/useApi';
import { medicalApi } from '../services/touristService';
import { BLOOD_GROUPS, colors } from '../utils/constants';
import { formatDateTime } from '../utils/format';
import { goBack } from '../utils/nav';

const FIELDS = [
  { key: 'allergies', label: t('Allergies'), icon: 'alert-circle', placeholder: t('Medication, food, insect stings…') },
  { key: 'conditions', label: t('Medical conditions'), icon: 'activity', placeholder: t('Asthma, diabetes, heart condition…') },
  { key: 'medications', label: t('Medications'), icon: 'package', placeholder: t('Name and dose') },
  { key: 'notes', label: t('Emergency notes'), icon: 'file-text', placeholder: t('Anything responders should know') },
  { key: 'emergency_contact', label: t('Emergency contact'), icon: 'phone', placeholder: t('Name and phone number') },
];

export default function MedicalIDScreen({ navigation }) {
  const medical = useApi(medicalApi.get);
  const [reveal, setReveal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const data = medical.data || {};
  const hasData = FIELDS.some((f) => data[f.key]) || data.blood_group;

  const open = () => {
    setForm({ blood_group: data.blood_group || '', ...Object.fromEntries(FIELDS.map((f) => [f.key, data[f.key] || ''])) });
    setError('');
    setEditing(true);
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, blood_group: form.blood_group || null };
      medical.setData(await medicalApi.save(payload));
      setEditing(false);
      setNotice(t('Medical ID saved.'));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const mask = (value) => (reveal ? value : '••••••••');

  return (
    <ScreenContainer
      refreshing={false}
      onRefresh={() => medical.reload({ silent: true })}
      header={<Header title={t('Medical ID')} subtitle={t('Information that could save your life')} onBack={() => goBack(navigation)} />}
    >
      <View style={styles.privacy}>
        <Icon name="lock" size={16} color={colors.safe} />
        <Text style={styles.privacyText}>{t('Private to you. Shared with responders only while an SOS is open, and every access is logged.')}</Text>
      </View>
      <InlineMessage tone="success">{notice}</InlineMessage>

      {medical.loading && !medical.data ? (
        <Loading label={t('Loading medical information…')} />
      ) : medical.error && !medical.data ? (
        <ErrorState message={medical.error} onRetry={medical.reload} />
      ) : (
        <>
          <Card style={styles.blood}>
            <View style={styles.bloodIcon}><Icon name="droplet" size={24} color={colors.danger} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{t('Blood group')}</Text>
              <Text style={styles.bloodValue}>{data.blood_group ? (reveal ? data.blood_group : '••') : t('Not set')}</Text>
            </View>
            <Pressable onPress={() => setReveal((r) => !r)} style={styles.reveal} accessibilityLabel={t('Show or hide details')}>
              <Icon name={reveal ? 'eye-off' : 'eye'} size={18} color={colors.accent} />
              <Text style={styles.revealText}>{reveal ? t('Hide') : t('Show')}</Text>
            </Pressable>
          </Card>

          <Card style={{ marginTop: 12 }}>
            {FIELDS.map((f, i) => (
              <View key={f.key} style={[styles.row, i > 0 && styles.border]}>
                <View style={styles.rowIcon}><Icon name={f.icon} size={16} color={colors.accent} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>{f.label}</Text>
                  <Text style={[styles.value, !data[f.key] && styles.empty]}>{data[f.key] ? mask(data[f.key]) : t('Not added')}</Text>
                </View>
              </View>
            ))}
          </Card>
          {data.updated_at ? <Text style={styles.updated}>{t('Last updated {time}', { time: formatDateTime(data.updated_at) })}</Text> : null}
          <Button title={hasData ? t('Edit Medical ID') : t('Add your Medical ID')} icon="edit-2" onPress={open} style={{ marginTop: 18 }} />
        </>
      )}

      <Sheet visible={editing} title={t('Medical ID')} onClose={() => setEditing(false)}>
        <InlineMessage>{error}</InlineMessage>
        <Text style={styles.formLabel}>{t('Blood group')}</Text>
        <View style={styles.groups}>
          {BLOOD_GROUPS.map((g) => (
            <Pressable key={g} onPress={() => setForm((f) => ({ ...f, blood_group: f.blood_group === g ? '' : g }))} style={[styles.group, form.blood_group === g && styles.groupActive]}>
              <Text style={[styles.groupText, form.blood_group === g && { color: '#fff' }]}>{g}</Text>
            </Pressable>
          ))}
        </View>
        {FIELDS.map((f) => (
          <Input key={f.key} label={f.label} icon={f.icon} multiline={f.key !== 'emergency_contact'} value={form[f.key] || ''} onChangeText={(v) => setForm((s) => ({ ...s, [f.key]: v }))} placeholder={f.placeholder} />
        ))}
        <Button title={t('Save')} loading={saving} onPress={save} />
      </Sheet>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  privacy: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', padding: 12, borderRadius: 12, backgroundColor: colors.safeSoft, marginBottom: 16 },
  privacyText: { color: colors.textSoft, fontSize: 12, lineHeight: 18, flex: 1 },
  blood: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  bloodIcon: { width: 50, height: 50, borderRadius: 16, backgroundColor: colors.dangerSoft, alignItems: 'center', justifyContent: 'center' },
  bloodValue: { color: colors.text, fontSize: 28, fontWeight: '800', marginTop: 2 },
  reveal: { alignItems: 'center', gap: 3, cursor: 'pointer' },
  revealText: { color: colors.accent, fontSize: 11, fontWeight: '600' },
  label: { color: colors.muted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  row: { flexDirection: 'row', gap: 12, paddingVertical: 14 },
  border: { borderTopWidth: 1, borderTopColor: colors.border },
  rowIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  value: { color: colors.text, fontSize: 14, marginTop: 4, lineHeight: 20 },
  empty: { color: colors.muted },
  updated: { color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: 12 },
  formLabel: { color: colors.textSoft, fontSize: 13, fontWeight: '600', marginBottom: 8 },
  groups: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  group: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg, cursor: 'pointer' },
  groupActive: { backgroundColor: colors.danger, borderColor: colors.danger },
  groupText: { color: colors.textSoft, fontWeight: '700', fontSize: 14 },
});
