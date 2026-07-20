import React, { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { addTravelDocument, getTravelDocuments, type TravelDocument } from '../services/travelDocumentsService';

export default function TravelDocumentsScreen() {
  const [documents, setDocuments] = useState<TravelDocument[]>([]);
  const [name, setName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [type, setType] = useState('Passport');
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadDocuments = async () => {
      const saved = await getTravelDocuments();
      setDocuments(saved);
    };

    loadDocuments();
  }, []);

  const pickPhoto = () => {
    if (!photoUri) {
      setPhotoUri('file:///mock-document-photo.jpg');
      Alert.alert('Photo selected', 'The document photo has been attached for upload.');
      return;
    }

    Alert.alert('Photo already selected', 'This entry already has a document photo attached.');
  };

  const handleUpload = async () => {
    if (!name.trim() || !ownerName.trim()) {
      Alert.alert('Missing details', 'Please enter a document name and the person it belongs to.');
      return;
    }

    if (!photoUri) {
      Alert.alert('Photo required', 'Please select a document photo before uploading.');
      return;
    }

    setSaving(true);
    const created = await addTravelDocument({ name, ownerName, type, photoUri });
    setDocuments((prev) => [created, ...prev]);
    setName('');
    setOwnerName('');
    setType('Passport');
    setPhotoUri(undefined);
    setSaving(false);
    Alert.alert('Upload complete', 'Your document photo has been saved successfully.');
  };

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerClassName="p-4 gap-4">
      <View className="rounded-3xl bg-indigo-600 p-5">
        <Text className="text-sm font-semibold uppercase tracking-widest text-indigo-200">Secure storage</Text>
        <Text className="mt-1 text-xl font-semibold text-white">Upload important travel documents</Text>
        <Text className="mt-2 text-sm text-indigo-100">
          One traveller can upload papers for themselves or family members such as a spouse or children.
        </Text>
      </View>

      <View className="rounded-2xl bg-white p-4">
        <Text className="text-base font-semibold text-slate-900">Add a document</Text>
        <Text className="mt-2 text-sm text-slate-500">Upload a photo of the document for digital verification.</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Document name (e.g. Wife Passport)"
          className="mt-3 rounded-xl border border-slate-200 px-3 py-3 text-sm"
        />
        <TextInput
          value={ownerName}
          onChangeText={setOwnerName}
          placeholder="Who is this for?"
          className="mt-3 rounded-xl border border-slate-200 px-3 py-3 text-sm"
        />
        <TextInput
          value={type}
          onChangeText={setType}
          placeholder="Document type"
          className="mt-3 rounded-xl border border-slate-200 px-3 py-3 text-sm"
        />
        <Pressable
          accessibilityRole="button"
          onPress={pickPhoto}
          className="mt-3 rounded-2xl border border-dashed border-indigo-300 bg-indigo-50 px-4 py-4 active:opacity-80"
        >
          <Text className="text-center text-sm font-semibold text-indigo-700">
            {photoUri ? 'Photo selected for upload' : 'Pick document photo'}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={handleUpload}
          disabled={saving}
          className="mt-4 rounded-2xl bg-indigo-600 px-4 py-3 active:opacity-80"
        >
          <Text className="text-center text-sm font-semibold text-white">
            {saving ? 'Uploading...' : 'Upload document photo'}
          </Text>
        </Pressable>
      </View>

      <View className="gap-3">
        {documents.map((doc) => (
          <View key={doc.id} className="rounded-2xl border border-slate-100 bg-white p-4">
            {doc.photoUri ? (
              <Image source={{ uri: doc.photoUri }} className="mb-3 h-40 w-full rounded-2xl" />
            ) : null}
            <Text className="text-base font-semibold text-slate-900">{doc.name}</Text>
            <Text className="mt-1 text-sm text-slate-500">{doc.ownerName} • {doc.type}</Text>
            <Text className="mt-2 text-xs font-medium uppercase tracking-widest text-indigo-600">{doc.status}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
