/**
 * Demo Data — Single Source of Truth for all demo content.
 *
 * Every screen that needs sample data imports from here.
 * When DEMO_MODE is disabled, these are ignored — real data comes from stores.
 *
 * IMPORTANT: This file must never be imported by store/service files that run
 * in production. It is safe to import in mock services and the demo-reset util.
 */
import { DEMO_TRAVELLER } from '../config/env';
import type { EmergencyContactRecord } from '../features/contacts/types';
import type { MedicalID, FamilyMember } from '../features/medical/types';
import type { GeoZone } from '../features/geofencing/types';
import type { TravelDocument } from '../features/settings/services/travelDocumentsService';
import type { Itinerary } from '../features/itinerary/types';

// ────────────────────────────────────────────────────────────────────────────
// Traveller profile
// ────────────────────────────────────────────────────────────────────────────
export const DEMO_USER = {
  id: 'demo-user-jane-2026',
  touristId: 'TG-D26868',
  fullName: DEMO_TRAVELLER.fullName,
  email: DEMO_TRAVELLER.email,
  phone: DEMO_TRAVELLER.phone,
  nationality: DEMO_TRAVELLER.nationality,
  emergencyContact: {
    name: DEMO_TRAVELLER.emergencyContactName,
    phone: DEMO_TRAVELLER.emergencyContactPhone,
  },
  createdAt: '2026-09-15T10:00:00.000Z',
};

// ────────────────────────────────────────────────────────────────────────────
// Emergency contacts
// ────────────────────────────────────────────────────────────────────────────
export const DEMO_CONTACTS: EmergencyContactRecord[] = [
  {
    id: 'contact-demo-001',
    name: 'Rahul Sharma',
    phone: '+91 87654 32109',
    relationship: 'Spouse',
    isPrimary: true,
  },
  {
    id: 'contact-demo-002',
    name: 'Priya Sharma',
    phone: '+91 76543 21098',
    relationship: 'Sister',
    isPrimary: false,
  },
  {
    id: 'contact-demo-003',
    name: 'Indian Embassy Delhi',
    phone: '+91 11 2419 8000',
    relationship: 'Embassy',
    isPrimary: false,
  },
];

// ────────────────────────────────────────────────────────────────────────────
// Medical ID
// ────────────────────────────────────────────────────────────────────────────
export const DEMO_MEDICAL_ID: MedicalID = {
  bloodGroup: 'B+',
  allergies: ['Penicillin', 'Shellfish'],
  medicalConditions: ['Mild Asthma'],
  medications: ['Salbutamol Inhaler (as needed)', 'Cetirizine 10mg (seasonal)'],
  updatedAt: '2026-09-15T10:00:00.000Z',
};

// ────────────────────────────────────────────────────────────────────────────
// Safety zones around New Delhi
// Positioned so the demo location path reliably passes through them.
// ────────────────────────────────────────────────────────────────────────────
export const DEMO_ZONES: GeoZone[] = [
  {
    id: 'zone-safe-connaught',
    name: 'Connaught Place Safe Zone',
    type: 'safe',
    description:
      'Well-patrolled tourist hub with police presence and high safety rating. Popular for shopping and dining.',
    center: { latitude: 28.6139, longitude: 77.209 },
    radiusMeters: 400,
  },
  {
    id: 'zone-caution-paharganj',
    name: 'Paharganj Caution Area',
    type: 'hazardous',
    description:
      'Increased petty crime reported in this area. Stay aware of your surroundings and keep valuables secure.',
    center: { latitude: 28.6452, longitude: 77.2125 },
    radiusMeters: 350,
  },
  {
    id: 'zone-highrisk-chandni',
    name: 'Chandni Chowk High-Density Zone',
    type: 'restricted',
    description:
      'Extremely congested area with reported pickpocketing incidents. Consider an alternative route.',
    center: { latitude: 28.6506, longitude: 77.2309 },
    radiusMeters: 300,
  },
  {
    id: 'zone-safe-lodhi',
    name: 'Lodhi Garden Safe Zone',
    type: 'safe',
    description:
      'Quiet, well-maintained heritage garden with regular security patrols. Excellent for leisure walks.',
    center: { latitude: 28.5931, longitude: 77.2197 },
    radiusMeters: 500,
  },
];

