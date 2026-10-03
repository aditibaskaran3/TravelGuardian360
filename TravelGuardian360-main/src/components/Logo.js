import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { colors } from '../utils/constants';

export function LogoMark({ size = 56 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Path d="M32 6l20 8v15c0 12.500-8.500 22-20 27C20.500 51 12 41.500 12 29V14z" fill={colors.accent} />
      <Circle cx="32" cy="29" r="9" fill="none" stroke={colors.bg} strokeWidth="3" />
      <Path d="M23 29h18M32 20c3.500 3.500 3.500 14.500 0 18M32 20c-3.500 3.500-3.500 14.500 0 18" fill="none" stroke={colors.bg} strokeWidth="2.200" />
    </Svg>
  );
}

export default function Logo({ size = 40, showName = true, align = 'row' }) {
  return (
    <View style={[styles.wrap, align === 'column' && styles.column]}>
      <LogoMark size={size} />
      {showName ? (
        <Text style={[styles.name, { fontSize: size * 0.46 }]}>
          TravelGuardian<Text style={styles.accent}>360</Text>
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  column: { flexDirection: 'column', gap: 14 },
  name: { color: colors.text, fontWeight: '800', letterSpacing: -0.3 },
  accent: { color: colors.accent },
});
