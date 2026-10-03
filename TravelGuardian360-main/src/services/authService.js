import { api, setToken } from './api';
import { getItem, setItem } from './storage';
import { t } from '../i18n';

const KEYS = { user: 'tg360.session.tourist', admin: 'tg360.session.admin' };

export async function restoreSession(role) {
  const token = await getItem(KEYS[role]);
  if (!token) return null;
  setToken(role, token);
  try {
    return await api.get('/auth/me', { role });
  } catch (err) {
    if (err.status === 401 || err.status === 403) {
      await clearSession(role);
      return null;
    }
    // Server unreachable: keep the token so the session resumes when it is back.
    throw err;
  }
}

async function startSession(role, data) {
  if (data.user.role !== role) throw new Error(t('This account cannot sign in here.'));
  setToken(role, data.access_token);
  await setItem(KEYS[role], data.access_token);
  return data.user;
}

export async function login(email, password) {
  return startSession('user', await api.post('/auth/login', { email, password }, { auth: false }));
}

export async function register(form) {
  return startSession('user', await api.post('/auth/register', form, { auth: false }));
}

export async function adminLogin(email, password) {
  return startSession('admin', await api.post('/admin/login', { email, password }, { auth: false, role: 'admin' }));
}

export async function clearSession(role) {
  setToken(role, null);
  await setItem(KEYS[role], null);
}
