import { t } from '../i18n';
import React, { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import Button from '../components/Button';
import Card from '../components/Card';
import Header from '../components/Header';
import Icon from '../components/Icon';
import Input from '../components/Input';
import ScreenContainer, { Section } from '../components/ScreenContainer';
import { ConfirmDialog, Sheet } from '../components/Sheet';
import { InlineMessage } from '../components/States';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../hooks/useSettings';
import { profileApi } from '../services/touristService';
import ThemeToggle from '../components/ThemeToggle';
import { colors } from '../utils/constants';
import { validatePassword } from '../utils/validation';
import { goBack } from '../utils/nav';
import LanguagePicker from '../components/LanguagePicker';

const GROUPS = [
  {
    title: t('Notification Settings'), icon: 'bell',
    items: [
      { key: 'safety_alerts', label: t('Safety alerts'), hint: t('Warnings about areas and incidents') },
      { key: 'weather_alerts', label: t('Weather alerts'), hint: t('Heat, rain and storm advisories') },
      { key: 'travel_alerts', label: t('Travel alerts'), hint: t('Transport and route changes') },
      { key: 'trip_reminders', label: t('Trip reminders'), hint: t('Start and end of your trips') },
    ],
  },
  {
    title: t('Privacy Settings'), icon: 'lock',
    items: [
      { key: 'share_location_with_admin', label: t('Share location when tracking'), hint: t('Lets the monitoring team see your live position') },
      { key: 'share_medical_in_sos', label: t('Include Medical ID in SOS'), hint: t('Blood group, allergies and conditions go to responders') },
    ],
  },
  {
    title: t('Location Settings'), icon: 'map-pin',
    items: [
      { key: 'high_accuracy_location', label: t('High accuracy'), hint: t('Uses GPS for a more precise position') },
      { key: 'auto_location_updates', label: t('Automatic updates'), hint: t('Refresh your position while the app is open') },
    ],
  },
  {
    title: t('Emergency Settings'), icon: 'alert-triangle',
    items: [
      { key: 'sos_countdown', label: t('Confirm before sending SOS'), hint: t('Prevents accidental alerts') },
      { key: 'notify_contacts_on_sos', label: t('Notify emergency contacts'), hint: t('Contacts are shown for calling after an alert') },
    ],
  },
];

export default function SettingsScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { settings, setSettings } = useSettings();
  const [error, setError] = useState('');
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [pw, setPw] = useState({ current_password: '', new_password: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [pwError, setPwError] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [confirmOut, setConfirmOut] = useState(false);

  const toggle = async (key, value) => {
    const before = settings;
    setSettings({ ...settings, [key]: value });
    setError('');
    try {
      setSettings(await profileApi.saveSettings({ [key]: value }));
    } catch (err) {
      setSettings(before);
      setError(err.message);
    }
  };

  const changePassword = async () => {
    const found = {
      current_password: pw.current_password ? '' : t('Enter your current password.'),
      new_password: validatePassword(pw.new_password),
    };
    setPwErrors(found);
    if (found.current_password || found.new_password) return;
    setPwSaving(true);
    setPwError('');
    try {
      await profileApi.changePassword(pw);
      setPasswordOpen(false);
      setPw({ current_password: '', new_password: '' });
      setNotice(t('Password changed.'));
    } catch (err) {
      setPwError(err.message);
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <ScreenContainer header={<Header title={t('Settings')} onBack={() => goBack(navigation)} />}>
      <InlineMessage>{error}</InlineMessage>
      <InlineMessage tone="success">{notice}</InlineMessage>

      <Section>
        <Text style={styles.group}><Icon name="user" size={14} color={colors.accent} />  {t('Account Settings')}</Text>
        <Card padded={false}>
          <Action label={t('Edit profile')} hint={user.email} onPress={() => navigation.navigate('Profile')} />
          <Action label={t('Change password')} hint={t('Use a strong, unique password')} onPress={() => { setPwError(''); setPwErrors({}); setPasswordOpen(true); }} border />
          <Action label={t('Tourist ID')} hint={t('Identity and verification')} onPress={() => navigation.navigate('TouristID')} border />
        </Card>
      </Section>

      <Section>
        <Text style={styles.group}><Icon name="sun" size={14} color={colors.accent} />  {t('Appearance')}</Text>
        <Card><ThemeToggle /></Card>
      </Section>

      <Section>
        <Text style={styles.group}><Icon name="globe" size={14} color={colors.accent} />  {t('Language')}</Text>
        <Card><LanguagePicker /></Card>
      </Section>

      {GROUPS.map((g) => (
        <Section key={g.title}>
          <Text style={styles.group}><Icon name={g.icon} size={14} color={colors.accent} />  {g.title}</Text>
          <Card padded={false}>
            {g.items.map((item, i) => (
              <View key={item.key} style={[styles.row, i > 0 && styles.border]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>{item.label}</Text>
                  <Text style={styles.hint}>{item.hint}</Text>
                </View>
                <Switch value={!!settings[item.key]} onValueChange={(v) => toggle(item.key, v)} trackColor={{ true: colors.accent, false: colors.border }} />
              </View>
            ))}
          </Card>
        </Section>
      ))}

      <Button title={t('Logout')} icon="log-out" variant="dangerSoft" onPress={() => setConfirmOut(true)} />

      <Sheet visible={passwordOpen} title={t('Change password')} onClose={() => setPasswordOpen(false)}>
        <InlineMessage>{pwError}</InlineMessage>
        <Input label={t('Current password')} icon="lock" secure value={pw.current_password} error={pwErrors.current_password} onChangeText={(v) => setPw((p) => ({ ...p, current_password: v }))} />
        <Input label={t('New password')} icon="lock" secure value={pw.new_password} error={pwErrors.new_password} hint={t('At least 8 characters with letters and numbers.')} onChangeText={(v) => setPw((p) => ({ ...p, new_password: v }))} />
        <Button title={t('Update password')} loading={pwSaving} onPress={changePassword} />
      </Sheet>

      <ConfirmDialog visible={confirmOut} title={t('Sign out?')} message={t('You will need to sign in again to use TravelGuardian360.')} confirmLabel={t('Logout')} onConfirm={logout} onCancel={() => setConfirmOut(false)} />
    </ScreenContainer>
  );
}

function Action({ label, hint, onPress, border }) {
  return (
    <Card padded={false} onPress={onPress} style={[styles.action, border && styles.border, { borderWidth: 0, borderRadius: 0 }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.hint}>{hint}</Text>
      </View>
      <Icon name="chevron-right" size={18} color={colors.muted} />
    </Card>
  );
}

const styles = StyleSheet.create({
  group: { color: colors.textSoft, fontSize: 13, fontWeight: '700', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: 'transparent' },
  border: { borderTopWidth: 1, borderTopColor: colors.border },
  label: { color: colors.text, fontSize: 14, fontWeight: '600' },
  hint: { color: colors.muted, fontSize: 12, marginTop: 2 },
});
