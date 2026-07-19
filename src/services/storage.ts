/**
 * Typed, namespaced wrapper around AsyncStorage.
 *
 * Keeps all persistence in one place with JSON (de)serialization and a shared
 * key prefix, so no feature has to know about raw AsyncStorage keys.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_PREFIX } from '../config/env';

const key = (name: string) => `${STORAGE_PREFIX}/${name}`;

export const storage = {
  async getItem<T>(name: string): Promise<T | null> {
    const raw = await AsyncStorage.getItem(key(name));
    if (raw == null) {
      return null;
    }
    try {
      return JSON.parse(raw) as T;
    } catch {
      // Value was stored as a plain string.
      return raw as unknown as T;
    }
  },

  async setItem<T>(name: string, value: T): Promise<void> {
    const raw = typeof value === 'string' ? value : JSON.stringify(value);
    await AsyncStorage.setItem(key(name), raw);
  },

  async removeItem(name: string): Promise<void> {
    await AsyncStorage.removeItem(key(name));
  },
};

// Well-known storage keys used across the app.
export const StorageKeys = {
  authToken: 'auth/token',
  authUser: 'auth/user',
  // Mock-only: the local "users database" the mock auth service reads/writes.
  mockUsers: 'auth/mock_users',
} as const;
