import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import Icon from './Icon';
import { colors } from '../utils/constants';
import { t } from '../i18n';

export default function EmergencyButton({ onPress, size = 190, disabled = false, label = t('SOS'), caption = t('Tap to send alert') }) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (disabled) return undefined;
    const loop = Animated.loop(
      Animated.timing(pulse, { toValue: 1, duration: 1800, easing: Easing.out(Easing.quad), useNativeDriver: Platform.OS !== 'web' }),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, disabled]);

  const ring = (delay) => ({
    transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.55] }) }],
    opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [delay ? 0.25 : 0.4, 0] }),
  });

  return (
    <View style={[styles.wrap, { width: size * 1.6, height: size * 1.6 }]}>
      {!disabled && <Animated.View style={[styles.ring, { width: size, height: size, borderRadius: size / 2 }, ring(0)]} />}
      <Pressable
        onPress={disabled ? undefined : onPress}
        accessibilityRole="button"
        accessibilityLabel={t('Send emergency SOS')}
        style={({ pressed }) => [
          styles.button,
          { width: size, height: size, borderRadius: size / 2 },
          disabled && styles.disabled,
          pressed && styles.pressed,
        ]}
      >
        <View style={[styles.inner, { width: size - 22, height: size - 22, borderRadius: (size - 22) / 2 }]}>
          <Icon name="alert-triangle" size={size * 0.2} color="#fff" />
          <Text style={[styles.label, { fontSize: size * 0.22 }]}>{label}</Text>
          <Text style={styles.caption}>{caption}</Text>
        </View>
      </Pressable>
    </View>
  );
}

/** Compact version used on the dashboard. */
export function SosChip({ onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.chip, pressed && styles.pressed]} accessibilityLabel={t('Open SOS')}>
      <Icon name="alert-triangle" size={22} color="#fff" />
      <View style={styles.chipText}>
        <Text style={styles.chipTitle}>{t('Emergency SOS')}</Text>
        <Text style={styles.chipSub}>{t('Alert responders with your location')}</Text>
      </View>
      <Icon name="chevron-right" size={20} color="#fff" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  ring: { position: 'absolute', backgroundColor: colors.danger },
  button: { backgroundColor: '#B3203F', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.18)', cursor: 'pointer' },
  inner: { backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center', gap: 2 },
  label: { color: '#fff', fontWeight: '900', letterSpacing: 2 },
  caption: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '500' },
  disabled: { opacity: 0.5 },
  pressed: { transform: [{ scale: 0.97 }] },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.danger, borderRadius: 18,
    paddingVertical: 14, paddingHorizontal: 16, cursor: 'pointer',
  },
  chipText: { flex: 1 },
  chipTitle: { color: '#fff', fontSize: 15, fontWeight: '800' },
  chipSub: { color: 'rgba(255,255,255,0.82)', fontSize: 12, marginTop: 1 },
});
