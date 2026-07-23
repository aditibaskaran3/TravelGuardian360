/**
 * Family members store — manages medical IDs for family members.
 * Each member has their own medical profile (blood group, allergies, etc.).
 */
import { create } from './createStore';
import { storage, StorageKeys } from '../services/storage';
import type { FamilyMember, BloodGroup } from '../features/medical/types';

type FamilyState = {
  members: FamilyMember[];
  loaded: boolean;

  hydrate: () => Promise<void>;
  addMember: (name: string, relationship: FamilyMember['relationship']) => Promise<FamilyMember>;
  updateMember: (id: string, updates: Partial<Omit<FamilyMember, 'id' | 'createdAt'>>) => Promise<void>;
  removeMember: (id: string) => Promise<void>;
  setBloodGroup: (id: string, group: BloodGroup | null) => Promise<void>;
  addAllergy: (id: string, allergy: string) => Promise<void>;
  removeAllergy: (id: string, allergy: string) => Promise<void>;
  addCondition: (id: string, condition: string) => Promise<void>;
  removeCondition: (id: string, condition: string) => Promise<void>;
  addMedication: (id: string, medication: string) => Promise<void>;
  removeMedication: (id: string, medication: string) => Promise<void>;
};

const generateId = (): string =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

const persistMembers = async (members: FamilyMember[]): Promise<void> => {
  await storage.setItem(StorageKeys.familyMembers, members);
};

export const useFamilyStore = create<FamilyState>((set, get) => ({
  members: [],
  loaded: false,

  async hydrate() {
    const members = await storage.getItem<FamilyMember[]>(StorageKeys.familyMembers);
    set({ members: members || [], loaded: true });
  },

  async addMember(name, relationship) {
    const member: FamilyMember = {
      id: generateId(),
      name: name.trim(),
      relationship,
      bloodGroup: null,
      allergies: [],
      medicalConditions: [],
      medications: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const members = [...get().members, member];
    await persistMembers(members);
    set({ members });
    return member;
  },

  async updateMember(id, updates) {
    const members = get().members.map((m) =>
      m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m,
    );
    await persistMembers(members);
    set({ members });
  },

  async removeMember(id) {
    const members = get().members.filter((m) => m.id !== id);
    await persistMembers(members);
    set({ members });
  },

  async setBloodGroup(id, group) {
    await get().updateMember(id, { bloodGroup: group });
  },

  async addAllergy(id, allergy) {
    const member = get().members.find((m) => m.id === id);
    if (!member || member.allergies.includes(allergy)) return;
    await get().updateMember(id, { allergies: [...member.allergies, allergy] });
  },

  async removeAllergy(id, allergy) {
    const member = get().members.find((m) => m.id === id);
    if (!member) return;
    await get().updateMember(id, { allergies: member.allergies.filter((a) => a !== allergy) });
  },

  async addCondition(id, condition) {
    const member = get().members.find((m) => m.id === id);
    if (!member || member.medicalConditions.includes(condition)) return;
    await get().updateMember(id, { medicalConditions: [...member.medicalConditions, condition] });
  },

  async removeCondition(id, condition) {
    const member = get().members.find((m) => m.id === id);
    if (!member) return;
    await get().updateMember(id, {
      medicalConditions: member.medicalConditions.filter((c) => c !== condition),
    });
  },

  async addMedication(id, medication) {
    const member = get().members.find((m) => m.id === id);
    if (!member || member.medications.includes(medication)) return;
    await get().updateMember(id, { medications: [...member.medications, medication] });
  },

  async removeMedication(id, medication) {
    const member = get().members.find((m) => m.id === id);
    if (!member) return;
    await get().updateMember(id, {
      medications: member.medications.filter((m) => m !== medication),
    });
  },
}));
