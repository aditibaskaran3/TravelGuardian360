import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius } from '../utils/constants';

export default function Card({ children, style, onPress, tone, padded = true }) {
  const toneStyle = tone === 'alt' ? styles.alt : null;
  const content = [styles.card, padded && styles.padded, toneStyle, style];
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [...content, pressed && styles.pressed]}>
        {children}
      </Pressable>
    );
  }
  return <View style={content}>{children}</View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  padded: { padding: 16 },
  alt: { backgroundColor: colors.cardAlt },
  pressed: { opacity: 0.85 },
});
