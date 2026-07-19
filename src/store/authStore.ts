/**
 * Auth store — single source of truth for the session.
 *
 * Responsibilities:
 *  - hold user/token/status
 *  - persist token + user to AsyncStorage
 *  - keep the Axios client's in-memory token in sync
 *  - hydrate & validate a persisted session on app startup
 *
 * Uses the in-house `create` (Zustand-compatible). To move to real zustand,
 * change the import below to `import { create } from 'zustand'`.
 */
import { create } from './createStore';
import { setAuthToken } from '../api/client';
import { storage, StorageKeys } from '../services/storage';
import { authService } from '../features/auth/services/authService';
import { getApiErrorMessage } from '../api/client';
import type {
  AuthStatus,
  LoginPayload,
  RegisterPayload,
  User,
} from '../features/auth/types';

type AuthState = {
  user: User | null;
  token: string | null;
  status: AuthStatus;
  /** True until the first hydrate() completes, so we can show a splash. */
  hydrating: boolean;

  hydrate: () => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
};

const persistSession = async (token: string, user: User): Promise<void> => {
  setAuthToken(token);
  await Promise.all([
    storage.setItem(StorageKeys.authToken, token),
    storage.setItem(StorageKeys.authUser, user),
  ]);
};

const clearSession = async (): Promise<void> => {
  setAuthToken(null);
  await Promise.all([
    storage.removeItem(StorageKeys.authToken),
    storage.removeItem(StorageKeys.authUser),
  ]);
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  status: 'idle',
  hydrating: true,

  async hydrate() {
    try {
      const token = await storage.getItem<string>(StorageKeys.authToken);
      if (!token) {
        set({ status: 'unauthenticated', hydrating: false });
        return;
      }
      setAuthToken(token);
      // Validate the token and refresh the user record.
      const user = await authService.me(token);
      await storage.setItem(StorageKeys.authUser, user);
      set({ user, token, status: 'authenticated', hydrating: false });
    } catch {
      // Invalid/expired session — clear it and land on the login screen.
      await clearSession();
      set({ user: null, token: null, status: 'unauthenticated', hydrating: false });
    }
  },

  async login(payload) {
    set({ status: 'loading' });
    try {
      const { token, user } = await authService.login(payload);
      await persistSession(token, user);
      set({ user, token, status: 'authenticated' });
    } catch (error) {
      set({ status: 'unauthenticated' });
      throw new Error(getApiErrorMessage(error, 'Login failed.'));
    }
  },

  async register(payload) {
    set({ status: 'loading' });
    try {
      const { token, user } = await authService.register(payload);
      await persistSession(token, user);
      set({ user, token, status: 'authenticated' });
    } catch (error) {
      set({ status: 'unauthenticated' });
      throw new Error(getApiErrorMessage(error, 'Registration failed.'));
    }
  },

  async logout() {
    await clearSession();
    set({ user: null, token: null, status: 'unauthenticated' });
  },
}));
