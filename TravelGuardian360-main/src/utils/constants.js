import { t } from '../i18n';
const STORAGE_KEY = 'tg360.theme';

function readMode() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    }
  } catch {
    // storage unavailable: use the default
  }
  return 'dark';
}

export const themeMode = readMode();

/** The palette is read once at start-up, so switching the theme saves the choice and reloads the page (web). */
export function setThemeMode(mode) {
  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
    window.location.reload();
  } catch {
    // not available on this platform
  }
}

const dark = {
  bg: '#0A1020', bgDeep: '#070B16', card: '#111A2E', cardAlt: '#16223A', border: '#1F2C47', borderStrong: '#2A3A5C',
  text: '#E8EEF8', textSoft: '#B4C0D8', muted: '#7F8FAE', accent: '#4C8DFF', accentSoft: 'rgba(76,141,255,0.14)',
  safe: '#2FCB8A', safeSoft: 'rgba(47,203,138,0.14)', caution: '#F5A524', cautionSoft: 'rgba(245,165,36,0.14)',
  danger: '#F4476B', dangerSoft: 'rgba(244,71,107,0.14)', info: '#4C8DFF', white: '#FFFFFF',
  mapBg: '#0D1424', tabBar: 'rgba(14,21,38,0.97)', idCard: '#13203A', overlay: 'rgba(3,6,14,0.72)',
  track: 'rgba(255,255,255,0.1)', trackLine: 'rgba(255,255,255,0.08)', dangerTint: '#1D1426', sosActive: '#FF5C7F',
};

const light = {
  bg: '#F3F6FB', bgDeep: '#E8EDF5', card: '#FFFFFF', cardAlt: '#EEF2F8', border: '#DCE3EE', borderStrong: '#C6D0E0',
  text: '#0F1A30', textSoft: '#34435F', muted: '#66738F', accent: '#2563EB', accentSoft: 'rgba(37,99,235,0.10)',
  safe: '#14A06A', safeSoft: 'rgba(20,160,106,0.12)', caution: '#C77A05', cautionSoft: 'rgba(199,122,5,0.13)',
  danger: '#DC2A52', dangerSoft: 'rgba(220,42,82,0.10)', info: '#2563EB', white: '#FFFFFF',
  mapBg: '#E3E9F2', tabBar: 'rgba(255,255,255,0.97)', idCard: '#EAF1FF', overlay: 'rgba(15,26,48,0.45)',
  track: 'rgba(15,26,48,0.10)', trackLine: 'rgba(15,26,48,0.10)', dangerTint: '#FFF1F4', sosActive: '#F0446B',
};

export const colors = themeMode === 'light' ? light : dark;
export const isLight = themeMode === 'light';

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 };
export const radius = { sm: 8, md: 12, lg: 16, xl: 22, pill: 999 };

export const font = {
  regular: { fontWeight: '400' },
  medium: { fontWeight: '500' },
  semibold: { fontWeight: '600' },
  bold: { fontWeight: '700' },
  heavy: { fontWeight: '800' },
};

export const ZONE_META = {
  safe: { label: t('Safe'), color: colors.safe, soft: colors.safeSoft },
  caution: { label: t('Caution'), color: colors.caution, soft: colors.cautionSoft },
  high_risk: { label: t('High Risk'), color: colors.danger, soft: colors.dangerSoft },
};

export const STATUS_META = {
  active: { label: t('Active'), color: colors.danger, soft: colors.dangerSoft },
  acknowledged: { label: t('Acknowledged'), color: colors.caution, soft: colors.cautionSoft },
  resolved: { label: t('Resolved'), color: colors.safe, soft: colors.safeSoft },
  upcoming: { label: t('Upcoming'), color: colors.accent, soft: colors.accentSoft },
  completed: { label: t('Completed'), color: colors.muted, soft: colors.cardAlt },
  verified: { label: t('Verified'), color: colors.safe, soft: colors.safeSoft },
  pending: { label: t('Pending Verification'), color: colors.caution, soft: colors.cautionSoft },
  live: { label: t('Live'), color: colors.safe, soft: colors.safeSoft },
  stale: { label: t('Stale'), color: colors.caution, soft: colors.cautionSoft },
  paused: { label: t('Paused'), color: colors.muted, soft: colors.cardAlt },
  unavailable: { label: t('Unavailable'), color: colors.muted, soft: colors.cardAlt },
  inactive: { label: t('Deactivated'), color: colors.danger, soft: colors.dangerSoft },
  account_active: { label: t('Active'), color: colors.safe, soft: colors.safeSoft },
};

export const NOTIFICATION_TYPES = {
  safety: { label: t('Safety Alert'), icon: 'shield', color: colors.caution },
  weather: { label: t('Weather Alert'), icon: 'cloud-lightning', color: colors.info },
  travel: { label: t('Travel Alert'), icon: 'navigation', color: colors.accent },
  emergency: { label: t('Emergency Alert'), icon: 'alert-triangle', color: colors.danger },
  trip: { label: t('Trip Reminder'), icon: 'calendar', color: colors.safe },
  general: { label: t('General'), icon: 'bell', color: colors.muted },
};

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
export const MOBILE_MAX_WIDTH = 430;
export const DEFAULT_CENTER = { latitude: 28.6139, longitude: 77.209 };
export const TRACKING_INTERVAL_MS = 15000;
