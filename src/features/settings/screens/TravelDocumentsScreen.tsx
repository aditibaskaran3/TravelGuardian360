/**
 * Travel documents — securely record important travel papers on-device.
 *
 * One traveller can store records for themselves or family members (spouse,
 * children). Records are persisted locally via travelDocumentsService and can
 * be added and removed. (Photo capture will be added when a native image
 * picker is available; for now documents are stored as structured records.)
 */
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import {
  addTravelDocument,
  deleteTravelDocument,
  getTravelDocuments,
  type TravelDocument,
} from '../services/travelDocumentsService';
import { useTranslation } from '../../../i18n/useTranslation';

export default function TravelDocumentsScreen() {
  const { t } = useTranslation();
  const [documents, setDocuments] = useState<TravelDocument[]>([]);
  const [name, setName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [type, setType] = useState('Passport');
  const [reference, setReference] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadDocuments = async () => {
      const saved = await getTravelDocuments();
      setDocuments(saved);
    };

    loadDocuments();
  }, []);

  const handleAdd = async () => {
    if (!name.trim() || !ownerName.trim()) {
      Alert.alert(t('documents.missingDetailsTitle'), t('documents.missingDetailsMessage'));
      return;
    }

    setSaving(true);
    const created = await addTravelDocument({ name, ownerName, type, reference });
    setDocuments((prev) => [created, ...prev]);
    setName('');
    setOwnerName('');
    setType('Passport');
    setReference('');
    setSaving(false);
    Alert.alert(t('documents.savedTitle'), t('documents.savedMessage'));
  };

  const handleDelete = (doc: TravelDocument) => {
    Alert.alert(t('documents.removeTitle'), t('documents.removeMessage', { name: doc.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.remove'),
        style: 'destructive',
        onPress: async () => {
          const next = await deleteTravelDocument(doc.id);
          setDocuments(next);
        },
      },
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerClassName="p-4 gap-4">
      <View className="rounded-3xl bg-indigo-600 p-5">
        <Text className="text-sm font-semibold uppercase tracking-widest text-indigo-200">
          {t('documents.title')}
        </Text>
        <Text className="mt-1 text-xl font-semibold text-white">{t('documents.subtitle')}</Text>
        <Text className="mt-2 text-sm text-indigo-100">{t('documents.description')}</Text>
      </View>

      <View className="rounded-2xl bg-white p-4">
        <Text className="text-base font-semibold text-slate-900">{t('documents.addTitle')}</Text>
        <Text className="mt-2 text-sm text-slate-500">{t('documents.addDescription')}</Text>

        <Text className="mt-3 text-xs font-semibold text-slate-600">{t('documents.nameLabel')}</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={t('documents.namePlaceholder')}
          placeholderTextColor="#a0aec0"
          className="mt-1 rounded-xl border border-slate-200 px-3 py-3 text-sm text-slate-900"
        />

        <Text className="mt-3 text-xs font-semibold text-slate-600">{t('documents.ownerLabel')}</Text>
        <TextInput
          value={ownerName}
          onChangeText={setOwnerName}
          placeholder={t('documents.ownerPlaceholder')}
          placeholderTextColor="#a0aec0"
          className="mt-1 rounded-xl border border-slate-200 px-3 py-3 text-sm text-slate-900"
        />

        <Text className="mt-3 text-xs font-semibold text-slate-600">{t('documents.typeLabel')}</Text>
        <TextInput
          value={type}
          onChangeText={setType}
          placeholder={t('documents.typePlaceholder')}
          placeholderTextColor="#a0aec0"
          className="mt-1 rounded-xl border border-slate-200 px-3 py-3 text-sm text-slate-900"
        />

        <Text className="mt-3 text-xs font-semibold text-slate-600">{t('documents.referenceLabel')}</Text>
        <TextInput
          value={reference}
          onChangeText={setReference}
          placeholder={t('documents.referencePlaceholder')}
          placeholderTextColor="#a0aec0"
          className="mt-1 rounded-xl border border-slate-200 px-3 py-3 text-sm text-slate-900"
        />
        <Pressable
          accessibilityRole="button"
          onPress={handleAdd}
          disabled={saving}
          className="mt-4 rounded-2xl bg-indigo-600 px-4 py-3 active:opacity-80"
        >
          <Text className="text-center text-sm font-semibold text-white">
            {saving ? t('documents.saving') : t('documents.save')}
          </Text>
        </Pressable>
      </View>

      {documents.length === 0 ? (
        <Text className="px-2 text-center text-sm text-slate-400">
          {t('documents.emptyState')}
        </Text>
      ) : (
        <View className="gap-3">
          {documents.map((doc) => (
            <View key={doc.id} className="rounded-2xl border border-slate-100 bg-white p-4">
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-2">
                  <Text className="text-base font-semibold text-slate-900">{doc.name}</Text>
                  <Text className="mt-1 text-sm text-slate-500">
                    {doc.ownerName} • {doc.type}
                  </Text>
                  {doc.reference ? (
                    <Text className="mt-1 text-sm text-slate-500">{t('documents.noLabel', { reference: doc.reference })}</Text>
                  ) : null}
                  <Text className="mt-2 text-xs font-medium uppercase tracking-widest text-indigo-600">
                    {doc.status}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Remove document"
                  hitSlop={8}
                  onPress={() => handleDelete(doc)}
                  className="rounded-full bg-red-50 px-3 py-1.5 active:opacity-70"
                >
                  <Text className="text-xs font-semibold text-red-600">{t('common.remove')}</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
