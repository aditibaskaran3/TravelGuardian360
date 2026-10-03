import { t } from '../i18n';
const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const PHONE_RE = /^\+?[0-9][0-9 ()-]{5,18}[0-9]$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const required = (value, label) => (String(value ?? '').trim() ? '' : t('{label} is required.', { label }));

export function validateEmail(value) {
  if (!String(value ?? '').trim()) return t('Email is required.');
  return EMAIL_RE.test(value.trim()) ? '' : t('Enter a valid email address.');
}

export function validatePhone(value) {
  if (!String(value ?? '').trim()) return t('Phone number is required.');
  return PHONE_RE.test(value.trim()) ? '' : t('Enter a valid phone number, for example +91 98765 43210.');
}

export function validatePassword(value) {
  if (!value) return t('Password is required.');
  if (value.length < 8) return t('Password must be at least 8 characters.');
  if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) return t('Use both letters and numbers.');
  return '';
}

export function validateName(value) {
  const v = String(value ?? '').trim();
  if (!v) return t('Full name is required.');
  return v.length < 2 ? t('Enter your full name.') : '';
}

export function isValidDate(value) {
  if (!DATE_RE.test(value || '')) return false;
  const [y, m, day] = value.split('-').map(Number);
  const d = new Date(y, m - 1, day);
  return d.getFullYear() === y && d.getMonth() === m - 1 && d.getDate() === day;
}

export function validateDate(value, label) {
  if (!String(value ?? '').trim()) return t('{label} is required.', { label });
  return isValidDate(value) ? '' : t('{label} must be a valid date (YYYY-MM-DD).', { label });
}

export function validateTrip({ destination, start_date, end_date }) {
  const errors = {};
  if (String(destination ?? '').trim().length < 2) errors.destination = t('Enter a destination.');
  const s = validateDate(start_date, t('Start date'));
  const e = validateDate(end_date, t('End date'));
  if (s) errors.start_date = s;
  if (e) errors.end_date = e;
  if (!s && !e && end_date < start_date) errors.end_date = t('End date cannot be before the start date.');
  return errors;
}

export function validateCoordinates(lat, lon) {
  const la = Number(lat);
  const lo = Number(lon);
  if (Number.isNaN(la) || la < -90 || la > 90) return t('Latitude must be between -90 and 90.');
  if (Number.isNaN(lo) || lo < -180 || lo > 180) return t('Longitude must be between -180 and 180.');
  return '';
}

export const hasErrors = (errors) => Object.values(errors).some(Boolean);
