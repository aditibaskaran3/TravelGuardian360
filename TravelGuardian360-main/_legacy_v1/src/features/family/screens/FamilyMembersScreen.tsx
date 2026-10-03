/**
 * Family members screen — manage medical information for all family members.
 *
 * Users can add/edit medical IDs for spouse, children, parents, and other
 * family members. Perfect for travellers who want emergency health info
 * for the entire family in one place.
 */
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useFamilyStore } from '../../../store/familyStore';
import Button from '../../../components/ui/Button';
import { useTranslation } from '../../../i18n/useTranslation';
import type { AppStackParamList } from '../../../navigation/types';
import type { FamilyMember } from '../../medical/types';

type Nav = NativeStackNavigationProp<AppStackParamList>;

const RELATIONSHIPS: FamilyMember['relationship'][] = ['Spouse', 'Child', 'Parent', 'Sibling', 'Other'];

export default function FamilyMembersScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const members = useFamilyStore((s) => s.members);
  const addMember = useFamilyStore((s) => s.addMember);
  const removeMember = useFamilyStore((s) => s.removeMember);
  const hydrate = useFamilyStore((s) => s.hydrate);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState<FamilyMember['relationship']>('Spouse');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const handleAddMember = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a name.');
      return;
    }

    setAdding(true);
    await addMember(name.trim(), relationship);
    setAdding(false);

    setName('');
    setRelationship('Spouse');
    setShowForm(false);
    Alert.alert('Added', `${name} has been added to your family.`);
  };

  const handleDeleteMember = (member: FamilyMember) => {
    Alert.alert('Remove', `Remove ${member.name} from family?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await removeMember(member.id);
        },
      },
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerClassName="p-4 gap-4">
      <View className="rounded-3xl bg-purple-600 p-5">
        <Text className="text-sm font-semibold uppercase tracking-widest text-purple-100">
          {t('family.title')}
        </Text>
        <Text className="mt-1 text-xl font-semibold text-white">{t('family.subtitle')}</Text>
        <Text className="mt-2 text-sm text-purple-100">{t('family.description')}</Text>
      </View>

      {!showForm ? (
        <Button label={t('family.addMember')} onPress={() => setShowForm(true)} />
      ) : (
        <View className="rounded-2xl bg-white p-4">
          <Text className="text-base font-semibold text-slate-900">{t('family.addNew')}</Text>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t('family.memberName')}
            className="mt-3 rounded-xl border border-slate-200 px-3 py-3 text-sm"
          />

          <Text className="mt-3 text-xs font-semibold text-slate-600">{t('family.selectRelationship')}</Text>
          <View className="mt-2 flex-wrap flex-row gap-2">
            {RELATIONSHIPS.map((rel) => (
              <Pressable
                key={rel}
                onPress={() => setRelationship(rel)}
                className={`rounded-full px-3 py-1 ${
                  relationship === rel ? 'bg-purple-600' : 'border border-slate-200 bg-white'
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    relationship === rel ? 'text-white' : 'text-slate-600'
                  }`}
                >
                  {rel}
                </Text>
              </Pressable>
            ))}
          </View>

          <View className="mt-4 flex-row gap-2">
            <Pressable
              onPress={() => setShowForm(false)}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 active:opacity-70"
            >
              <Text className="text-center text-xs font-semibold text-slate-600">Cancel</Text>
            </Pressable>
            <Button
              label={adding ? 'Adding...' : t('family.addMember')}
              onPress={handleAddMember}
              disabled={adding}
            />
          </View>
        </View>
      )}

      {members.length === 0 ? (
        <Text className="px-2 text-center text-sm text-slate-400">
          {t('family.noMembers')}
        </Text>
      ) : (
        <View className="gap-3">
          {members.map((member) => (
            <Pressable
              key={member.id}
              onPress={() => navigation.navigate('FamilyMemberMedical', { memberId: member.id })}
              className="rounded-2xl border border-slate-100 bg-white p-4 active:opacity-70"
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-2">
                  <Text className="text-base font-semibold text-slate-900">{member.name}</Text>
                  <Text className="text-sm text-slate-500">{member.relationship}</Text>

                  {member.bloodGroup && (
                    <Text className="mt-2 text-sm font-bold text-red-600">🩸 {member.bloodGroup}</Text>
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

                  <Text className="mt-2 text-xs font-semibold text-purple-600">Tap to edit →</Text>
                </View>

                <Pressable
                  onPress={(e) => {
                    e.stopPropagation?.();
                    handleDeleteMember(member);
                  }}
                  className="rounded-full bg-red-50 px-3 py-1.5 active:opacity-70"
                >
                  <Text className="text-xs font-semibold text-red-600">Remove</Text>
                </Pressable>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
