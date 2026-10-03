import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Button from '../components/Button';
import Icon from '../components/Icon';
import Logo, { LogoMark } from '../components/Logo';
import { colors } from '../utils/constants';
import { t } from '../i18n';
import LanguagePicker from '../components/LanguagePicker';

const FEATURES = [
  { icon: 'navigation', label: t('Live tracking') },
  { icon: 'alert-triangle', label: t('One-tap SOS') },
  { icon: 'credit-card', label: t('Tourist ID') },
];

function Radar() {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(pulse, { toValue: 1, duration: 2600, easing: Easing.out(Easing.quad), useNativeDriver: Platform.OS !== 'web' }));
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return (
    <View style={styles.radar}>
      <Svg width={280} height={280} viewBox="0 0 280 280" style={StyleSheet.absoluteFill}>
        <Circle cx="140" cy="140" r="132" stroke={colors.border} strokeWidth="1" fill="none" />
        <Circle cx="140" cy="140" r="98" stroke={colors.border} strokeWidth="1" strokeDasharray="3 6" fill="none" />
        <Circle cx="140" cy="140" r="64" stroke={colors.borderStrong} strokeWidth="1" fill={colors.accentSoft} />
        <Circle cx="222" cy="86" r="6" fill={colors.safe} />
        <Circle cx="64" cy="190" r="6" fill={colors.caution} />
        <Circle cx="190" cy="236" r="5" fill={colors.accent} />
        <Circle cx="48" cy="96" r="4" fill={colors.safe} />
      </Svg>
      <Animated.View
        style={[styles.pulse, {
          transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.9] }) }],
          opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
        }]}
      />
      <LogoMark size={84} />
    </View>
  );
}

export default function SplashScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: Platform.OS !== 'web' }).start();
  }, [fade]);
  const rise = fade.interpolate({ inputRange: [0, 1], outputRange: [24, 0] });

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
      <View style={styles.topRow}>
        <Logo size={34} />
        <LanguagePicker />
      </View>
      <Animated.View style={[styles.center, { opacity: fade, transform: [{ translateY: rise }] }]}>
        <Radar />
        <Text style={styles.title}>{t('Travel with confidence.')}</Text>
        <Text style={styles.body}>
          {t('One place for your trips, live location, emergency help and verified tourist identity, wherever the journey takes you.')}
        </Text>
        <View style={styles.features}>
          {FEATURES.map((f) => (
            <View key={f.label} style={styles.feature}>
              <Icon name={f.icon} size={16} color={colors.accent} />
              <Text style={styles.featureText}>{f.label}</Text>
            </View>
          ))}
        </View>
      </Animated.View>
      <View style={styles.actions}>
        <Button title={t('Get Started')} icon="arrow-right" onPress={() => navigation.navigate('Register')} />
        <Button title={t('I already have an account')} variant="outline" onPress={() => navigation.navigate('Login')} />
        {Platform.OS === 'web' ? (
          <Pressable onPress={() => Linking.openURL('/admin')} style={styles.admin}>
            <Text style={styles.adminText}>{t('Administrator sign in')}</Text>
          </Pressable>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, paddingHorizontal: 24, justifyContent: 'space-between', gap: 20 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  center: { alignItems: 'center', gap: 14 },
  radar: { width: 280, height: 280, alignItems: 'center', justifyContent: 'center', marginVertical: 6 },
  pulse: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: colors.accent },
  title: { color: colors.text, fontSize: 32, fontWeight: '800', textAlign: 'center', letterSpacing: -0.8, lineHeight: 38 },
  body: { color: colors.muted, fontSize: 15, lineHeight: 23, textAlign: 'center', maxWidth: 330 },
  features: { flexDirection: 'row', gap: 8, marginTop: 6, flexWrap: 'wrap', justifyContent: 'center' },
  feature: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
  },
  featureText: { color: colors.textSoft, fontSize: 12, fontWeight: '600' },
  actions: { gap: 12 },
  admin: { alignItems: 'center', paddingVertical: 6 },
  adminText: { color: colors.muted, fontSize: 12 },
});
