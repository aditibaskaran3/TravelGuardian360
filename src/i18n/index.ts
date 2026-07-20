/**
 * i18n registry + pure translate function.
 *
 * In-house replacement for i18next (blocked by the network proxy). Same mental
 * model — dictionaries keyed by language, a `t(key, params)` lookup with
 * interpolation and English fallback. Non-English dictionaries are Partial, so
 * any missing key gracefully falls back to English.
 */
import { en, type TranslationKey } from './translations/en';
import { bn, de, es, fr, hi, ja, kn, ml, mr, ta, te } from './translations/locales';

export type Language =
  | 'en'
  | 'hi'
  | 'ta'
  | 'te'
  | 'ml'
  | 'kn'
  | 'mr'
  | 'bn'
  | 'ja'
  | 'de'
  | 'fr'
  | 'es';

export const LANGUAGES: { code: Language; label: string; nativeLabel: string }[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்' },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు' },
  { code: 'ml', label: 'Malayalam', nativeLabel: 'മലയാളം' },
  { code: 'kn', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी' },
  { code: 'bn', label: 'Bengali', nativeLabel: 'বাংলা' },
  { code: 'ja', label: 'Japanese', nativeLabel: '日本語' },
  { code: 'de', label: 'German', nativeLabel: 'Deutsch' },
  { code: 'fr', label: 'French', nativeLabel: 'Français' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español' },
];

const DICTIONARIES: Record<Language, Partial<Record<TranslationKey, string>>> = {
  en,
  hi,
  ta,
  te,
  ml,
  kn,
  mr,
  bn,
  ja,
  de,
  fr,
  es,
};

export type { TranslationKey };

/** Looks up a key for a language (English fallback) and interpolates {params}. */
export function translate(
  language: Language,
  key: TranslationKey,
  params?: Record<string, string | number>,
): string {
  const template = DICTIONARIES[language]?.[key] ?? en[key] ?? key;
  if (!params) {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    params[name] != null ? String(params[name]) : `{${name}}`,
  );
}
