import React, { createElement, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '../utils/constants';

/** Native browser date picker, bound to a YYYY-MM-DD string. */
export default function DateField({ label, value, onChange, error, min }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      {createElement('input', {
        type: 'date',
        value: value || '',
        min,
        onChange: (e) => onChange(e.target.value),
        onFocus: () => setFocused(true),
        onBlur: () => setFocused(false),
        style: {
          height: 50, width: '100%', boxSizing: 'border-box', padding: '0 14px', fontSize: 15, color: colors.text,
          backgroundColor: colors.bg, colorScheme: 'dark', outline: 'none', borderRadius: radius.md,
          border: `1px solid ${error ? colors.danger : focused ? colors.accent : colors.border}`,
        },
      })}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: { color: colors.textSoft, fontSize: 13, fontWeight: '600', marginBottom: 7 },
  error: { color: colors.danger, fontSize: 12, marginTop: 6 },
});
