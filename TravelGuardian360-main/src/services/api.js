import { Platform } from 'react-native';
import { language, t } from '../i18n';

// The backend address comes from VITE_API_URL (web build) or is derived from the page host.
const configured = typeof __API_URL__ !== 'undefined' ? __API_URL__ : '';

function resolveBaseUrl() {
  if (configured) return configured.replace(/\/$/, '');
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:8000`;
  }
  return Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';
}

export const API_URL = resolveBaseUrl();
const TIMEOUT_MS = 15000;

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.status = status;
  }
}

const tokens = { user: null, admin: null };
const unauthorizedHandlers = { user: null, admin: null };

export const setToken = (role, token) => {
  tokens[role] = token;
};
export const onUnauthorized = (role, handler) => {
  unauthorizedHandlers[role] = handler;
};

function query(params) {
  const entries = Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== null && v !== '');
  return entries.length ? `?${entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')}` : '';
}

async function request(method, path, { body, params, role = 'user', auth = true } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const headers = { Accept: 'application/json', 'X-Lang': language };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth && tokens[role]) headers.Authorization = `Bearer ${tokens[role]}`;

  let response;
  try {
    response = await fetch(`${API_URL}${path}${query(params)}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    throw new ApiError(
      err.name === 'AbortError'
        ? t('The server took too long to respond. Please try again.')
        : t('Cannot reach the TravelGuardian360 server. Check your connection and try again.'),
    );
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 204) return null;
  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    if (response.status === 401 && auth && tokens[role] && unauthorizedHandlers[role]) unauthorizedHandlers[role]();
    const detail = data && data.detail;
    const message = typeof detail === 'string' ? detail : t('Something went wrong. Please try again.');
    throw new ApiError(message, response.status);
  }
  return data;
}

export const api = {
  get: (path, options) => request('GET', path, options),
  post: (path, body, options) => request('POST', path, { ...options, body: body ?? {} }),
  put: (path, body, options) => request('PUT', path, { ...options, body: body ?? {} }),
  del: (path, options) => request('DELETE', path, options),
};
