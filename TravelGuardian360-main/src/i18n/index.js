import { NativeModules, Platform } from 'react-native';

import { LANGUAGES, SUPPORTED } from './languages';
import de from './locales/de.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import hi from './locales/hi.json';
import ja from './locales/ja.json';
import mr from './locales/mr.json';
import ru from './locales/ru.json';
import ta from './locales/ta.json';
import te from './locales/te.json';
import zh from './locales/zh.json';

export { LANGUAGES };

const DICTIONARIES = { hi, ta, te, mr, es, fr, de, ja, zh, ru };
const STORAGE_KEY = 'tg360.lang';

function fromDevice() {
  try {
    const raw = Platform.OS === 'ios'
      ? (NativeModules.SettingsManager && NativeModules.SettingsManager.settings && NativeModules.SettingsManager.settings.AppleLocale)
      : NativeModules.I18nManager && NativeModules.I18nManager.localeIdentifier;
    const code = String(raw || '').slice(0, 2).toLowerCase();
    return SUPPORTED.includes(code) ? code : 'en';
  } catch {
    return 'en';
  }
}

function readLanguage() {
  if (Platform.OS !== 'web') return fromDevice();
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (SUPPORTED.includes(saved)) return saved;
  } catch {
    // storage unavailable: English
  }
  return 'en';
}

export const language = readLanguage();
const dictionary = DICTIONARIES[language] || {};

if (Platform.OS === 'web' && typeof document !== 'undefined') document.documentElement.lang = language;

/**
 * Translates a UI string. English text is the key, so English needs no dictionary.
 * Placeholders look like {name}.
 */
export function t(text, vars) {
  let out = dictionary[text] !== undefined ? dictionary[text] : text;
  if (vars) out = out.replace(/\{(\w+)\}/g, (match, key) => (vars[key] !== undefined ? String(vars[key]) : match));
  return out;
}

/** Saves the choice and reloads, because every screen reads its text once at start-up (web). */
export function setLanguage(code) {
  if (!SUPPORTED.includes(code) || code === language) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, code);
    window.location.reload();
  } catch {
    // not available on this platform
  }
}

export const currentLanguage = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];
