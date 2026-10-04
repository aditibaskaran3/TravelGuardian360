import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Card from '../components/Card';
import Header, { Avatar } from '../components/Header';
import Icon from '../components/Icon';
import ScreenContainer, { Section } from '../components/ScreenContainer';
import { useAuth } from '../context/AuthContext';
import { colors } from '../utils/constants';
import { t } from '../i18n';

const EXPLORE = [
  { icon: 'cloud', label: t('Weather'), hint: t('Forecast for your area'), to: ['Weather'] },
  { icon: 'map', label: t('Travel Information'), hint: t('Transport, money, SIM'), to: ['Info', { category: 'travel' }] },
  { icon: 'shield', label: t('Safety Information'), hint: t('Tips for staying safe'), to: ['Info', { category: 'safety' }] },
  { icon: 'phone-call', label: t('Emergency Services'), hint: t('Helplines and numbers'), to: ['Info', { category: 'emergency' }] },
  { icon: 'compass', label: t('Tourist Information'), hint: t('Places worth visiting'), to: ['Info', { category: 'tourist' }] },
  { icon: 'help-circle', label: t('Help and Support'), hint: t('Answers and contact'), to: ['Info', { category: 'help' }] },
];

const SAFETY = [
  { icon: 'users', label: t('Emergency Contacts'), to: ['EmergencyContacts'] },
  { icon: 'smile', label: t('Family Members'), to: ['Family'] },
  { icon: 'file-text', label: t('Documents'), to: ['Documents'] },
  { icon: 'heart', label: t('Medical ID'), to: ['MedicalID'] },
  { icon: 'credit-card', label: t('Tourist ID'), to: ['TouristID'] },
  { icon: 'shield', label: t('Safety Zones'), to: ['SafetyZones'] },
];

export default function MoreScreen({ navigation }) {
  const { user } = useAuth();
  const go = (to) => navigation.navigate(...to);
  return (
    <ScreenContainer tabBar header={<Header title={t('More')} subtitle={t('Everything else in one place')} />}>
      <Card onPress={() => navigation.navigate('Profile')} style={styles.profile}>
        <Avatar name={user.full_name} uri={user.avatar_url} size={50} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{user.full_name}</Text>
          <Text style={styles.muted}>{user.email}</Text>
        </View>
        <Icon name="chevron-right" size={20} color={colors.muted} />
      </Card>

      <Section>
        <Text style={styles.title}>{t('My safety')}</Text>
        <View style={styles.row}>
          {SAFETY.map((s) => (
            <Pressable key={s.label} onPress={() => go(s.to)} style={({ pressed }) => [styles.small, pressed && { opacity: 0.8 }]}>
              <View style={styles.smallIcon}><Icon name={s.icon} size={20} color={colors.accent} /></View>
              <Text style={styles.smallLabel} numberOfLines={2}>{s.label}</Text>
            </Pressable>
          ))}
        </View>
      </Section>

      <Section>
        <Text style={styles.title}>{t('Explore')}</Text>
        <View style={styles.grid}>
          {EXPLORE.map((e) => (
            <Card key={e.label} onPress={() => go(e.to)} style={styles.tile}>
              <View style={styles.tileIcon}><Icon name={e.icon} size={20} color={colors.accent} /></View>
              <Text style={styles.tileLabel}>{e.label}</Text>
              <Text style={styles.muted}>{e.hint}</Text>
            </Card>
          ))}
        </View>
      </Section>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 22 },
  name: { color: colors.text, fontSize: 16, fontWeight: '700' },
  muted: { color: colors.muted, fontSize: 12, marginTop: 2 },
  title: { color: colors.text, fontSize: 17, fontWeight: '700', marginBottom: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  small: { width: '30.5%', alignItems: 'center', gap: 8, cursor: 'pointer' },
  smallIcon: { width: '100%', height: 58, borderRadius: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  smallLabel: { color: colors.textSoft, fontSize: 11, fontWeight: '600', textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: '48.5%', gap: 4 },
  tileIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  tileLabel: { color: colors.text, fontSize: 14, fontWeight: '700' },
  settings: { flexDirection: 'row', alignItems: 'center', gap: 14 },
});
