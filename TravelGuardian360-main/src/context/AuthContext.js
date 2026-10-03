import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { onUnauthorized } from '../services/api';
import * as auth from '../services/authService';

const AuthContext = createContext(null);

/** Holds one session. The tourist app and the admin console each mount their own provider. */
export function AuthProvider({ role, children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);
  const [bootError, setBootError] = useState('');

  const logout = useCallback(async () => {
    await auth.clearSession(role);
    setUser(null);
  }, [role]);

  const boot = useCallback(async () => {
    setBooting(true);
    setBootError('');
    try {
      setUser(await auth.restoreSession(role));
    } catch (err) {
      setBootError(err.message);
    } finally {
      setBooting(false);
    }
  }, [role]);

  useEffect(() => {
    onUnauthorized(role, () => setUser(null));
    boot();
    return () => onUnauthorized(role, null);
  }, [role, boot]);

  const value = useMemo(
    () => ({
      user,
      booting,
      bootError,
      retry: boot,
      logout,
      setUser,
      login: async (email, password) => {
        const next = role === 'admin' ? await auth.adminLogin(email, password) : await auth.login(email, password);
        setUser(next);
      },
      register: async (form) => setUser(await auth.register(form)),
    }),
    [user, booting, bootError, boot, logout, role],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
