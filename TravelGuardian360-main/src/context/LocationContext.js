import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { getCurrentPosition, watchPosition } from '../services/locationService';
import { locationsApi, tripsApi } from '../services/touristService';
import { DEFAULT_CENTER, TRACKING_INTERVAL_MS } from '../utils/constants';

const LocationContext = createContext(null);

/**
 * Single source of truth for "where is the user".
 * source: device (live fix) | last_known (from the server) | trip (destination of the active trip) | default
 */
export function LocationProvider({ children }) {
  const [position, setPosition] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState('');
  const [tracking, setTracking] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [syncError, setSyncError] = useState('');
  const stopWatch = useRef(null);
  const lastSent = useRef(0);
  const labelRef = useRef(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      if (stopWatch.current) stopWatch.current();
    };
  }, []);

  const resolveLabel = useCallback(async (latitude, longitude) => {
    try {
      const { label } = await locationsApi.geocode(latitude, longitude);
      labelRef.current = label;
      if (alive.current) setPosition((p) => (p && p.latitude === latitude ? { ...p, label } : p));
      return label;
    } catch {
      return labelRef.current;
    }
  }, []);

  const applyFix = useCallback(
    (fix, source = 'device') => {
      const next = { ...fix, source, label: labelRef.current, updatedAt: new Date().toISOString() };
      setPosition(next);
      setStatus('ready');
      resolveLabel(fix.latitude, fix.longitude);
      return next;
    },
    [resolveLabel],
  );

  const fallback = useCallback(async () => {
    try {
      const last = await locationsApi.latest();
      if (last) {
        labelRef.current = last.label;
        return applyFix({ latitude: last.latitude, longitude: last.longitude, accuracy: last.accuracy }, 'last_known');
      }
      const trip = await tripsApi.active();
      if (trip && trip.destination_lat != null) {
        return applyFix({ latitude: trip.destination_lat, longitude: trip.destination_lon, accuracy: null }, 'trip');
      }
    } catch {
      // fall through to the default centre
    }
    return applyFix({ ...DEFAULT_CENTER, accuracy: null }, 'default');
  }, [applyFix]);

  const refresh = useCallback(async () => {
    setStatus((s) => (s === 'ready' ? s : 'loading'));
    try {
      const fix = await getCurrentPosition();
      setError('');
      return applyFix(fix, 'device');
    } catch (err) {
      setError(err.message);
      return fallback();
    }
  }, [applyFix, fallback]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const sync = useCallback(async (fix, active) => {
    try {
      await locationsApi.record({
        latitude: fix.latitude,
        longitude: fix.longitude,
        accuracy: fix.accuracy ?? undefined,
        label: labelRef.current || undefined,
        tracking_active: active,
      });
      lastSent.current = Date.now();
      if (alive.current) {
        setLastSync(new Date().toISOString());
        setSyncError('');
      }
    } catch (err) {
      if (alive.current) setSyncError(err.message);
    }
  }, []);

  const startTracking = useCallback(async () => {
    setError('');
    try {
      const first = await getCurrentPosition();
      const pos = applyFix(first, 'device');
      await sync(pos, true);
      stopWatch.current = await watchPosition(
        (fix) => {
          const next = applyFix(fix, 'device');
          if (Date.now() - lastSent.current >= TRACKING_INTERVAL_MS) sync(next, true);
        },
        (err) => setError(err.message),
      );
      setTracking(true);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [applyFix, sync]);

  const stopTracking = useCallback(async () => {
    if (stopWatch.current) stopWatch.current();
    stopWatch.current = null;
    setTracking(false);
    try {
      await locationsApi.stop();
      setLastSync(new Date().toISOString());
    } catch (err) {
      setSyncError(err.message);
    }
  }, []);

  const value = useMemo(
    () => ({ position, status, error, tracking, lastSync, syncError, refresh, startTracking, stopTracking }),
    [position, status, error, tracking, lastSync, syncError, refresh, startTracking, stopTracking],
  );
  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export const useLocation = () => useContext(LocationContext);
