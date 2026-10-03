import { translate } from '../src/i18n';

describe('translate', () => {
  it('returns the English label for auth UI strings', () => {
    expect(translate('en', 'auth.welcomeBack' as any)).toBe('Welcome back');
  });

  it('falls back to English for missing locale entries', () => {
    expect(translate('hi', 'common.cancel' as any)).toBe('Cancel');
  });
});
