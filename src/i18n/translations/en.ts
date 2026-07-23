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

  // Trip mode
  'trip.title': 'Trip Mode',
  'trip.notActive': 'No active trip',
  'trip.active': 'Trip active',
  'trip.paused': 'Trip paused',
  'trip.startButton': 'Start Trip',
  'trip.endButton': 'End Trip',
  'trip.pauseButton': 'Pause',
  'trip.resumeButton': 'Resume',
  'trip.duration': 'Duration',
  'trip.started': 'Started',
  'trip.startTime': '{time}',

  // Travel itinerary
  'itinerary.title': 'Travel Itinerary',
  'itinerary.subtitle': 'Plan and share your trips',
  'itinerary.description': 'Record your destination, dates, and emergency contacts for each trip.',
  'itinerary.addNew': 'Add a new itinerary',
  'itinerary.destination': 'Destination city or region',
  'itinerary.startDate': 'Start date',
  'itinerary.endDate': 'End date',
  'itinerary.notes': 'Trip notes (optional)',
  'itinerary.selectContacts': 'Select emergency contacts:',
  'itinerary.save': 'Save itinerary',
  'itinerary.share': 'Share',
  'itinerary.noItems': 'No itineraries yet. Add your first trip above.',

  // Emergency Medical ID
  'medical.title': 'Emergency Medical ID',
  'medical.subtitle': 'Critical health information',
  'medical.description': 'Store blood group, allergies, medications, and medical conditions for first responders.',
  'medical.bloodGroup': 'Blood group',
  'medical.allergies': 'Allergies',
  'medical.conditions': 'Medical conditions',
  'medical.medications': 'Current medications',
  'medical.emergencyContact': 'Emergency contact',
  'medical.updateInProfile': 'Update in Profile',
  'medical.save': 'Save medical ID',

  // Family members
  'family.title': 'Family Members',
  'family.subtitle': 'Medical information for loved ones',
  'family.description': 'Keep medical profiles for your spouse, children, parents, and other family members. Critical for emergencies while travelling together.',
  'family.addMember': 'Add family member',
  'family.addNew': 'Add a new family member',
  'family.memberName': 'Full name',
  'family.selectRelationship': 'Relationship:',
  'family.noMembers': 'No family members yet. Add your first family member above.',

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
  'more.itinerary': 'Travel itinerary',
  'more.itineraryDesc': 'Plan, record, and share your trips.',
  'more.medicalID': 'Medical ID',
  'more.medicalIDDesc': 'Store emergency health information for first responders.',
  'more.familyMembers': 'Family members',
  'more.familyMembersDesc': 'Manage medical information for family members.',
  'more.behaviour': 'Behaviour analysis',
  'more.behaviourDesc': 'Review movement anomalies detected during your trip.',
  'more.safetyScore': 'Safety score',
  'more.safetyScoreDesc': 'See the full breakdown of your live safety score.',
  'more.logout': 'Log out',

  // Language screen
  'language.title': 'Choose your language',
  'language.subtitle': 'The app updates instantly and remembers your choice.',
} as const;

export type TranslationKey = keyof typeof en;
