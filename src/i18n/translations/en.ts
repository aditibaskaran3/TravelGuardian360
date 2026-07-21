/**
 * English translations — the source of truth. Other languages are Partial:
 * any missing key falls back to English at runtime (see i18n/index.ts).
 */
export const en = {
  'app.name': 'TravelGuardian360',

  'common.language': 'Language',

  // Bottom navigation
  'nav.home': 'Home',
  'nav.track': 'Track',
  'nav.sos': 'SOS',
  'nav.zones': 'Zones',
  'nav.more': 'More',

  // Home dashboard
  'home.greeting': 'Hi, {name}',
  'home.subtitle': 'Stay safe on your travels.',
  'home.touristId': 'Digital Tourist ID',
  'home.safetyScore': 'Safety Score',
  'home.tapBreakdown': 'Tap for the full breakdown',
  'home.profile': 'Profile',
  'home.email': 'Email',
  'home.phone': 'Phone',
  'home.emergencyContact': 'Emergency contact',
  'home.emergencyPhone': 'Emergency phone',
  'home.protectionOn': 'Live protection active',
  'home.protectionOnDesc': 'Your location is being monitored in real time.',
  'home.protectionOff': 'Protection paused',
  'home.protectionOffDesc': 'Open the Track tab to start live monitoring.',
  'home.zonesNearby': '{count} monitored zones nearby',
  'home.pullToRefresh': 'Pull to refresh',

  // Profile screen
  'profile.title': 'Traveller details',
  'profile.subtitle': 'Your travel profile and emergency details',

  // More menu
  'more.title': 'More',
  'more.quickAccess': 'Quick access',
  'more.quickAccessTitle': 'Traveller essentials',
  'more.quickAccessDesc': 'Access the tools that matter most when you are moving around.',
  'more.contacts': 'Emergency contacts',
  'more.contactsDesc': 'Keep your trusted contacts ready to reach.',
  'more.documents': 'Travel documents',
  'more.documentsDesc': 'Upload and verify Aadhaar, passport, visa, or insurance papers.',
  'more.tripTools': 'Trip tools',
  'more.tripToolsDesc': 'Access checklists, local support contacts, and route safety updates.',
  'more.emergency': 'Emergency help',
  'more.emergencyDesc': 'Quick access to safety insights and support options.',
  'more.logout': 'Log out',

  // Language screen
  'language.title': 'Choose your language',
  'language.subtitle': 'The app updates instantly and remembers your choice.',
} as const;

export type TranslationKey = keyof typeof en;
