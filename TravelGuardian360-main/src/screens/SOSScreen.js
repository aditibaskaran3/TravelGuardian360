import React, { useCallback, useEffect, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import Button from '../components/Button';
import Card from '../components/Card';
import EmergencyButton from '../components/EmergencyButton';
import Header from '../components/Header';
import Icon from '../components/Icon';
import ScreenContainer, { Section } from '../components/ScreenContainer';
import { ConfirmDialog } from '../components/Sheet';
import { InlineMessage } from '../components/States';
import StatusBadge from '../components/StatusBadge';
import { useLocation } from '../context/LocationContext';
import { useApi } from '../hooks/useApi';
import { useSettings } from '../hooks/useSettings';
import { getCurrentPosition } from '../services/locationService';
import { contactsApi, sosApi } from '../services/touristService';
import { colors } from '../utils/constants';
import { coords, formatDateTime, timeAgo } from '../utils/format';
import { t } from '../i18n';

const call = (number) => Linking.openURL(`tel:${number.replace(/[^\d+]/g, '')}`);

const STEPS = [
  { key: 'active', label: t('Alert sent'), icon: 'send' },
  { key: 'acknowledged', label: t('Acknowledged'), icon: 'eye' },
  { key: 'resolved', label: t('Resolved'), icon: 'check-circle' },
];

export default function SOSScreen() {
  const { position, refresh } = useLocation();
  const { settings } = useSettings();
  const current = useApi(sosApi.current);
  const history = useApi(sosApi.history);
  const contacts = useApi(contactsApi.list);
  const [confirm, setConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const sos = current.data;
  const open = sos && sos.status !== 'resolved';

  // Keep the status in step with what the monitoring team does.
  useEffect(() => {
    if (!open) return undefined;
    const id = setInterval(() => {
      current.reload({ silent: true });
    }, 8000);
    return () => clearInterval(id);
  }, [open, current]);

  const send = useCallback(async () => {
    setSending(true);
    setError('');
    try {
      let fix;
      try {
        fix = await getCurrentPosition({ timeout: 8000 });
      } catch {
        fix = position; // fall back to the most recent position the app already has
      }
      if (!fix) throw new Error(t('Your location is not available yet. Allow location access, then try again.'));
      const created = await sosApi.raise({
        latitude: fix.latitude,
        longitude: fix.longitude,
        location_label: position && position.label ? position.label : undefined,
      });
      current.setData(created);
      history.reload({ silent: true });
      setConfirm(false);
    } catch (err) {
      setError(err.message || t('The alert could not be sent. Call emergency services directly.'));
      setConfirm(false);
    } finally {
      setSending(false);
    }
  }, [position, current, history]);

  const cancel = async () => {
    setCancelling(true);
    try {
      await sosApi.cancel(sos.id);
      await Promise.all([current.reload({ silent: true }), history.reload({ silent: true })]);
    } catch (err) {
      setError(err.message);
    } finally {
      setCancelling(false);
    }
  };

  const stepIndex = sos ? STEPS.findIndex((s) => s.key === sos.status) : -1;

  return (
    <ScreenContainer
      tabBar
      refreshing={false}
      onRefresh={() => Promise.all([current.reload({ silent: true }), history.reload({ silent: true }), contacts.reload({ silent: true }), refresh()])}
      header={<Header title={t('Emergency SOS')} subtitle={open ? t('Help has been alerted') : t('Get help fast, wherever you are')} />}
    >
      <InlineMessage>{error}</InlineMessage>

      {open ? (
        <>
          <View style={styles.banner}>
            <View style={styles.bannerIcon}><Icon name="alert-triangle" size={26} color="#fff" /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>{t('Emergency alert sent')}</Text>
              <Text style={styles.bannerText}>{t('The monitoring team has your live location and emergency details.')}</Text>
            </View>
          </View>

          <Section>
            <Card>
              <View style={styles.statusHead}>
                <Text style={styles.cardTitle}>{t('Alert status')}</Text>
                <StatusBadge status={sos.status} />
              </View>
              <View style={styles.steps}>
                {STEPS.map((s, i) => {
                  const done = i <= stepIndex;
                  return (
                    <View key={s.key} style={styles.step}>
                      <View style={[styles.stepDot, done && { backgroundColor: i === 2 ? colors.safe : colors.danger, borderColor: 'transparent' }]}>
                        <Icon name={s.icon} size={14} color={done ? '#fff' : colors.muted} />
                      </View>
                      <Text style={[styles.stepLabel, done && { color: colors.text }]}>{s.label}</Text>
                    </View>
                  );
                })}
              </View>
              <View style={styles.rows}>
                <Info label={t('Sent')} value={`${formatDateTime(sos.created_at)} (${timeAgo(sos.created_at)})`} />
                <Info label={t('Location')} value={sos.location_label || coords(sos.latitude, sos.longitude)} />
                <Info label={t('Coordinates')} value={coords(sos.latitude, sos.longitude)} />
                {sos.trip_destination ? <Info label={t('Trip')} value={sos.trip_destination} /> : null}
                {sos.acknowledged_at ? <Info label={t('Acknowledged')} value={formatDateTime(sos.acknowledged_at)} /> : null}
                {sos.admin_note ? <Info label={t('Message from responders')} value={sos.admin_note} /> : null}
              </View>
            </Card>
          </Section>

          <Section>
            <Button title={t('Call 112 — Emergency services')} icon="phone-call" variant="danger" onPress={() => call('112')} />
            <Button title={t('I am safe — cancel alert')} icon="check" variant="outline" loading={cancelling} onPress={cancel} style={{ marginTop: 10 }} />
          </Section>
        </>
      ) : (
        <Section>
          <EmergencyButton onPress={() => (settings.sos_countdown === false ? send() : setConfirm(true))} disabled={sending} />
          <Text style={styles.hint}>{t('Tap the button to alert the monitoring team with your current location and emergency details.')}</Text>
          <View style={styles.locationPill}>
            <Icon name="map-pin" size={14} color={colors.accent} />
            <Text style={styles.pillText} numberOfLines={1}>{position ? position.label || coords(position.latitude, position.longitude) : t('Locating you…')}</Text>
          </View>
        </Section>
      )}

      <Section>
        <View style={styles.sectionHead}>
          <Text style={styles.title}>{t('Emergency contacts')}</Text>
        </View>
        <Card style={{ paddingVertical: 4 }}>
          {contacts.loading && !contacts.data ? (
            <Text style={[styles.muted, styles.pad]}>{t('Loading contacts…')}</Text>
          ) : contacts.error ? (
            <Text style={[styles.muted, styles.pad]}>{contacts.error}</Text>
          ) : !contacts.data || contacts.data.length === 0 ? (
            <Text style={[styles.muted, styles.pad]}>{t('No emergency contacts yet. Add one from More → Emergency Contacts.')}</Text>
          ) : (
            contacts.data.map((c, i) => (
              <View key={c.id} style={[styles.contact, i > 0 && styles.border]}>
                <View style={styles.contactIcon}><Icon name="user" size={16} color={colors.accent} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.contactName}>{c.name}{c.is_primary ? t('  ·  Primary') : ''}</Text>
                  <Text style={styles.muted}>{c.relationship} · {c.phone}</Text>
                </View>
                <Button title={t('Call')} icon="phone" small variant="soft" full={false} onPress={() => call(c.phone)} />
              </View>
            ))
          )}
        </Card>
      </Section>

      <Section>
        <Text style={styles.title}>{t('Emergency numbers')}</Text>
        <View style={styles.numbers}>
          {[['112', t('Emergency')], ['100', t('Police')], ['102', t('Ambulance')], ['1363', t('Tourist helpline')]].map(([n, label]) => (
            <Card key={n} onPress={() => call(n)} style={styles.number}>
              <Text style={styles.numberValue}>{n}</Text>
              <Text style={styles.muted}>{label}</Text>
            </Card>
          ))}
        </View>
      </Section>

      {history.data && history.data.length > 0 ? (
        <Section>
          <Text style={styles.title}>{t('Previous requests')}</Text>
          <Card style={{ paddingVertical: 4 }}>
            {history.data.slice(0, 4).map((h, i) => (
              <View key={h.id} style={[styles.contact, i > 0 && styles.border]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.contactName}>{h.location_label || coords(h.latitude, h.longitude)}</Text>
                  <Text style={styles.muted}>{formatDateTime(h.created_at)}</Text>
                </View>
                <StatusBadge status={h.status} />
              </View>
            ))}
          </Card>
        </Section>
      ) : null}

      <ConfirmDialog
        visible={confirm}
        danger
        title={t('Send emergency alert?')}
        message={t('Your location and emergency details will be shared with the monitoring team right away.')}
        confirmLabel={t('Send SOS')}
        loading={sending}
        onConfirm={send}
        onCancel={() => setConfirm(false)}
      />
    </ScreenContainer>
  );
}

const Info = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.muted}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', gap: 14, alignItems: 'center', backgroundColor: colors.danger, borderRadius: 20, padding: 16, marginBottom: 18 },
  bannerIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  bannerTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
  bannerText: { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 3, lineHeight: 18 },
  statusHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  steps: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 18 },
  step: { alignItems: 'center', gap: 6, flex: 1 },
  stepDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.cardAlt, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  stepLabel: { color: colors.muted, fontSize: 11, fontWeight: '600' },
  rows: { gap: 10, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 14 },
  infoRow: { gap: 2 },
  infoValue: { color: colors.text, fontSize: 14, fontWeight: '500' },
  hint: { color: colors.muted, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 4, paddingHorizontal: 12 },
  locationPill: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center', marginTop: 14, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: colors.accentSoft, maxWidth: '100%' },
  pillText: { color: colors.textSoft, fontSize: 12, fontWeight: '500', flexShrink: 1 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between' },
  title: { color: colors.text, fontSize: 17, fontWeight: '700', marginBottom: 12 },
  muted: { color: colors.muted, fontSize: 12 },
  pad: { padding: 12 },
  contact: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 4 },
  border: { borderTopWidth: 1, borderTopColor: colors.border },
  contactIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  contactName: { color: colors.text, fontSize: 14, fontWeight: '600' },
  numbers: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  number: { width: '48%', alignItems: 'flex-start', gap: 2 },
  numberValue: { color: colors.text, fontSize: 22, fontWeight: '800' },
});
