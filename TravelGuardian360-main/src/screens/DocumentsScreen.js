import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Button from '../components/Button';
import Card from '../components/Card';
import Header, { IconButton } from '../components/Header';
import Icon from '../components/Icon';
import Input from '../components/Input';
import ScreenContainer from '../components/ScreenContainer';
import { ConfirmDialog, Sheet } from '../components/Sheet';
import { EmptyState, ErrorState, InlineMessage, Loading } from '../components/States';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { t } from '../i18n';
import { documentsApi, familyApi } from '../services/touristService';
import { colors } from '../utils/constants';
import { goBack } from '../utils/nav';

const blank = { family_member_id: null, document_name: '', document_number: '' };
const ACCEPTED_FILE_TYPES = 'image/jpeg,image/png,application/pdf';

export default function DocumentsScreen({ navigation }) {
  const { user } = useAuth();
  const family = useApi(familyApi.list);
  const documents = useApi(documentsApi.list);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState({ tone: 'success', text: '' });
  const [file, setFile] = useState(null);
  const [removeExistingFile, setRemoveExistingFile] = useState(false);
  const [viewing, setViewing] = useState(false);

  const members = family.data || [];
  const people = [{ id: null, full_name: user.full_name, self: true }, ...members];

  const personFor = (id) => people.find((p) => p.id === id) || people[0];

  const open = (doc) => {
    setFormError('');
    setFile(null);
    setRemoveExistingFile(false);
    setForm(doc ? { family_member_id: doc.family_member_id, document_name: doc.document_name || '', document_number: doc.document_number || '' } : blank);
    setEditing(doc || {});
  };
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const onPickFile = (event) => {
    const picked = event.target.files && event.target.files[0];
    if (!picked) return;
    if (!ACCEPTED_FILE_TYPES.split(',').includes(picked.type)) {
      setFormError(t('Only JPG, PNG or PDF files are allowed.'));
      event.target.value = '';
      return;
    }
    if (picked.size > 10 * 1024 * 1024) {
      setFormError(t('File is too large. The maximum size is 10 MB.'));
      event.target.value = '';
      return;
    }
    setFormError('');
    setFile(picked);
    setRemoveExistingFile(false);
  };

  const save = async () => {
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        family_member_id: form.family_member_id,
        document_name: form.document_name.trim() || null,
        document_number: form.document_number.trim() || null,
        file,
        removeFile: removeExistingFile,
      };
      if (editing && editing.id) await documentsApi.update(editing.id, payload);
      else await documentsApi.create(payload);
      setNotice({ tone: 'success', text: editing && editing.id ? t('Document updated.') : t('Document added.') });
      setEditing(null);
      await documents.reload({ silent: true });
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const viewFile = async (doc) => {
    setViewing(true);
    try {
      const blob = await documentsApi.fetchFile(doc.id);
      const url = URL.createObjectURL(blob);
      if (typeof window !== 'undefined') window.open(url, '_blank', 'noopener');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      setNotice({ tone: 'danger', text: err.message });
    } finally {
      setViewing(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await documentsApi.remove(removing.id);
      setNotice({ tone: 'success', text: t('Document removed.') });
      setRemoving(null);
      await documents.reload({ silent: true });
    } catch (err) {
      setNotice({ tone: 'danger', text: err.message });
      setRemoving(null);
    } finally {
      setBusy(false);
    }
  };

  const items = documents.data || [];
  // Group by person so documents are easy to scan per family member.
  const groups = people
    .map((p) => ({ person: p, docs: items.filter((d) => d.family_member_id === p.id) }))
    .filter((g) => g.docs.length > 0);

  return (
    <ScreenContainer
      refreshing={false}
      onRefresh={() => documents.reload({ silent: true })}
      header={<Header title={t('Documents')} subtitle={t('Quick reference for travel documents')} onBack={() => goBack(navigation)} right={<IconButton icon="plus" label={t('Add document')} onPress={() => open(null)} />} />}
    >
      <View style={styles.note}>
        <Icon name="file-text" size={16} color={colors.accent} />
        <Text style={styles.noteText}>{t('Keep names and numbers of important documents handy for every traveller. You can also attach an image or PDF of each document.')}</Text>
      </View>
      <InlineMessage tone={notice.tone}>{notice.text}</InlineMessage>

      {(documents.loading || family.loading) && !documents.data ? (
        <Loading label={t('Loading documents…')} />
      ) : documents.error && !documents.data ? (
        <ErrorState message={documents.error} onRetry={documents.reload} />
      ) : items.length === 0 ? (
        <EmptyState
          icon="file-text"
          title={t('No documents yet')}
          message={t('Add passport, ID or other document numbers for quick reference.')}
          action={<Button title={t('Add document')} icon="plus" small full={false} variant="soft" onPress={() => open(null)} />}
        />
      ) : (
        groups.map((g) => (
          <View key={g.person.id ?? 'self'} style={styles.group}>
            <Text style={styles.groupTitle}>{g.person.self ? t('Myself') : g.person.full_name}</Text>
            {g.docs.map((d) => (
              <Card key={d.id} style={styles.card}>
                <View style={styles.top}>
                  <View style={styles.avatar}><Icon name="file-text" size={18} color={colors.accent} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{d.document_name || t('Document')}</Text>
                    {d.document_number ? <Text style={styles.muted}>{d.document_number}</Text> : null}
                    {d.file_name ? (
                      <View style={styles.attachmentRow}>
                        <Icon name="paperclip" size={12} color={colors.muted} />
                        <Text style={styles.attachmentText} numberOfLines={1}>{d.file_name}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
                <View style={styles.actions}>
                  {d.file_name ? (
                    <Button small icon="eye" title={t('View attachment')} variant="outline" full={false} loading={viewing} onPress={() => viewFile(d)} />
                  ) : null}
                  <Button small icon="edit-2" title={t('Edit')} variant="outline" full={false} onPress={() => open(d)} />
                  <Button small icon="trash-2" title={t('Delete')} variant="ghost" full={false} style={{ marginLeft: 'auto' }} onPress={() => setRemoving(d)} />
                </View>
              </Card>
            ))}
          </View>
        ))
      )}

      <Sheet visible={editing !== null} title={editing && editing.id ? t('Edit document') : t('Add document')} onClose={() => setEditing(null)}>
        <InlineMessage>{formError}</InlineMessage>
        <Text style={styles.formLabel}>{t('Whose document')}</Text>
        <View style={styles.people}>
          {people.map((p) => {
            const active = form.family_member_id === p.id;
            return (
              <Pressable key={p.id ?? 'self'} onPress={() => set('family_member_id')(p.id)} style={[styles.person, active && styles.personActive]}>
                <Text style={[styles.personText, active && { color: '#fff' }]} numberOfLines={1}>{p.self ? t('Myself') : p.full_name}</Text>
              </Pressable>
            );
          })}
        </View>
        <Input label={t('Document name')} icon="file-text" value={form.document_name} onChangeText={set('document_name')} placeholder={t('Passport, Aadhar Card…')} />
        <Input label={t('Document number')} icon="hash" value={form.document_number} onChangeText={set('document_number')} autoCapitalize="characters" />

        <Text style={styles.formLabel}>{t('Attach image or PDF (optional)')}</Text>
        {editing && editing.file_name && !removeExistingFile && !file ? (
          <View style={styles.existingFile}>
            <Icon name="paperclip" size={14} color={colors.textSoft} />
            <Text style={styles.existingFileText} numberOfLines={1}>{editing.file_name}</Text>
            <Pressable onPress={() => setRemoveExistingFile(true)}>
              <Text style={styles.removeFileLink}>{t('Remove')}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.filePicker}>
            <input
              type="file"
              accept={ACCEPTED_FILE_TYPES}
              onChange={onPickFile}
              style={styles.fileInput}
            />
            {file ? <Text style={styles.selectedFileText} numberOfLines={1}>{file.name}</Text> : null}
          </View>
        )}

        <Button title={editing && editing.id ? t('Save changes') : t('Add document')} loading={saving} onPress={save} style={{ marginTop: 14 }} />
      </Sheet>

      <ConfirmDialog
        visible={!!removing}
        danger
        title={t('Remove this document?')}
        message={removing ? t('{name} will be removed from your documents.', { name: removing.document_name || t('This document') }) : ''}
        confirmLabel={t('Delete')}
        loading={busy}
        onConfirm={remove}
        onCancel={() => setRemoving(null)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  note: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', padding: 12, borderRadius: 12, backgroundColor: colors.accentSoft, marginBottom: 14 },
  noteText: { color: colors.textSoft, fontSize: 12, lineHeight: 18, flex: 1 },
  group: { marginBottom: 10 },
  groupTitle: { color: colors.textSoft, fontSize: 13, fontWeight: '700', marginBottom: 8 },
  card: { marginBottom: 12 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  name: { color: colors.text, fontSize: 15, fontWeight: '700' },
  muted: { color: colors.muted, fontSize: 12, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 14, alignItems: 'center' },
  formLabel: { color: colors.textSoft, fontSize: 13, fontWeight: '600', marginBottom: 8 },
  people: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  person: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg, cursor: 'pointer', maxWidth: 160 },
  personActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  personText: { color: colors.textSoft, fontWeight: '700', fontSize: 13 },
  attachmentRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  attachmentText: { color: colors.muted, fontSize: 11, flexShrink: 1 },
  filePicker: { marginBottom: 16 },
  fileInput: { fontSize: 13, color: colors.textSoft },
  selectedFileText: { color: colors.textSoft, fontSize: 12, marginTop: 6 },
  existingFile: {
    flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg, marginBottom: 16,
  },
  existingFileText: { color: colors.textSoft, fontSize: 13, flex: 1 },
  removeFileLink: { color: colors.danger, fontSize: 12, fontWeight: '700' },
});
