import { t } from '../i18n';
const MONTHS = [t('Jan'), t('Feb'), t('Mar'), t('Apr'), t('May'), t('Jun'), t('Jul'), t('Aug'), t('Sep'), t('Oct'), t('Nov'), t('Dec')].map((m) => t(m));

// The API sends UTC timestamps; some arrive without a zone suffix.
export function parseTimestamp(value) {
  if (!value) return new Date(NaN);
  if (value.length === 10) return new Date(`${value}T00:00:00`);
  return new Date(/(Z|[+-]\d{2}:?\d{2})$/.test(value) ? value : `${value}Z`);
}

export function formatDate(value) {
  if (!value) return '—';
  const d = parseTimestamp(value);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateTime(value) {
  if (!value) return '—';
  const d = parseTimestamp(value);
  if (Number.isNaN(d.getTime())) return '—';
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${h % 12 || 12}:${m} ${h >= 12 ? t('PM') : t('AM')}`;
}

export function timeAgo(value) {
  if (!value) return '—';
  const seconds = Math.max(0, Math.round((Date.now() - parseTimestamp(value).getTime()) / 1000));
  if (seconds < 45) return t('just now');
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return t('{n} min ago', { n: minutes });
  const hours = Math.round(minutes / 60);
  if (hours < 24) return t('{n} hr ago', { n: hours });
  const days = Math.round(hours / 24);
  return t(days === 1 ? '1 day ago' : '{n} days ago', { n: days });
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return t('Good Morning');
  if (h < 17) return t('Good Afternoon');
  return t('Good Evening');
}

export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const addDaysISO = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const initials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');

export const firstName = (name = '') => name.split(' ')[0] || '';

export const coords = (lat, lon) =>
  lat == null || lon == null ? '—' : `${Number(lat).toFixed(5)}, ${Number(lon).toFixed(5)}`;

export function distanceLabel(meters) {
  if (meters == null) return '';
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;
}
