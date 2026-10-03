"""Translates the server-side text that already exists (zones, travel information, notifications, messages)
into every supported language and stores it in the `translations` table, so the app is fast and works
offline for that content. Run from the backend folder: python prewarm_translations.py"""
import re
from pathlib import Path

from app.database.database import SessionLocal
from app.database.seed import init_db
from app.models import Notification, SafetyZone, TravelInfo
from app.services.safety import LABELS, MESSAGES
from app.services.translate import API_CODES, translate_many
from app.services.weather import _OWM, _WMO

init_db()

texts: set[str] = set()
with SessionLocal() as db:
    for z in db.query(SafetyZone).all():
        texts.update(filter(None, [z.name, z.city, z.description]))
    for i in db.query(TravelInfo).all():
        texts.update(filter(None, [i.title, i.content]))
    for n in db.query(Notification).all():
        texts.update([n.title, n.message])

texts.update(LABELS.values())
texts.update(MESSAGES.values())
texts.update(condition for condition, _icon in _WMO.values())
texts.update(["Mist", "Fog", "Haze", "Smoke", "Dust", "Unsettled"])

# Messages written inline in the routes, e.g. HTTPException(404, "Trip not found.")
for path in Path("app").rglob("*.py"):
    source = path.read_text(encoding="utf-8")
    texts.update(re.findall(r'HTTPException\(\s*(?:status\.\w+|\d+),\s*"([^"]+)"', source))
    texts.update(re.findall(r'ValueError\("([^"]+)"\)', source))
texts.update([
    "Your session has expired. Please sign in again.", "This account has been deactivated.",
    "This area is for tourist accounts.", "Administrator access is required.", "Invalid data.",
    "We could not complete that request. Please try again.", "Weather information is not available right now.",
    "Incorrect email or password.", "Administrator accounts sign in from the Admin login.",
    "This account has been deactivated. Contact support.",
])

ordered = sorted(t for t in texts if t)
print(f"{len(ordered)} texts x {len(API_CODES)} languages")
for lang in API_CODES:
    translate_many(ordered, lang)
    print("done", lang)
