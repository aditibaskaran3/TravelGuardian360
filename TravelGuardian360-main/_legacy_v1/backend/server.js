const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

const users = [];
const contacts = [
  {
    id: 'contact-1',
    name: 'Maya Sharma',
    phone: '+91-9876543210',
    relationship: 'Spouse',
    isPrimary: true,
  },
  {
    id: 'contact-2',
    name: 'Rahul Verma',
    phone: '+91-9123456789',
    relationship: 'Brother',
    isPrimary: false,
  },
];

const geofences = [
  {
    id: 'zone-1',
    name: 'Connaught Place Safe Zone',
    type: 'safe',
    description: 'Central tourist district with monitoring and support services.',
    center: { latitude: 28.6304, longitude: 77.2167 },
    radiusMeters: 250,
  },
  {
    id: 'zone-2',
    name: 'Old Delhi Restricted Zone',
    type: 'restricted',
    description: 'High foot traffic and restricted access monitoring area.',
    center: { latitude: 28.6505, longitude: 77.2305 },
    radiusMeters: 180,
  },
  {
    id: 'zone-3',
    name: 'Flood-Prone River Road',
    type: 'hazardous',
    description: 'Weather alert area with temporary travel restrictions.',
    center: { latitude: 28.6129, longitude: 77.2199 },
    radiusMeters: 140,
  },
];

const sosEvents = [];

function generateTouristId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 6; i += 1) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `TG-${suffix}`;
}

function issueToken(userId) {
  return `demo.${userId}.${Date.now() + 7 * 24 * 60 * 60 * 1000}`;
}

function parseToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== 'demo') return null;
  const exp = Number(parts[2]);
  if (!Number.isFinite(exp)) return null;
  return { userId: parts[1], exp };
}

function sanitizeUser(user) {
  const { password, ...safeUser } = user;
  return safeUser;
}

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    service: 'travel-guardian-demo',
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/auth/register', (req, res) => {
  const payload = req.body || {};
  const fullName = String(payload.fullName || '').trim();
  const email = String(payload.email || '').trim().toLowerCase();
  const phone = String(payload.phone || '').trim();
  const password = String(payload.password || '');
  const nationality = String(payload.nationality || '').trim();
  const emergencyContactName = String(payload.emergencyContactName || '').trim();
  const emergencyContactPhone = String(payload.emergencyContactPhone || '').trim();

  if (!fullName || !email || !phone || !password) {
    return res.status(400).json({ message: 'Name, email, phone and password are required.' });
  }

  const existingUser = users.find((user) => user.email === email);
  if (existingUser) {
    return res.status(409).json({ message: 'An account with this email already exists.' });
  }

  const user = {
    id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    touristId: generateTouristId(),
    fullName,
    email,
    phone,
    nationality: nationality || 'India',
    emergencyContact: {
      name: emergencyContactName || 'Emergency Contact',
      phone: emergencyContactPhone || '+91-9999999999',
    },
    createdAt: new Date().toISOString(),
    password,
  };

  users.push(user);

  res.status(201).json({
    token: issueToken(user.id),
    user: sanitizeUser(user),
  });
});

app.post('/api/auth/login', (req, res) => {
  const payload = req.body || {};
  const email = String(payload.email || '').trim().toLowerCase();
  const password = String(payload.password || '');

  const user = users.find((entry) => entry.email === email);

  if (!user || user.password !== password) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  res.json({
    token: issueToken(user.id),
    user: sanitizeUser(user),
  });
});

app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const parsedToken = parseToken(token);

  if (!parsedToken) {
    return res.status(401).json({ message: 'Invalid session token.' });
  }

  if (parsedToken.exp < Date.now()) {
    return res.status(401).json({ message: 'Session expired.' });
  }

  const user = users.find((entry) => entry.id === parsedToken.userId);
  if (!user) {
    return res.status(404).json({ message: 'Account no longer exists.' });
  }

  res.json(sanitizeUser(user));
});

app.get('/api/contacts', (req, res) => {
  res.json(contacts);
});

app.put('/api/contacts', (req, res) => {
  const nextContacts = Array.isArray(req.body) ? req.body : [];

  contacts.splice(0, contacts.length, ...nextContacts.map((contact) => ({
    id: String(contact.id || `contact-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
    name: String(contact.name || ''),
    phone: String(contact.phone || ''),
    relationship: String(contact.relationship || 'Contact'),
    isPrimary: Boolean(contact.isPrimary),
  })));

  res.json({ success: true, count: contacts.length });
});

app.get('/api/geofences', (req, res) => {
  res.json(geofences);
});

app.post('/api/sos', (req, res) => {
  const event = req.body || {};
  const record = {
    id: `sos-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Number(event.timestamp || Date.now()),
    coordinates: event.coordinates || null,
    contactName: String(event.contactName || 'Emergency Contact'),
  };

  sosEvents.unshift(record);
  res.status(201).json({ ok: true, event: record });
});

app.get('/api/sos', (req, res) => {
  res.json(sosEvents);
});

app.use((err, req, res, next) => {
  console.error('Unhandled backend error:', err);
  res.status(500).json({ message: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`TravelGuardian360 demo backend running on http://localhost:${PORT}`);
});
