# TravelGuardian360

Tourist safety platform: a mobile-first tourist app and an administrator console, sharing one FastAPI backend and one SQLite database.

```
React Native (react-native-web)  ->  FastAPI REST API  ->  SQLite (SQLAlchemy)
```

## Run it (no phone or USB needed)

```
npm install --legacy-peer-deps
pip install -r backend/requirements.txt

npm run backend      # API on http://localhost:8000  (docs at /docs)
npm run web          # app on http://localhost:5173
```

Or double-click `start-web.bat` on Windows. On first start the database (`backend/travelguardian360.db`) is created and filled with starting records.

| Where | URL | Sign in |
|---|---|---|
| Tourist app (mobile layout, centred on desktop) | http://localhost:5173 | `aditi.sharma@mail.com` / `Tourist@123` (or register) |
| Admin console | http://localhost:5173/admin | `admin@travelguardian360.com` / `Admin@360` |

Change the admin credentials with `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `backend/.env` before the first start, and set a real `SECRET_KEY`.
Allow location access in the browser to see your own position on the map. Without it the app falls back to your last shared position or trip destination and says so.

## Configuration

- `VITE_API_URL` (frontend, optional): backend address. Default is the page host on port 8000; the Android emulator uses `10.0.2.2:8000`.
- `backend/.env`: `SECRET_KEY`, `DATABASE_URL`, `ADMIN_*`, `CORS_ORIGINS`, optional `OPENWEATHER_API_KEY`. Weather uses Open-Meteo (no key) unless an OpenWeather key is set; observations are cached in the `weather_info` table.
- Map tiles are OpenStreetMap; address lookup and weather need internet access.

## Layout

- `backend/app` - `main.py`, `database/` (engine, seed), `models/`, `schemas/`, `routes/`, `services/`, `utils/`. Tests: `npm run test:backend`.
- `src/screens` tourist screens, `src/admin` admin console, `src/components`, `src/navigation`, `src/services` (API client and per-domain services), `src/context`, `src/hooks`, `src/utils`.
- `_legacy_v1/` - the previous TypeScript implementation, kept for reference only and excluded from the bundle.

## Security notes

- Roles live in `users.role`. Every `/admin/*` route (except login) depends on `require_admin`, which reads the role from the database. Public registration always creates role `user`. Tourist and admin logins reject each other's accounts.
- Admins see medical details only through `/admin/users/{id}/emergency-medical` or an open SOS, only the blood group, allergies and conditions, and each read is written to `audit_logs`.
- Tourist ID is blockchain-*ready*: each record has a SHA-256 hash and a `ledger_status` that stays `not_connected`. No blockchain network is integrated; verification is done by administrators.

## Android

The same source runs through Metro (`npm start`, `npm run android`) using `@react-native-community/geolocation` for device location (permissions added to the manifest). The embedded map is web-only; on devices the Location view shows coordinates and opens the system maps app. The Android build has not been compiled in this environment.
