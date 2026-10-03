import { t } from '../i18n';
import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import Button from './Button';
import Icon from './Icon';
import { MOBILE_MAX_WIDTH, colors, radius } from '../utils/constants';

/** Bottom sheet on mobile, centred panel on wide screens. Used for forms. */
export function Sheet({ visible, title, onClose, children, wide = false }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, wide && styles.wide]}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={10} accessibilityLabel={t('Close')}>
              <Icon name="x" size={20} color={colors.muted} />
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function ConfirmDialog({
  visible, title, message, confirmLabel = t('Confirm'), danger = false, loading = false, onConfirm, onCancel,
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={[styles.overlay, styles.centered]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <View style={styles.dialog}>
          <View style={[styles.dialogIcon, { backgroundColor: danger ? colors.dangerSoft : colors.accentSoft }]}>
            <Icon name={danger ? 'alert-triangle' : 'help-circle'} size={22} color={danger ? colors.danger : colors.accent} />
          </View>
          <Text style={styles.dialogTitle}>{title}</Text>
          {message ? <Text style={styles.dialogMessage}>{message}</Text> : null}
          <View style={styles.actions}>
            <Button title={t('Cancel')} variant="outline" onPress={onCancel} style={styles.action} />
            <Button title={confirmLabel} variant={danger ? 'danger' : 'primary'} loading={loading} onPress={onConfirm} style={styles.action} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end', alignItems: 'center' },
  centered: { justifyContent: 'center', padding: 24 },
  sheet: {
    width: '100%', maxWidth: MOBILE_MAX_WIDTH, maxHeight: '88%', backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, borderWidth: 1, borderColor: colors.border,
  },
  wide: { maxWidth: 560, borderRadius: radius.xl, marginBottom: 'auto', marginTop: 'auto' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, paddingBottom: 6 },
  title: { color: colors.text, fontSize: 18, fontWeight: '700' },
  body: { padding: 18, paddingTop: 12 },
  dialog: {
    width: '100%', maxWidth: 360, backgroundColor: colors.card, borderRadius: radius.xl, padding: 22,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center',
  },
  dialogIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  dialogTitle: { color: colors.text, fontSize: 17, fontWeight: '700', textAlign: 'center' },
  dialogMessage: { color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 8 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 20, width: '100%' },
  action: { flex: 1 },
});
