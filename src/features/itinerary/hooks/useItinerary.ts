/**
 * Hook for managing travel itineraries.
 */
import { useEffect, useState } from 'react';
import { getItineraries, saveItinerary, deleteItinerary } from '../services/itineraryService';
import type { Itinerary } from '../types';

export function useItinerary() {
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(false);

  const loadItineraries = async () => {
    setLoading(true);
    const items = await getItineraries();
    setItineraries(items);
    setLoading(false);
  };

  const addItinerary = async (input: Omit<Itinerary, 'id' | 'createdAt'>) => {
    setLoading(true);
    const item = await saveItinerary(input);
    setItineraries((prev) => [item, ...prev]);
    setLoading(false);
    return item;
  };

  const removeItinerary = async (id: string) => {
    setLoading(true);
    await deleteItinerary(id);
    setItineraries((prev) => prev.filter((item) => item.id !== id));
    setLoading(false);
  };

  useEffect(() => {
    void loadItineraries();
  }, []);

  return {
    itineraries,
    loading,
    addItinerary,
    removeItinerary,
    reload: loadItineraries,
  };
}
