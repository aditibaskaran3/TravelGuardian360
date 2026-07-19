/**
 * Shared Axios instance.
 *
 * - Attaches the JWT (when present) to every request via an interceptor.
 * - Normalizes error messages so the UI shows something meaningful.
 *
 * The token is held in-memory and kept in sync by the auth store. This avoids
 * an async AsyncStorage read on every request while still surviving reloads
 * (the store hydrates the token on startup and calls setAuthToken()).
 */
import axios, { AxiosError } from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '../config/env';

let authToken: string | null = null;

/** Called by the auth store whenever the token changes (login/logout/hydrate). */
export const setAuthToken = (token: string | null): void => {
  authToken = token;
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

/** Extracts a user-friendly message from an Axios error. */
export const getApiErrorMessage = (error: unknown, fallback = 'Something went wrong.'): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ detail?: string; message?: string }>;
    if (axiosError.response?.data) {
      return axiosError.response.data.detail || axiosError.response.data.message || fallback;
    }
    if (axiosError.code === 'ECONNABORTED') {
      return 'Request timed out. Check your connection and try again.';
    }
    if (axiosError.message === 'Network Error') {
      return 'Cannot reach the server. Check your connection.';
    }
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};
