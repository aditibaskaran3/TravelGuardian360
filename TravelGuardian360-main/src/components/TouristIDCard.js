import { t } from '../i18n';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import QRCode from 'qrcode';

import { Avatar } from './Header';
import { LogoMark } from './Logo';
import StatusBadge from './StatusBadge';
import { colors } from '../utils/constants';
import { formatDate } from '../utils/format';

export function QRCodeView({ value, size = 112 }) {
  const { path, count } = useMemo(() => {
    const qr = QRCode.create(value, { errorCorrectionLevel: t('M') });
    const n = qr.modules.size;
    let d = '';
    for (let y = 0; y < n; y += 1) {
      for (let x = 0; x < n; x += 1) {
        if (qr.modules.data[y * n + x]) d += `M${x} ${y}h1v1h-1z`;
      }
    }
    return { path: d, count: n };
  }, [value]);
  return (
    <Svg width={size} height={size} viewBox={`-2 -2 ${count + 4} ${count + 4}`}>
      <Rect x={-2} y={-2} width={count + 4} height={count + 4} fill="#fff" />
      <Path d={path} fill="#0A1020" />
    </Svg>
  );
}

export default function TouristIDCard({ data, verifyUrl }) {
  const verified = data.verification_status === 'verified';
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.brand}>
          <LogoMark size={26} />
          <View>
            <Text style={styles.brandName}>{t('TravelGuardian360')}</Text>
            <Text style={styles.brandSub}>{t('TOURIST IDENTITY')}</Text>
          </View>
        </View>
        <StatusBadge status={data.verification_status} label={verified ? t('Verified') : t('Pending Verification')} />
      </View>

      <View style={styles.identity}>
        <Avatar name={data.full_name} uri={data.avatar_url} size={78} style={styles.photo} />
        <View style={styles.identityText}>
          <Text style={styles.name} numberOfLines={2}>{data.full_name}</Text>
          <Text style={styles.number}>{data.id_number}</Text>
          <Text style={styles.trip}>
            {data.trip_status === 'active' ? t('On trip · {place}', { place: data.trip_destination }) : t('No active trip')}
          </Text>
        </View>
      </View>

      <View style={styles.grid}>
        <Field label={t('Nationality')} value={data.nationality || t('Not set')} />
        <Field label={t('Date of birth')} value={formatDate(data.date_of_birth)} />
        <Field label={t('Emergency contact')} value={data.emergency_contact ? `${data.emergency_contact.name}` : t('Not added')} />
        <Field label={t('Medical information')} value={data.medical_info_available ? t('Available') : t('Not added')} />
      </View>

      <View style={styles.bottom}>
        <View style={styles.qrNote}>
          <Text style={styles.qrTitle}>{t('Scan to verify')}</Text>
          <Text style={styles.qrText}>
            {verified ? t('Verified by TravelGuardian360 administrators.') : t('Awaiting verification by an administrator.')}
          </Text>
          <Text style={styles.hash} numberOfLines={1}>{t('ID hash')} · {data.record_hash.slice(0, 16)}…</Text>
        </View>
        <View style={styles.qr}>
          <QRCodeView value={verifyUrl} size={92} />
        </View>
      </View>
    </View>
  );
}

const Field = ({ label, value }) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <Text style={styles.fieldValue} numberOfLines={1}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: { backgroundColor: colors.idCard, borderRadius: 22, padding: 18, borderWidth: 1, borderColor: colors.borderStrong },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandName: { color: colors.text, fontSize: 13, fontWeight: '800' },
  brandSub: { color: colors.muted, fontSize: 9, fontWeight: '700', letterSpacing: 1.2, marginTop: 1 },
  identity: { flexDirection: 'row', gap: 14, alignItems: 'center', marginTop: 20 },
  photo: { borderWidth: 2, borderColor: colors.accent },
  identityText: { flex: 1 },
  name: { color: colors.text, fontSize: 20, fontWeight: '800' },
  number: { color: colors.accent, fontSize: 14, fontWeight: '700', letterSpacing: 1, marginTop: 4 },
  trip: { color: colors.muted, fontSize: 12, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 18, rowGap: 12 },
  field: { width: '50%', paddingRight: 8 },
  fieldLabel: { color: colors.muted, fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  fieldValue: { color: colors.text, fontSize: 14, fontWeight: '600', marginTop: 3 },
  bottom: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 18, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border },
  qrNote: { flex: 1 },
  qrTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
  qrText: { color: colors.muted, fontSize: 12, marginTop: 4, lineHeight: 17 },
  hash: { color: colors.muted, fontSize: 10, marginTop: 8, letterSpacing: 0.4 },
  qr: { borderRadius: 10, overflow: 'hidden' },
});
