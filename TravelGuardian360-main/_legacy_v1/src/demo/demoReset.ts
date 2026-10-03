/**
 * Demo Reset Utility
 *
 * Wipes all persisted state and re-seeds the Jane demo account so the demo
 * can be recorded multiple times with identical, predictable results.
 *
 * Usage:
 *   import { resetDemo } from '../demo/demoReset';
 *   await resetDemo();
 *
 * This is safe to call at any time (the app re-routes to login automatically).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_PREFIX, DEMO_TRAVELLER } from '../config/env';
import { storage, StorageKeys } from '../services/storage';
import {
  DEMO_CONTACTS,
  DEMO_FAMILY_MEMBERS,
  DEMO_ITINERARIES,
  DEMO_MEDICAL_ID,
  DEMO_TRAVEL_DOCUMENTS,
  DEMO_USER,
} from './demoData';

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/** Generates a demo-stable mock token for the Jane account. */
const buildDemoToken = (): string =>
  `mocktoken.${DEMO_USER.id}.${Date.now() + TOKEN_TTL_MS}`;

type MockUserRecord = typeof DEMO_USER & { password: string };

/**
 * Full demo reset:
 *  1. Clear ALL @tg360/* AsyncStorage keys (state, token, users, contacts, medical…)
 *  2. Re-seed the Jane demo user record in the mock users DB
 *  3. Pre-populate contacts and medical ID with demo data
 *  4. Pre-populate family members, travel documents, itineraries
 *  5. Sign in as Jane automatically
 */
export async function resetDemo(): Promise<void> {
  // 1. Clear all namespaced keys
  const allKeys = await AsyncStorage.getAllKeys();
  const tg360Keys = allKeys.filter((k) => k.startsWith(STORAGE_PREFIX));
  if (tg360Keys.length > 0) {
    await AsyncStorage.multiRemove(tg360Keys);
  }

  // 2. Seed the Jane mock user record (the mock auth service reads this DB)
  const userRecord: MockUserRecord = {
    ...DEMO_USER,
    password: DEMO_TRAVELLER.password,
  };
  await storage.setItem(StorageKeys.mockUsers, [userRecord]);

  // 3. Issue a token and persist the session so the app starts authenticated
  const token = buildDemoToken();
  await storage.setItem(StorageKeys.authToken, token);
  await storage.setItem(StorageKeys.authUser, DEMO_USER);

  // 4. Pre-populate contacts with demo data
  await storage.setItem(StorageKeys.emergencyContacts, DEMO_CONTACTS);

  // 5. Pre-populate medical ID with demo data
  await storage.setItem(StorageKeys.medicalID, DEMO_MEDICAL_ID);

  // 6. Pre-populate family members with demo data
  await storage.setItem(StorageKeys.familyMembers, DEMO_FAMILY_MEMBERS);

  // 7. Pre-populate travel documents with demo data
  await storage.setItem(StorageKeys.travelDocuments, DEMO_TRAVEL_DOCUMENTS);

  // 8. Pre-populate itineraries with demo data
  await storage.setItem(StorageKeys.itineraries, DEMO_ITINERARIES);

  // (Trip state, location history, SOS history, notifications are intentionally
  //  left blank so the demo starts from a clean "before trip" state.)
}
