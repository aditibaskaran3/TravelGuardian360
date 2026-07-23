/**
 * Itinerary service — CRUD operations for travel itineraries.
 * Persisted locally via AsyncStorage.
 */
import { storage, StorageKeys } from '../../../services/storage';
import type { Itinerary } from '../types';

export async function getItineraries(): Promise<Itinerary[]> {
  const items = await storage.getItem<Itinerary[]>(StorageKeys.itineraries);
  return items ?? [];
}

export async function saveItinerary(input: Omit<Itinerary, 'id' | 'createdAt'>): Promise<Itinerary> {
  const existing = await getItineraries();
  const itinerary: Itinerary = {
    id: `${Date.now()}`,
    destination: input.destination.trim(),
    startDate: input.startDate,
    endDate: input.endDate,
    emergencyContactIds: input.emergencyContactIds,
    createdAt: new Date().toISOString(),
    notes: input.notes?.trim(),
  };

  const next = [itinerary, ...existing];
  await storage.setItem(StorageKeys.itineraries, next);
  return itinerary;
}

export async function deleteItinerary(id: string): Promise<void> {
  const existing = await getItineraries();
  const next = existing.filter((item) => item.id !== id);
  await storage.setItem(StorageKeys.itineraries, next);
}

export function buildItineraryShare(itinerary: Itinerary): string {
  const start = new Date(itinerary.startDate).toLocaleDateString();
  const end = new Date(itinerary.endDate).toLocaleDateString();
  return `Trip to ${itinerary.destination}\n${start} - ${end}\n\nShared via TravelGuardian360`;
}
