/**
 * Central runtime configuration.
 *
 * DEMO MODE (DEMO_MODE = true):
 *   - All data is local / simulated. No backend required.
 *   - Simulated New Delhi GPS path is used instead of device GPS.
 *   - Safety zones are deterministic demo zones around New Delhi.
 *   - SOS incidents are stored locally.
 *   - "Jane" demo account is pre-seeded.
 *
 * PRODUCTION MODE (DEMO_MODE = false):
 *   - Point API_BASE_URL at the FastAPI backend.
 *   - Set USE_MOCK_API = false, USE_MOCK_LOCATION = false, USE_MOCK_SOS = false.
 *   - Install @react-native-community/geolocation for real GPS.
 */

// ============================================================
// DEMO MODE MASTER SWITCH
// Set to false and configure the fields below for production.
// ============================================================
export const DEMO_MODE = true;

// For a USB-connected Android device, use adb reverse so the device's
// localhost points to the machine running the FastAPI server.
// For emulator builds, 10.0.2.2 also works.
export const API_BASE_URL = 'http://localhost:3001/api';

// When DEMO_MODE is true, mock API is always on.
export const USE_MOCK_API = DEMO_MODE ? true : false;

// Network timeout for all API calls (ms).
export const API_TIMEOUT = 15000;

// AsyncStorage key namespace to avoid collisions across modules.
export const STORAGE_PREFIX = '@tg360';

// --- Location / GPS tracking ---------------------------------------------
// When DEMO_MODE is true, the mock location service emits a deterministic
// sequence of New Delhi waypoints (not random drift) to reliably trigger
// zone transitions in the same order every demo run.
// Set to false (and install @react-native-community/geolocation) for real GPS.
export const USE_MOCK_LOCATION = DEMO_MODE ? true : false;

// How often to sample position while tracking (ms).
// 5 seconds for demo — fast enough to show zone transitions visibly.
export const LOCATION_UPDATE_INTERVAL_MS = 5000;

// Starting point for the simulated track (used by the mock only).
export const MOCK_START_COORDINATES = { latitude: 28.6139, longitude: 77.209 }; // New Delhi

// --- Geo-fencing ----------------------------------------------------------
export const USE_MOCK_GEOFENCE = DEMO_MODE ? true : false;

// --- Emergency / SOS ------------------------------------------------------
// National emergency number used by the SOS "Call emergency" action.
// India: 112. Change per deployment region.
export const EMERGENCY_NUMBER = '112';

// When DEMO_MODE is true, SOS incidents are stored locally, not on the backend.
export const USE_MOCK_SOS = DEMO_MODE ? true : false;

// --- Demo traveller identity (used to auto-seed the demo account) ---------
export const DEMO_TRAVELLER = {
  email: 'jane@travelguardian360.demo',
  password: 'demo1234',
  fullName: 'Jane Sharma',
  phone: '+91 98765 43210',
  nationality: 'Indian',
  emergencyContactName: 'Rahul Sharma',
  emergencyContactPhone: '+91 87654 32109',
  tripName: 'New Delhi Explorer',
};
