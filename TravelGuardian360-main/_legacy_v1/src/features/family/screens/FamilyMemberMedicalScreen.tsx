/**
 * Family member medical details editor — edit blood group, allergies, etc for one family member.
 *
 * Accessed from Family Members screen. All changes saved via explicit Save button.
 */
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';

import { useFamilyStore } from '../../../store/familyStore';
import Button from '../../../components/ui/Button';
import { useTranslation } from '../../../i18n/useTranslation';
import type { BloodGroup } from '../../medical/types';

const BLOOD_GROUPS: BloodGroup[] = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

type RouteParams = {
  FamilyMemberMedical: { memberId: string };
};

export default function FamilyMemberMedicalScreen() {
  const { t } = useTranslation();
  const route = useRoute<RouteProp<RouteParams, 'FamilyMemberMedical'>>();
  const { memberId } = route.params;

  const members = useFamilyStore((s) => s.members);
  const updateMember = useFamilyStore((s) => s.updateMember);

  const member = members.find((m) => m.id === memberId);

  // Local state for pending changes
  const [tempBloodGroup, setTempBloodGroup] = useState<BloodGroup | null>(
    member?.bloodGroup ?? null,
  );
  const [tempAllergies, setTempAllergies] = useState<string[]>(member?.allergies ?? []);
  const [tempConditions, setTempConditions] = useState<string[]>(member?.medicalConditions ?? []);
  const [tempMedications, setTempMedications] = useState<string[]>(member?.medications ?? []);

  const [newAllergy, setNewAllergy] = useState('');
  const [newCondition, setNewCondition] = useState('');
  const [newMedication, setNewMedication] = useState('');
  const [saving, setSaving] = useState(false);

  if (!member) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <Text className="text-slate-600">Family member not found</Text>
      </View>
    );
  }

  const handleAddAllergy = () => {
    if (!newAllergy.trim()) {
      Alert.alert('Required', 'Please enter an allergy name.');
      return;
    }
    if (tempAllergies.includes(newAllergy.trim())) {
      Alert.alert('Duplicate', 'This allergy is already recorded.');
      return;
    }
    setTempAllergies([...tempAllergies, newAllergy.trim()]);
    setNewAllergy('');
  };

  const handleAddCondition = () => {
    if (!newCondition.trim()) {
      Alert.alert('Required', 'Please enter a medical condition.');
      return;
    }
    if (tempConditions.includes(newCondition.trim())) {
      Alert.alert('Duplicate', 'This condition is already recorded.');
      return;
    }
    setTempConditions([...tempConditions, newCondition.trim()]);
    setNewCondition('');
  };

  const handleAddMedication = () => {
    if (!newMedication.trim()) {
      Alert.alert('Required', 'Please enter a medication.');
      return;
    }
    if (tempMedications.includes(newMedication.trim())) {
      Alert.alert('Duplicate', 'This medication is already recorded.');
      return;
    }
    setTempMedications([...tempMedications, newMedication.trim()]);
    setNewMedication('');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateMember(memberId, {
        bloodGroup: tempBloodGroup,
        allergies: tempAllergies,
        medicalConditions: tempConditions,
        medications: tempMedications,
      });
      Alert.alert('Saved', `${member.name}'s medical information has been saved.`);
    } catch (error) {
      Alert.alert('Error', 'Failed to save medical information.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerClassName="p-4 gap-4">
      {/* Header */}
      <View className="rounded-2xl bg-purple-600 p-4">
        <Text className="text-xs font-semibold uppercase tracking-widest text-purple-100">
          {member.relationship}
        </Text>
        <Text className="mt-2 text-2xl font-bold text-white">{member.name}</Text>
        <Text className="mt-1 text-sm text-purple-100">Medical information</Text>
      </View>

      {/* Blood Group */}
      <View className="rounded-2xl bg-white p-4">
        <Text className="text-base font-semibold text-slate-900">{t('medical.bloodGroup')}</Text>
        <Text className="mt-1 text-xs text-slate-500">Select one blood type</Text>
        <View className="mt-3 flex-wrap flex-row gap-2">
          {BLOOD_GROUPS.map((group) => (
            <Pressable
              key={group}
              onPress={() => setTempBloodGroup(group)}
              className={`rounded-lg px-3 py-2 ${
                tempBloodGroup === group ? 'bg-purple-600' : 'border border-slate-200 bg-white'
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  tempBloodGroup === group ? 'text-white' : 'text-slate-600'
                }`}
              >
                {group}
              </Text>
            </Pressable>
          ))}
        </View>
        {tempBloodGroup && (
          <Pressable onPress={() => setTempBloodGroup(null)} className="mt-2">
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
        {tempAllergies.length > 0 && (
          <View className="mt-2 flex-wrap flex-row gap-2">
            {tempAllergies.map((allergy) => (
              <Pressable
                key={allergy}
                onPress={() => setTempAllergies(tempAllergies.filter((a) => a !== allergy))}
                className="flex-row items-center gap-1 rounded-full bg-red-100 px-3 py-1"
              >
                <Text className="text-xs font-semibold text-red-600">{allergy}</Text>
                <Text className="text-xs text-red-600">✕</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* Medical Conditions */}
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
        {tempConditions.length > 0 && (
          <View className="mt-2 flex-wrap flex-row gap-2">
            {tempConditions.map((condition) => (
              <Pressable
                key={condition}
                onPress={() =>
                  setTempConditions(tempConditions.filter((c) => c !== condition))
                }
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
        {tempMedications.length > 0 && (
          <View className="mt-2 flex-wrap flex-row gap-2">
            {tempMedications.map((medication) => (
              <Pressable
                key={medication}
                onPress={() =>
                  setTempMedications(tempMedications.filter((m) => m !== medication))
                }
                className="flex-row items-center gap-1 rounded-full bg-blue-100 px-3 py-1"
              >
                <Text className="text-xs font-semibold text-blue-600">{medication}</Text>
                <Text className="text-xs text-blue-600">✕</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* Quick Reference */}
      {tempBloodGroup || tempConditions.length > 0 || tempMedications.length > 0 ? (
        <View className="rounded-2xl border-2 border-purple-200 bg-purple-50 p-4">
          <Text className="text-xs font-semibold uppercase tracking-widest text-purple-600">
            Quick Reference
          </Text>
          {tempBloodGroup && (
            <Text className="mt-2 text-lg font-bold text-purple-900">🩸 {tempBloodGroup}</Text>
          )}
          {tempConditions.length > 0 && (
            <Text className="mt-1 text-xs text-purple-700">
              Conditions: {tempConditions.join(', ')}
            </Text>
          )}
          {tempMedications.length > 0 && (
            <Text className="mt-1 text-xs text-purple-700">
              Medications: {tempMedications.join(', ')}
            </Text>
          )}
        </View>
      ) : null}

      {/* Save Button */}
      <Button label="Save changes" onPress={handleSave} disabled={saving} />
    </ScrollView>
  );
}
