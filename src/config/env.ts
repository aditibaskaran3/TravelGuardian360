/**
 * Central runtime configuration.
 *
 * Everything environment-specific lives here so screens/services never hardcode
 * URLs or feature flags. When the FastAPI backend module is ready, point
 * API_BASE_URL at it and set USE_MOCK_API to false — no other code changes.
 */

// For a USB-connected Android device, use adb reverse so the device's
// localhost points to the machine running the FastAPI server.
// For emulator builds, 10.0.2.2 also works.
export const API_BASE_URL = 'http://localhost:3001/api';

// Demo backend is active by default so the app can show real request/response
// flows without needing a production backend.
export const USE_MOCK_API = false;

// Network timeout for all API calls (ms).
export const API_TIMEOUT = 15000;

// AsyncStorage key namespace to avoid collisions across modules.
export const STORAGE_PREFIX = '@tg360';

// --- Location / GPS tracking ---------------------------------------------
// While @react-native-community/geolocation is not installed, the mock
// location service emits simulated GPS updates so the feature is testable
// on-device. Flip to false (and install the package) for real device GPS.
export const USE_MOCK_LOCATION = true;

// How often to sample position while tracking (ms).
export const LOCATION_UPDATE_INTERVAL_MS = 3000;

// Starting point for the simulated track (used by the mock only).
export const MOCK_START_COORDINATES = { latitude: 28.6139, longitude: 77.209 }; // New Delhi

// --- Geo-fencing ----------------------------------------------------------
// Not part of the review scope; keep mock behavior for now.
export const USE_MOCK_GEOFENCE = true;

// --- Emergency / SOS ------------------------------------------------------
// National emergency number used by the SOS "Call emergency" action.
// India: 112. Change per deployment region.
export const EMERGENCY_NUMBER = '112';

// SOS events use the real backend for demo review so emergency incidents are
// stored and retrievable from SQLite.
export const USE_MOCK_SOS = false;
