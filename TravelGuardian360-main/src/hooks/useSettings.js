import { useApi } from './useApi';
import { profileApi } from '../services/touristService';

export const DEFAULT_SETTINGS = {
  safety_alerts: true, weather_alerts: true, travel_alerts: true, trip_reminders: true,
  share_location_with_admin: true, share_medical_in_sos: true, auto_location_updates: true,
  high_accuracy_location: true, sos_countdown: true, notify_contacts_on_sos: true, temperature_unit: 'c',
};

export function useSettings() {
  const { data, reload, setData, loading, error } = useApi(profileApi.settings);
  return { settings: { ...DEFAULT_SETTINGS, ...(data || {}) }, reload, setSettings: setData, loading, error };
}