// ────────────────────────────────────────────────────────────────────────────
// Simulated New Delhi GPS waypoints
// These pass near the zones above to trigger zone events during the demo.
// Each step is ~100–200 m apart, update interval is 5 s → realistic walking.
// ────────────────────────────────────────────────────────────────────────────
export const DEMO_LOCATION_PATH = [
  // Start: Connaught Place center (inside safe zone)
  { latitude: 28.6139, longitude: 77.209 },
  { latitude: 28.6145, longitude: 77.2102 },
  { latitude: 28.6152, longitude: 77.211 },
  { latitude: 28.6160, longitude: 77.2125 },
  { latitude: 28.6172, longitude: 77.214 },
  { latitude: 28.6185, longitude: 77.215 },
  { latitude: 28.6200, longitude: 77.2160 },
  // Moving north towards Paharganj (approaching caution zone)
  { latitude: 28.6250, longitude: 77.2170 },
  { latitude: 28.6300, longitude: 77.2175 },
  { latitude: 28.6350, longitude: 77.2180 },
  { latitude: 28.6380, longitude: 77.2120 },
  { latitude: 28.6410, longitude: 77.2125 },
  // Entering Paharganj caution zone
  { latitude: 28.6440, longitude: 77.2125 },
  { latitude: 28.6452, longitude: 77.2125 },
  { latitude: 28.6460, longitude: 77.2130 },
  // Moving towards Chandni Chowk high-risk zone
  { latitude: 28.6465, longitude: 77.2180 },
  { latitude: 28.6470, longitude: 77.2220 },
  { latitude: 28.6480, longitude: 77.2260 },
  { latitude: 28.6490, longitude: 77.2290 },
  // Entering Chandni Chowk high-risk zone
  { latitude: 28.6500, longitude: 77.2305 },
  { latitude: 28.6506, longitude: 77.2309 },
  // Moving back south towards safety
  { latitude: 28.6490, longitude: 77.2280 },
  { latitude: 28.6460, longitude: 77.2240 },
  { latitude: 28.6420, longitude: 77.2200 },
  { latitude: 28.6370, longitude: 77.2190 },
  // Back to Connaught Place (safe zone)
  { latitude: 28.6300, longitude: 77.2160 },
  { latitude: 28.6230, longitude: 77.2130 },
  { latitude: 28.6180, longitude: 77.2110 },
  { latitude: 28.6145, longitude: 77.2102 },
  { latitude: 28.6139, longitude: 77.209 },
];

// ────────────────────────────────────────────────────────────────────────────
// Sample trip
// ────────────────────────────────────────────────────────────────────────────
export const DEMO_TRIP_NAME = DEMO_TRAVELLER.tripName;
export const DEMO_DESTINATION = 'New Delhi, India';

// ────────────────────────────────────────────────────────────────────────────
// Helplines
// ────────────────────────────────────────────────────────────────────────────
export const DEMO_HELPLINES = [
  { label: 'Police', number: '100', icon: '👮' },
  { label: 'Ambulance', number: '102', icon: '🚑' },
  { label: 'Fire Brigade', number: '101', icon: '🚒' },
  { label: 'Emergency (Unified)', number: '112', icon: '🆘' },
  { label: 'Tourist Helpline', number: '1800-111-363', icon: '🧳' },
  { label: 'Women Helpline', number: '1091', icon: '♀️' },
  { label: 'Cyber Crime', number: '155260', icon: '💻' },
];

// ────────────────────────────────────────────────────────────────────────────
// Family profiles
// ────────────────────────────────────────────────────────────────────────────
export const DEMO_FAMILY_MEMBERS: FamilyMember[] = [
  {
    id: 'family-demo-001',
    name: 'Leo Cooper',
    relationship: 'Child',
    bloodGroup: 'O+',
    allergies: ['Peanuts'],
    medicalConditions: ['None'],
    medications: ['None'],
    createdAt: '2026-09-15T10:00:00.000Z',
    updatedAt: '2026-09-15T10:00:00.000Z',
  },
  {
    id: 'family-demo-002',
    name: 'Arthur Cooper',
    relationship: 'Spouse',
    bloodGroup: 'A+',
    allergies: ['Aspirin'],
    medicalConditions: ['Hypertension'],
    medications: ['Amlodipine 5mg'],
    createdAt: '2026-09-15T10:00:00.000Z',
    updatedAt: '2026-09-15T10:00:00.000Z',
  },
];

// ────────────────────────────────────────────────────────────────────────────
// Travel documents
// ────────────────────────────────────────────────────────────────────────────
export const DEMO_TRAVEL_DOCUMENTS: TravelDocument[] = [
  {
    id: 'doc-demo-01',
    name: 'Tourist Passport',
    ownerName: 'Jane Cooper',
    type: 'Passport',
    reference: 'Z89421038',
    uploadedAt: '2026-09-15T10:00:00.000Z',
    status: 'Verified (Expires 2032)',
  },
  {
    id: 'doc-demo-02',
    name: 'India e-Tourist Visa',
    ownerName: 'Jane Cooper',
    type: 'Visa',
    reference: 'V-IND-2026-9812',
    uploadedAt: '2026-09-18T10:00:00.000Z',
    status: 'Active (Valid until Dec 2026)',
  },
  {
    id: 'doc-demo-03',
    name: 'Travel Health Insurance',
    ownerName: 'Jane Cooper',
    type: 'Insurance',
    reference: 'POL-TG360-7719',
    uploadedAt: '2026-09-18T10:00:00.000Z',
    status: 'Active ($100k Emergency Cover)',
  },
];

// ────────────────────────────────────────────────────────────────────────────
// Travel itineraries
// ────────────────────────────────────────────────────────────────────────────
export const DEMO_ITINERARIES: Itinerary[] = [
  {
    id: 'itin-demo-01',
    destination: 'New Delhi & Agra Heritage Circuit',
    startDate: '2026-10-01',
    endDate: '2026-10-07',
    emergencyContactIds: ['contact-demo-001', 'contact-demo-002'],
    createdAt: '2026-09-28T08:00:00.000Z',
    notes: 'Day 1-3: Central Delhi & Connaught Place. Day 4: Chandni Chowk & Red Fort. Day 5-6: Taj Mahal day excursion. Hotel: The Imperial New Delhi.',
  },
];

