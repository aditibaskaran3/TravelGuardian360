import { t } from '../i18n';
import React from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import Icon from './Icon';
import { colors, radius } from '../utils/constants';
import { coords } from '../utils/format';

/** Device builds without an embedded map show the position and hand off to the system maps app. */
export default function MapView({ center, markers = [], height = 240, style }) {
  const target = center || markers[0];
  const open = () => {
    if (!target) return;
    const { latitude: lat, longitude: lon } = target;
    Linking.openURL(Platform.OS === 'ios' ? `http://maps.apple.com/?ll=${lat},${lon}&q=Location` : `geo:${lat},${lon}?q=${lat},${lon}`);
  };
  return (
    <View style={[styles.wrap, { height }, style]}>
      <View style={styles.pin}>
        <Icon name="map-pin" size={26} color={colors.accent} />
      </View>
      <Text style={styles.coords}>{target ? coords(target.latitude, target.longitude) : t('Position unavailable')}</Text>
      {target ? (
        <Pressable onPress={open} style={styles.link}>
          <Text style={styles.linkText}>{t('Open in Maps')}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: radius.lg, backgroundColor: colors.mapBg, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', gap: 10 },
  pin: { width: 54, height: 54, borderRadius: 27, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  coords: { color: colors.text, fontSize: 14, fontWeight: '600' },
  link: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: colors.accentSoft },
  linkText: { color: colors.accent, fontWeight: '600', fontSize: 13 },
});
