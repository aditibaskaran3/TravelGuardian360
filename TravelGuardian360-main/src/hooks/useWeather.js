import { useCallback, useState } from 'react';

import { useApi } from './useApi';
import { getWeather } from '../services/weatherService';

/** Weather for a position (or a trip destination). Exposes a forced refresh. */
export function useWeather(position, name) {
  const [refreshing, setRefreshing] = useState(false);
  const lat = position ? position.latitude : null;
  const lon = position ? position.longitude : null;
  const query = useApi(
    () => getWeather({ latitude: lat, longitude: lon, name }),
    [lat == null ? null : lat.toFixed(2), lon == null ? null : lon.toFixed(2), name],
    { enabled: lat != null },
  );
  const refresh = useCallback(async () => {
    if (lat == null) return;
    setRefreshing(true);
    try {
      query.setData(await getWeather({ latitude: lat, longitude: lon, name, refresh: true }));
    } catch {
      await query.reload({ silent: true });
    } finally {
      setRefreshing(false);
    }
  }, [lat, lon, name, query]);
  return { weather: query.data, loading: query.loading || refreshing, error: query.error, refresh, reload: query.reload };
}
