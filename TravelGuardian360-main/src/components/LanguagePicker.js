import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Icon from './Icon';
import { Sheet } from './Sheet';
import { LANGUAGES, currentLanguage, setLanguage, t } from '../i18n';
import { colors } from '../utils/constants';

/** Language list shown in a sheet. Choosing a language saves it and reloads the app in that language. */
export function LanguageSheet({ visible, onClose }) {
  return (
    <Sheet visible={visible} title={t('Choose your language')} onClose={onClose}>
      {LANGUAGES.map((l) => {
        const active = l.code === currentLanguage.code;
        return (
          <Pressable
            key={l.code}
            onPress={() => (active ? onClose() : setLanguage(l.code))}
            style={[styles.row, active && styles.active]}
            accessibilityRole="button"
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.native}>{l.native}</Text>
              {l.english !== l.native ? <Text style={styles.english}>{l.english}</Text> : null}
            </View>
            {active ? <Icon name="check" size={18} color={colors.accent} /> : null}
          </Pressable>
        );
      })}
    </Sheet>
  );
}

/** Compact button (globe + language name) that opens the language list. */
export default function LanguagePicker({ style }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={[styles.button, style]} accessibilityLabel={t('Language')}>
        <Icon name="globe" size={16} color={colors.textSoft} />
        <Text style={styles.buttonText}>{currentLanguage.native}</Text>
      </Pressable>
      <LanguageSheet visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, cursor: 'pointer',
  },
  buttonText: { color: colors.textSoft, fontSize: 12, fontWeight: '600' },
  row: {
    flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.bg, marginBottom: 8, cursor: 'pointer',
  },
  active: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  native: { color: colors.text, fontSize: 16, fontWeight: '600' },
  english: { color: colors.muted, fontSize: 12, marginTop: 2 },
});
