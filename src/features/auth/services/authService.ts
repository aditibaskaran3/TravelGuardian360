/**
 * Auth service abstraction.
 *
 * Screens/store depend ONLY on this interface, never on axios or the mock
 * directly. Swapping the mock for the real FastAPI implementation is a
 * one-line change (USE_MOCK_API in config/env.ts) with zero UI impact.
 */
import { USE_MOCK_API } from '../../../config/env';
import type { AuthResponse, LoginPayload, RegisterPayload, User } from '../types';
import { mockAuthService } from './mockAuthService';
import { realAuthService } from './realAuthService';

export type AuthService = {
  register(payload: RegisterPayload): Promise<AuthResponse>;
  login(payload: LoginPayload): Promise<AuthResponse>;
  /** Returns the current user for a token (used to validate a persisted session). */
  me(token: string): Promise<User>;
};

export const authService: AuthService = USE_MOCK_API ? mockAuthService : realAuthService;
