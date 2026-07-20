/**
 * Language store — holds the active language, persists the choice, and hydrates
 * it on startup. Components read it through useTranslation.
 */
import { create } from './createStore';
import { storage } from '../services/storage';
import type { Language } from '../i18n';

const LANGUAGE_KEY = 'i18n/language';

type I18nState = {
  language: Language;
  setLanguage: (language: Language) => void;
  hydrateLanguage: () => Promise<void>;
};

export const useI18nStore = create<I18nState>((set) => ({
  language: 'en',

  setLanguage(language) {
    set({ language });
    void storage.setItem(LANGUAGE_KEY, language);
  },

  async hydrateLanguage() {
    const saved = await storage.getItem<Language>(LANGUAGE_KEY);
    if (saved) {
      set({ language: saved });
    }
  },
}));
