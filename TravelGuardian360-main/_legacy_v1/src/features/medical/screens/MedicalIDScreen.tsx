/**
 * Emergency Medical ID screen — critical health info for first responders.
 *
 * Users can record blood group, allergies, medications, and medical conditions
 * for themselves and view family members' medical information.
 * Emergency contact is pulled from their profile.
 * All data is persisted locally for instant access in emergencies.
 */
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAuthStore } from '../../../store/authStore';
import { useMedicalStore } from '../../../store/medicalStore';
import { useFamilyStore } from '../../../store/familyStore';
import Button from '../../../components/ui/Button';
import { useTranslation } from '../../../i18n/useTranslation';
import type { AppStackParamList } from '../../../navigation/types';
import type { BloodGroup } from '../types';

type Nav = NativeStackNavigationProp<AppStackParamList>;

const BLOOD_GROUPS: BloodGroup[] = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

export default function MedicalIDScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const data = useMedicalStore((s) => s.data);
  const familyMembers = useFamilyStore((s) => s.members);
  const setBloodGroup = useMedicalStore((s) => s.setBloodGroup);
  const addAllergy = useMedicalStore((s) => s.addAllergy);
  const removeAllergy = useMedicalStore((s) => s.removeAllergy);
  const addCondition = useMedicalStore((s) => s.addCondition);
  const removeCondition = useMedicalStore((s) => s.removeCondition);
  const addMedication = useMedicalStore((s) => s.addMedication);
  const removeMedication = useMedicalStore((s) => s.removeMedication);
  const save = useMedicalStore((s) => s.save);
  const hydrate = useMedicalStore((s) => s.hydrate);

  const [newAllergy, setNewAllergy] = useState('');
  const [newCondition, setNewCondition] = useState('');
  const [newMedication, setNewMedication] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const handleSave = async () => {
    setSaving(true);
    await save();
    setSaving(false);
    Alert.alert('Saved', 'Your medical ID has been saved.');
  };

  const handleAddAllergy = async () => {
    if (!newAllergy.trim()) return;
    if (data.allergies.includes(newAllergy.trim())) {
      Alert.alert('Duplicate', 'This allergy is already recorded.');
      return;
    }
    await addAllergy(newAllergy.trim());
    setNewAllergy('');
  };

  const handleAddCondition = async () => {
    if (!newCondition.trim()) return;
    if (data.medicalConditions.includes(newCondition.trim())) {
      Alert.alert('Duplicate', 'This condition is already recorded.');
      return;
    }
    await addCondition(newCondition.trim());
    setNewCondition('');
  };

  const handleAddMedication = async () => {
    if (!newMedication.trim()) return;
    if (data.medications.includes(newMedication.trim())) {
      Alert.alert('Duplicate', 'This medication is already recorded.');
      return;
    }
    await addMedication(newMedication.trim());
    setNewMedication('');
  };

  if (!user) {
    return null;
  }

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerClassName="p-4 gap-4">
      <View className="rounded-3xl bg-red-600 p-5">
        <Text className="text-sm font-semibold uppercase tracking-widest text-red-100">
          {t('medical.title')}
        </Text>
        <Text className="mt-1 text-xl font-semibold text-white">{t('medical.subtitle')}</Text>
        <Text className="mt-2 text-sm text-red-100">{t('medical.description')}</Text>
      </View>

      {/* Emergency contact (read-only from profile) */}
      <View className="rounded-2xl bg-white p-4">
        <Text className="text-base font-semibold text-slate-900">{t('medical.emergencyContact')}</Text>
        <Text className="mt-2 text-sm font-semibold text-slate-900">
          {user.emergencyContact.name}
        </Text>
        <Text className="text-sm text-slate-500">📞 {user.emergencyContact.phone}</Text>
        <Text className="mt-2 text-xs text-slate-400">
          (From your profile • {t('medical.updateInProfile')})
        </Text>
      </View>

      {/* Blood group */}
      <View className="rounded-2xl bg-white p-4">
        <Text className="text-base font-semibold text-slate-900">{t('medical.bloodGroup')}</Text>
        <View className="mt-3 flex-wrap flex-row gap-2">
          {BLOOD_GROUPS.map((group) => (
            <Pressable
              key={group}
              onPress={() => setBloodGroup(group)}
              className={`rounded-lg px-3 py-2 ${
                data.bloodGroup === group
                  ? 'bg-red-600'
                  : 'border border-slate-200 bg-white'
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  data.bloodGroup === group ? 'text-white' : 'text-slate-600'
                }`}
              >
                {group}
              </Text>
            </Pressable>
          ))}
        </View>
        {data.bloodGroup && (
          <Pressable onPress={() => setBloodGroup(null)} className="mt-2">
            <Text className="text-xs text-red-500">Clear</Text>
          </Pressable>
        )}
      </View>

      {/* Allergies */}
      <View className="rounded-2xl bg-white p-4">
        <Text className="text-base font-semibold text-slate-900">{t('medical.allergies')}</Text>
        <Text className="mt-1 text-xs text-slate-500">
          Any allergies to medications, foods, or materials?
        </Text>
        <View className="mt-3 flex-row gap-2">
          <TextInput
            value={newAllergy}
            onChangeText={setNewAllergy}
            placeholder="E.g. Penicillin, Shellfish, Latex"
            placeholderTextColor="#a0aec0"
            className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
          />
          <Pressable
            onPress={handleAddAllergy}
            className="rounded-xl bg-slate-100 px-3 py-2 active:opacity-70"
          >
            <Text className="text-base font-bold text-slate-600">+</Text>
          </Pressable>
        </View>
        {data.allergies.length > 0 && (
          <View className="mt-2 flex-wrap flex-row gap-2">
            {data.allergies.map((allergy) => (
              <Pressable
                key={allergy}
                onPress={() => removeAllergy(allergy)}
                className="flex-row items-center gap-1 rounded-full bg-red-100 px-3 py-1"
              >
                <Text className="text-xs font-semibold text-red-600">{allergy}</Text>
                <Text className="text-xs text-red-600">✕</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* Medical conditions */}
      <View className="rounded-2xl bg-white p-4">
        <Text className="text-base font-semibold text-slate-900">{t('medical.conditions')}</Text>
        <Text className="mt-1 text-xs text-slate-500">
          Any chronic or ongoing health conditions?
        </Text>
        <View className="mt-3 flex-row gap-2">
          <TextInput
            value={newCondition}
            onChangeText={setNewCondition}
            placeholder="E.g. Asthma, Diabetes, Hypertension"
            placeholderTextColor="#a0aec0"
            className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
          />
          <Pressable
            onPress={handleAddCondition}
            className="rounded-xl bg-slate-100 px-3 py-2 active:opacity-70"
          >
            <Text className="text-base font-bold text-slate-600">+</Text>
          </Pressable>
        </View>
        {data.medicalConditions.length > 0 && (
          <View className="mt-2 flex-wrap flex-row gap-2">
            {data.medicalConditions.map((condition) => (
              <Pressable
                key={condition}
                onPress={() => removeCondition(condition)}
                className="flex-row items-center gap-1 rounded-full bg-amber-100 px-3 py-1"
              >
                <Text className="text-xs font-semibold text-amber-600">{condition}</Text>
                <Text className="text-xs text-amber-600">✕</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* Medications */}
      <View className="rounded-2xl bg-white p-4">
        <Text className="text-base font-semibold text-slate-900">{t('medical.medications')}</Text>
        <Text className="mt-1 text-xs text-slate-500">
          Any medications they take regularly? Include dose and frequency.
        </Text>
        <View className="mt-3 flex-row gap-2">
          <TextInput
            value={newMedication}
            onChangeText={setNewMedication}
            placeholder="E.g. Aspirin 100mg daily, Insulin 10 units with meals"
            placeholderTextColor="#a0aec0"
            className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
          />
          <Pressable
            onPress={handleAddMedication}
            className="rounded-xl bg-slate-100 px-3 py-2 active:opacity-70"
          >
            <Text className="text-base font-bold text-slate-600">+</Text>
          </Pressable>
        </View>
        {data.medications.length > 0 && (
          <View className="mt-2 flex-wrap flex-row gap-2">
            {data.medications.map((medication) => (
              <Pressable
                key={medication}
                onPress={() => removeMedication(medication)}
                className="flex-row items-center gap-1 rounded-full bg-blue-100 px-3 py-1"
              >
                <Text className="text-xs font-semibold text-blue-600">{medication}</Text>
                <Text className="text-xs text-blue-600">✕</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* Preview card */}
      {data.bloodGroup || data.medicalConditions.length > 0 || data.medications.length > 0 ? (
        <View className="rounded-2xl border-2 border-red-200 bg-red-50 p-4">
          <Text className="text-xs font-semibold uppercase tracking-widest text-red-600">
            Quick Reference
          </Text>
          {data.bloodGroup && (
            <Text className="mt-2 text-lg font-bold text-red-900">🩸 {data.bloodGroup}</Text>
          )}
          {data.medicalConditions.length > 0 && (
            <Text className="mt-1 text-xs text-red-700">
              Conditions: {data.medicalConditions.join(', ')}
            </Text>
          )}
          {data.medications.length > 0 && (
            <Text className="mt-1 text-xs text-red-700">
              Medications: {data.medications.join(', ')}
            </Text>
          )}
        </View>
      ) : null}

      {/* Save button */}
      <Button label={t('medical.save')} onPress={handleSave} disabled={saving} />

      {/* Family Members Section */}
      {familyMembers.length > 0 && (
        <>
          <View className="mt-4 rounded-3xl bg-purple-600 p-5">
            <Text className="text-sm font-semibold uppercase tracking-widest text-purple-100">
              Family Members
            </Text>
            <Text className="mt-1 text-lg font-semibold text-white">
              {familyMembers.length} {familyMembers.length === 1 ? 'member' : 'members'}
            </Text>
            <Text className="mt-2 text-sm text-purple-100">
              Tap any family member to edit their medical details
            </Text>
          </View>

          <View className="gap-3">
            {familyMembers.map((member) => (
              <Pressable
                key={member.id}
                onPress={() => navigation.navigate('FamilyMemberMedical', { memberId: member.id })}
                className="rounded-2xl border border-slate-100 bg-white p-4 active:opacity-80"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-2">
                    <Text className="text-base font-semibold text-slate-900">{member.name}</Text>
                    <Text className="text-sm text-slate-500">{member.relationship}</Text>

                    {member.bloodGroup && (
                      <Text className="mt-2 text-sm font-bold text-red-600">
                        🩸 {member.bloodGroup}
                      </Text>
                    )}

                    {member.allergies.length > 0 && (
                      <Text className="mt-1 text-xs text-slate-600">
                        Allergies: {member.allergies.join(', ')}
                      </Text>
                    )}

                    {member.medicalConditions.length > 0 && (
                      <Text className="mt-1 text-xs text-slate-600">
                        Conditions: {member.medicalConditions.join(', ')}
                      </Text>
                    )}

                    {!member.bloodGroup &&
                      member.allergies.length === 0 &&
                      member.medicalConditions.length === 0 && (
                        <Text className="mt-2 text-xs font-semibold text-slate-400">
                          No medical details yet
                        </Text>
                      )}
                  </View>
                  <Text className="text-lg text-slate-300">›</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}
