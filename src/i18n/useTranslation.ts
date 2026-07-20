/**
 * Translation hook — mirrors react-i18next's useTranslation() shape:
 *   const { t, language, setLanguage } = useTranslation();
 * Re-renders consumers when the language changes.
 */
import { useCallback } from 'react';
import { useI18nStore } from '../store/i18nStore';
import { translate, type TranslationKey } from './index';

export function useTranslation() {
  const language = useI18nStore((s) => s.language);
  const setLanguage = useI18nStore((s) => s.setLanguage);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) =>
      translate(language, key, params),
    [language],
  );

  return { t, language, setLanguage };
}
