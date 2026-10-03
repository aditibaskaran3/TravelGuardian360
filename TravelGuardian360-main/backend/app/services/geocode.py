import httpx
from sqlalchemy.orm import Session

from app.models import SafetyZone
from app.utils.geo import haversine_m

_cache: dict[str, str] = {}


def _nearest_zone_label(db: Session, lat: float, lon: float) -> str | None:
    zones = db.query(SafetyZone).all()
    if not zones:
        return None
    zone = min(zones, key=lambda z: haversine_m(lat, lon, z.latitude, z.longitude))
    if haversine_m(lat, lon, zone.latitude, zone.longitude) > 60_000:
        return None
    return f"{zone.name}, {zone.city}" if zone.city else zone.name


def reverse_geocode(db: Session, lat: float, lon: float) -> str:
    """Human-readable place name; falls back to the nearest known zone, then to coordinates."""
    key = f"{lat:.3f},{lon:.3f}"
    if key in _cache:
        return _cache[key]
    label = None
    try:
        response = httpx.get(
            "https://api.bigdatacloud.net/data/reverse-geocode-client",
            params={"latitude": lat, "longitude": lon, "localityLanguage": "en"},
            timeout=5,
        )
        response.raise_for_status()
        data = response.json()
        parts = [data.get("locality") or data.get("city"), data.get("principalSubdivision"), data.get("countryName")]
        label = ", ".join(p for p in dict.fromkeys(parts) if p) or None
    except (httpx.HTTPError, ValueError):
        label = None
    label = label or _nearest_zone_label(db, lat, lon) or f"{lat:.4f}, {lon:.4f}"
    _cache[key] = label
    return label


def search_place(name: str) -> tuple[float, float] | None:
    """Coordinates for a destination name, or None when the lookup is unavailable."""
    try:
        response = httpx.get(
            "https://geocoding-api.open-meteo.com/v1/search",
            params={"name": name.split(",")[0].strip(), "count": 1, "language": "en"},
            timeout=4,
        )
        response.raise_for_status()
        results = response.json().get("results") or []
        return (results[0]["latitude"], results[0]["longitude"]) if results else None
    except (httpx.HTTPError, ValueError, KeyError):
        return None
