/**
 * Mock auth service — a fully working, on-device stand-in for the FastAPI
 * backend. It persists a local "users database" in AsyncStorage, validates
 * credentials, issues a JWT-shaped token, and supports session restore.
 *
 * This lets the whole auth flow work on a real device today. When the backend
 * lands, set USE_MOCK_API=false and this file is simply never used.
 */
import { storage, StorageKeys } from '../../../services/storage';
import type { AuthResponse, LoginPayload, RegisterPayload, User } from '../types';
import type { AuthService } from './authService';

/** Persisted mock user record (includes the password — MOCK ONLY). */
type MockUserRecord = User & { password: string };

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const NETWORK_DELAY_MS = 600; // simulate latency so loading states are visible

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(() => resolve(), ms));

const randomId = (): string =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

/** Generates a human-facing Digital Tourist ID like "TG-8F3K2A". */
const generateTouristId = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 6; i += 1) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `TG-${suffix}`;
};

/** Token shape: "mocktoken.<userId>.<expiryMs>" (opaque, but parseable by me()). */
const issueToken = (userId: string): string =>
  `mocktoken.${userId}.${Date.now() + TOKEN_TTL_MS}`;

const parseToken = (token: string): { userId: string; exp: number } | null => {
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== 'mocktoken') {
    return null;
  }
  const exp = Number(parts[2]);
  if (!Number.isFinite(exp)) {
    return null;
  }
  return { userId: parts[1], exp };
};

const loadUsers = async (): Promise<MockUserRecord[]> =>
  (await storage.getItem<MockUserRecord[]>(StorageKeys.mockUsers)) ?? [];

const saveUsers = (users: MockUserRecord[]): Promise<void> =>
  storage.setItem(StorageKeys.mockUsers, users);

const toPublicUser = (record: MockUserRecord): User => {
  const { password, ...user } = record;
  return user;
};

export const mockAuthService: AuthService = {
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    await delay(NETWORK_DELAY_MS);
    const users = await loadUsers();

    const email = payload.email.trim().toLowerCase();
    if (users.some((u) => u.email === email)) {
      throw new Error('An account with this email already exists.');
    }

    const record: MockUserRecord = {
      id: randomId(),
      touristId: generateTouristId(),
      fullName: payload.fullName.trim(),
      email,
      phone: payload.phone.trim(),
      nationality: payload.nationality.trim(),
      emergencyContact: {
        name: payload.emergencyContactName.trim(),
        phone: payload.emergencyContactPhone.trim(),
      },
      createdAt: new Date().toISOString(),
      password: payload.password,
    };

    await saveUsers([...users, record]);
    return { token: issueToken(record.id), user: toPublicUser(record) };
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    await delay(NETWORK_DELAY_MS);
    const users = await loadUsers();
    const email = payload.email.trim().toLowerCase();

    const record = users.find((u) => u.email === email);
    if (!record || record.password !== payload.password) {
      throw new Error('Invalid email or password.');
    }

    return { token: issueToken(record.id), user: toPublicUser(record) };
  },

  async me(token: string): Promise<User> {
    const parsed = parseToken(token);
    if (!parsed) {
      throw new Error('Invalid session token.');
    }
    if (parsed.exp < Date.now()) {
      throw new Error('Session expired.');
    }
    const users = await loadUsers();
    const record = users.find((u) => u.id === parsed.userId);
    if (!record) {
      throw new Error('Account no longer exists.');
    }
    return toPublicUser(record);
  },
};
