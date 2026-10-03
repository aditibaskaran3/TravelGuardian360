import { api } from './api';

export function getWeather({ latitude, longitude, name, refresh }) {
  return api.get('/weather', { params: { lat: latitude, lon: longitude, name, refresh: refresh ? 'true' : undefined } });
}
