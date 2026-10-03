/**
 * Real auth service — talks to the FastAPI backend over Axios.
 *
 * Endpoints follow the planned contract:
 *   POST /auth/register -> { token, user }
 *   POST /auth/login    -> { token, user }
 *   GET  /auth/me       -> user   (Authorization: Bearer <token>)
 *
 * This is complete and ready; it becomes active when USE_MOCK_API is false.
 */
import { apiClient } from '../../../api/client';
import type { AuthResponse, LoginPayload, RegisterPayload, User } from '../types';
import type { AuthService } from './authService';

export const realAuthService: AuthService = {
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>('/auth/register', payload);
    return data;
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
    return data;
  },

  async me(token: string): Promise<User> {
    const { data } = await apiClient.get<User>('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },
};
