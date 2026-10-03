// `api` is the code the translation service understands.
export const LANGUAGES = [
  { code: 'en', native: 'English', english: 'English', api: 'en' },
  { code: 'hi', native: 'हिन्दी', english: 'Hindi', api: 'hi' },
  { code: 'ta', native: 'தமிழ்', english: 'Tamil', api: 'ta' },
  { code: 'te', native: 'తెలుగు', english: 'Telugu', api: 'te' },
  { code: 'mr', native: 'मराठी', english: 'Marathi', api: 'mr' },
  { code: 'es', native: 'Español', english: 'Spanish', api: 'es' },
  { code: 'fr', native: 'Français', english: 'French', api: 'fr' },
  { code: 'de', native: 'Deutsch', english: 'German', api: 'de' },
  { code: 'ja', native: '日本語', english: 'Japanese', api: 'ja' },
  { code: 'zh', native: '简体中文', english: 'Chinese', api: 'zh-CN' },
  { code: 'ru', native: 'Русский', english: 'Russian', api: 'ru' },
];

export const SUPPORTED = LANGUAGES.map((l) => l.code);
