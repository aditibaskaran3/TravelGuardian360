import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import Icon from './Icon';
import { colors, radius } from '../utils/constants';
import { t } from '../i18n';

export default function Input({
  label, value, onChangeText, error, icon, secure = false, multiline = false, style, hint, ...rest
}) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secure);
  return (
    <View style={[styles.wrap, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.field, multiline && styles.multi, focused && styles.focused, !!error && styles.errored]}>
        {icon ? <Icon name={icon} size={18} color={focused ? colors.accent : colors.muted} /> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={hidden}
          multiline={multiline}
          placeholderTextColor={colors.muted}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[styles.input, multiline && styles.inputMulti, Platform.OS === 'web' && styles.web]}
          {...rest}
        />
        {secure ? (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={10} accessibilityLabel={t('Toggle password visibility')}>
            <Icon name={hidden ? 'eye' : 'eye-off'} size={18} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: { color: colors.textSoft, fontSize: 13, fontWeight: '600', marginBottom: 7 },
  field: {
    minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14,
    backgroundColor: colors.bg, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
  },
  multi: { alignItems: 'flex-start', paddingVertical: 12 },
  focused: { borderColor: colors.accent },
  errored: { borderColor: colors.danger },
  input: { flex: 1, color: colors.text, fontSize: 15, paddingVertical: 12 },
  inputMulti: { minHeight: 70, textAlignVertical: 'top', paddingVertical: 0 },
  web: { outlineStyle: 'none', outlineWidth: 0 },
  error: { color: colors.danger, fontSize: 12, marginTop: 6 },
  hint: { color: colors.muted, fontSize: 12, marginTop: 6 },
});
