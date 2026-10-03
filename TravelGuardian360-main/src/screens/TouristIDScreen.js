import { t } from '../i18n';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Button from '../components/Button';
import Card from '../components/Card';
import DateField from '../components/DateField';
import Header from '../components/Header';
import Icon from '../components/Icon';
import Input from '../components/Input';
import ScreenContainer, { Section } from '../components/ScreenContainer';
import { Sheet } from '../components/Sheet';
import { ErrorState, InlineMessage, Loading } from '../components/States';
import TouristIDCard from '../components/TouristIDCard';
import { useApi } from '../hooks/useApi';
import { API_URL } from '../services/api';
import { touristIdApi } from '../services/touristService';
import { colors } from '../utils/constants';
import { formatDateTime } from '../utils/format';
import { validateDate } from '../utils/validation';
import { goBack } from '../utils/nav';

export default function TouristIDScreen({ navigation }) {
  const tid = useApi(touristIdApi.get);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ nationality: '', date_of_birth: '', passport_number: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const data = tid.data;

  // While a request is pending, pick up the administrator's decision without a manual refresh.
  const waiting = data && data.verification_status !== 'verified' && !!data.verification_requested_at;
  useEffect(() => {
    if (!waiting) return undefined;
    const id = setInterval(() => tid.reload({ silent: true }), 8000);
    return () => clearInterval(id);
  }, [waiting, tid]);

  const open = () => {
    setForm({ nationality: data.nationality || '', date_of_birth: data.date_of_birth || '', passport_number: data.passport_number || '' });
    setErrors({});
    setError('');
    setEditing(true);
  };

  const save = async () => {
    const dob = form.date_of_birth ? validateDate(form.date_of_birth, t('Date of birth')) : '';
    setErrors({ date_of_birth: dob });
    if (dob) return;
    setSaving(true);
    setError('');
    try {
      tid.setData(await touristIdApi.update({
        nationality: form.nationality, date_of_birth: form.date_of_birth || null, passport_number: form.passport_number,
      }));
      setEditing(false);
      setNotice(t('Details saved. Your ID will be re-verified because it changed.'));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const request = async () => {
    setRequesting(true);
    try {
      tid.setData(await touristIdApi.requestVerification());
      setNotice(t('Verification requested. An administrator will review your ID.'));
    } catch (err) {
      setError(err.message);
    } finally {
      setRequesting(false);
    }
  };

  const verified = data && data.verification_status === 'verified';

  return (
    <ScreenContainer
      refreshing={false}
      onRefresh={() => tid.reload({ silent: true })}
      header={<Header title={t('Tourist ID')} subtitle={t('Your digital identity while travelling')} onBack={() => goBack(navigation)} />}
    >
      <InlineMessage tone="success">{notice}</InlineMessage>
      <InlineMessage>{error}</InlineMessage>
      {tid.loading && !data ? (
        <Loading label={t('Loading your Tourist ID…')} />
      ) : tid.error && !data ? (
        <ErrorState message={tid.error} onRetry={tid.reload} />
      ) : (
        <>
          <TouristIDCard data={data} verifyUrl={`${API_URL}/tourist-id/verify/${data.id_number}`} />

          <Section style={{ marginTop: 18 }}>
            <Button title={t('Edit identity details')} icon="edit-2" variant="outline" onPress={open} />
          </Section>

          <Card>
            <Text style={styles.title}>{t('Verification')}</Text>
            <View style={styles.flow}>
              <Step icon="user" label={t('Tourist ID')} done />
              <Line />
              <Step icon="send" label={t('Request')} done={verified || !!data.verification_requested_at} />
              <Line />
              <Step icon="link" label={t('Ledger layer')} note={t('Not connected')} />
              <Line />
              <Step icon="check-circle" label={t('Status')} done={verified} />
            </View>
            <View style={styles.statusBox}>
              <Icon name={verified ? 'check-circle' : 'clock'} size={18} color={verified ? colors.safe : colors.caution} />
              <Text style={styles.statusText}>
                {verified
                  ? t('Verified by an administrator on {date}.', { date: formatDateTime(data.verified_at) })
                  : data.verification_requested_at
                    ? t('Pending review. Requested {date}.', { date: formatDateTime(data.verification_requested_at) })
                    : t('Your ID is pending verification.')}
              </Text>
            </View>
            {!verified && !data.verification_requested_at ? (
              <Button title={t('Request verification')} icon="shield" loading={requesting} onPress={request} style={{ marginTop: 14 }} />
            ) : null}
            <Text style={styles.note}>
              {t('Your ID record is fingerprinted with SHA-256 so it can be anchored to a blockchain verifier later. No blockchain network is connected yet, so verification today is performed by TravelGuardian360 administrators.')}
            </Text>
          </Card>
        </>
      )}

      <Sheet visible={editing} title={t('Identity details')} onClose={() => setEditing(false)}>
        <InlineMessage>{error}</InlineMessage>
        <Input label={t('Nationality')} icon="flag" value={form.nationality} onChangeText={(v) => setForm((f) => ({ ...f, nationality: v }))} placeholder={t('e.g. Indian')} />
        <DateField label={t('Date of birth')} value={form.date_of_birth} onChange={(v) => setForm((f) => ({ ...f, date_of_birth: v }))} error={errors.date_of_birth} />
        <Input label={t('Passport number')} icon="book" value={form.passport_number} onChangeText={(v) => setForm((f) => ({ ...f, passport_number: v }))} placeholder={t('Optional')} autoCapitalize="characters" />
        <Button title={t('Save details')} loading={saving} onPress={save} />
      </Sheet>
    </ScreenContainer>
  );
}

const Step = ({ icon, label, done, note }) => (
  <View style={styles.step}>
    <View style={[styles.stepDot, done && styles.stepDone, note && styles.stepOff]}>
      <Icon name={icon} size={15} color={done ? '#fff' : colors.muted} />
    </View>
    <Text style={styles.stepLabel}>{label}</Text>
    {note ? <Text style={styles.stepNote}>{note}</Text> : null}
  </View>
);
const Line = () => <View style={styles.line} />;

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 16 },
  flow: { flexDirection: 'row', alignItems: 'flex-start' },
  step: { alignItems: 'center', gap: 5, width: 62 },
  stepDot: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.cardAlt, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  stepDone: { backgroundColor: colors.safe, borderColor: 'transparent' },
  stepOff: { borderStyle: 'dashed', borderColor: colors.borderStrong },
  stepLabel: { color: colors.textSoft, fontSize: 11, fontWeight: '600', textAlign: 'center' },
  stepNote: { color: colors.caution, fontSize: 9, fontWeight: '700', textAlign: 'center' },
  line: { flex: 1, height: 1, backgroundColor: colors.border, marginTop: 17 },
  statusBox: { flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: colors.bg, borderRadius: 12, padding: 12, marginTop: 18 },
  statusText: { color: colors.textSoft, fontSize: 13, flex: 1, lineHeight: 18 },
  note: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 14 },
});
