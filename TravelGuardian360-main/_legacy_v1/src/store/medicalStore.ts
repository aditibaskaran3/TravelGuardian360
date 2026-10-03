/**
 * Medical ID store — manages emergency medical information.
 * Persisted to AsyncStorage.
 *
 * In DEMO_MODE the backend call is skipped entirely. Demo data is seeded
 * by demoReset.ts on first launch so MedicalIDScreen always shows Jane's
 * pre-filled health information.
 */
import { create } from './createStore';
import { storage, StorageKeys } from '../services/storage';
import { DEMO_MODE } from '../config/env';
import { DEMO_MEDICAL_ID } from '../demo/demoData';
import { apiClient, getApiErrorMessage } from '../api/client';
import type { MedicalID, BloodGroup } from '../features/medical/types';
import { useAuthStore } from './authStore';

const DEFAULT_MEDICAL_ID: MedicalID = {
  bloodGroup: null,
  allergies: [],
  medicalConditions: [],
  medications: [],
  updatedAt: new Date().toISOString(),
};

type MedicalState = {
  data: MedicalID;
  loaded: boolean;

  hydrate: () => Promise<void>;
  setBloodGroup: (group: BloodGroup | null) => Promise<void>;
  addAllergy: (allergy: string) => Promise<void>;
  removeAllergy: (allergy: string) => Promise<void>;
  addCondition: (condition: string) => Promise<void>;
  removeCondition: (condition: string) => Promise<void>;
  addMedication: (medication: string) => Promise<void>;
  removeMedication: (medication: string) => Promise<void>;
  save: () => Promise<void>;
};

const persistData = async (data: MedicalID): Promise<void> => {
  await storage.setItem(StorageKeys.medicalID, {
    ...data,
    updatedAt: new Date().toISOString(),
  });
};

export const useMedicalStore = create<MedicalState>((set, get) => ({
  data: DEFAULT_MEDICAL_ID,
  loaded: false,

  async hydrate() {
    // In demo mode, skip the backend entirely.
    if (!DEMO_MODE) {
      const token = useAuthStore.getState().token;
      if (token) {
        try {
          const { data } = await apiClient.get('/medical');
          if (data) {
            const medicalData: MedicalID = {
              bloodGroup: data.bloodGroup ?? null,
              allergies: Array.isArray(data.allergies) ? data.allergies : [],
              medicalConditions: Array.isArray(data.medicalConditions) ? data.medicalConditions : [],
              medications: Array.isArray(data.medications) ? data.medications : [],
              updatedAt: data.updatedAt || new Date().toISOString(),
            };
            set({ data: medicalData, loaded: true });
            await storage.setItem(StorageKeys.medicalID, medicalData);
            return;
          }
        } catch (error) {
          console.warn(getApiErrorMessage(error, 'Unable to load medical ID from server.'));
        }
      }
    }

    // Load from local storage (demo data was pre-seeded by demoReset).
    const stored = await storage.getItem<MedicalID>(StorageKeys.medicalID);

    if (!stored && DEMO_MODE) {
      // First launch without a reset — seed demo medical data automatically.
      await storage.setItem(StorageKeys.medicalID, DEMO_MEDICAL_ID);
      set({ data: DEMO_MEDICAL_ID, loaded: true });
      return;
    }

    set({ data: stored || DEFAULT_MEDICAL_ID, loaded: true });
  },

  async setBloodGroup(group) {
    const data = { ...get().data, bloodGroup: group };
    set({ data });
  },

  async addAllergy(allergy) {
    const data = {
      ...get().data,
      allergies: [...get().data.allergies, allergy],
    };
    set({ data });
  },

  async removeAllergy(allergy) {
    const data = {
      ...get().data,
      allergies: get().data.allergies.filter((a) => a !== allergy),
    };
    set({ data });
  },

  async addCondition(condition) {
    const data = {
      ...get().data,
      medicalConditions: [...get().data.medicalConditions, condition],
    };
    set({ data });
  },

  async removeCondition(condition) {
    const data = {
      ...get().data,
      medicalConditions: get().data.medicalConditions.filter((c) => c !== condition),
    };
    set({ data });
  },

  async addMedication(medication) {
    const data = {
      ...get().data,
      medications: [...get().data.medications, medication],
    };
    set({ data });
  },

  async removeMedication(medication) {
    const data = {
      ...get().data,
      medications: get().data.medications.filter((m) => m !== medication),
    };
    set({ data });
  },

  async save() {
    const data = get().data;
    await persistData(data);

    if (DEMO_MODE) {
      // In demo mode, local save is sufficient.
      return;
    }

    const token = useAuthStore.getState().token;
    if (!token) {
      return;
    }

    try {
      const { data: serverData } = await apiClient.post('/medical', {
        bloodGroup: data.bloodGroup,
        allergies: data.allergies,
        medicalConditions: data.medicalConditions,
        medications: data.medications,
      });

      set({
        data: {
          bloodGroup: serverData.bloodGroup ?? null,
          allergies: Array.isArray(serverData.allergies) ? serverData.allergies : [],
          medicalConditions: Array.isArray(serverData.medicalConditions) ? serverData.medicalConditions : [],
          medications: Array.isArray(serverData.medications) ? serverData.medications : [],
          updatedAt: serverData.updatedAt || new Date().toISOString(),
        },
      });
    } catch (error) {
      console.warn(getApiErrorMessage(error, 'Unable to save medical ID to server.'));
    }
  },
}));
