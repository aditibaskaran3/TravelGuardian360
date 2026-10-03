import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { t } from '../i18n';

/**
 * Loads data from an API function, and reloads whenever the screen regains focus so changes made
 * elsewhere (another tab, the admin console) show up without a manual refresh.
 */
export function useApi(fn, deps = [], { enabled = true, refreshOnFocus = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState('');
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const alive = useRef(true);
  const seq = useRef(0);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!enabled) return null;
    const mine = ++seq.current;
    if (!silent) setLoading(true);
    try {
      const result = await fnRef.current();
      if (alive.current && mine === seq.current) {
        setData(result);
        setError('');
      }
      return result;
    } catch (err) {
      if (alive.current && mine === seq.current) setError(err.message || t('Something went wrong.'));
      return null;
    } finally {
      if (alive.current && mine === seq.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  useEffect(() => {
    load();
  }, [load]);

  const first = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (first.current) {
        first.current = false;
        return undefined;
      }
      if (refreshOnFocus) load({ silent: true });
      return undefined;
    }, [load, refreshOnFocus]),
  );

  return { data, loading, error, reload: load, setData };
}
