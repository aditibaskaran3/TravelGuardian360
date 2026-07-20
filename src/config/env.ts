/**
 * Central runtime configuration.
 *
 * Everything environment-specific lives here so screens/services never hardcode
 * URLs or feature flags. When the FastAPI backend module is ready, point
 * API_BASE_URL at it and set USE_MOCK_API to false — no other code changes.
 */

// Android emulator maps the host machine's localhost to 10.0.2.2.
// For a physical device over `adb reverse`, 'http://localhost:8000' also works.
export const API_BASE_URL = 'http://10.0.2.2:8000/api';

// While the backend is not built yet, the mock auth service handles everything
// locally on-device. Flip to false once the real API is available.
export const USE_MOCK_API = true;

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
// Zones come from the mock provider (static, on-device) until the backend
// exposes them. Flip to false + implement the real endpoint to use live zones.
export const USE_MOCK_GEOFENCE = true;

// --- Emergency / SOS ------------------------------------------------------
// National emergency number used by the SOS "Call emergency" action.
// India: 112. Change per deployment region.
export const EMERGENCY_NUMBER = '112';

// SOS events are logged locally (mock) until the backend exposes /sos.
export const USE_MOCK_SOS = true;
