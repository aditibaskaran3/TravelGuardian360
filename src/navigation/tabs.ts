/**
 * Bottom-tab definitions for the main authenticated experience.
 */
import type { TranslationKey } from '../i18n';

export type TabKey = 'home' | 'track' | 'sos' | 'zones' | 'more';

export type TabDef = {
  key: TabKey;
  labelKey: TranslationKey;
  icon: string; // emoji glyph (no icon-font dependency)
  /** SOS gets emphasized styling in the bar. */
  emphasized?: boolean;
};

export const TABS: TabDef[] = [
  { key: 'home', labelKey: 'nav.home', icon: '🏠' },
  { key: 'track', labelKey: 'nav.track', icon: '📍' },
  { key: 'sos', labelKey: 'nav.sos', icon: '🆘', emphasized: true },
  { key: 'zones', labelKey: 'nav.zones', icon: '🛡️' },
  { key: 'more', labelKey: 'nav.more', icon: '☰' },
];
