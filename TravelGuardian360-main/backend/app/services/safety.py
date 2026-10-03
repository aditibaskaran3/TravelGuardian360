from sqlalchemy.orm import Session

from app.models import SafetyZone
from app.utils.geo import haversine_m

SEVERITY = {"safe": 0, "caution": 1, "high_risk": 2}
LABELS = {"safe": "Safe", "caution": "Caution", "high_risk": "High Risk"}
MESSAGES = {
    "safe": "No active risks reported around you. Enjoy your journey.",
    "caution": "Stay alert here. Keep valuables close and avoid isolated streets after dark.",
    "high_risk": "High-risk area. Move to a safer location and share your live location with your contacts.",
}


def _zone_dict(zone: SafetyZone, distance_m: float) -> dict:
    return {
        "id": zone.id,
        "name": zone.name,
        "city": zone.city,
        "zone_type": zone.zone_type,
        "safety_level": zone.safety_level,
        "description": zone.description,
        "latitude": zone.latitude,
        "longitude": zone.longitude,
        "radius_m": zone.radius_m,
        "distance_m": round(distance_m),
    }


def evaluate_position(db: Session, latitude: float, longitude: float) -> dict:
    """Work out the safety status for a position from the zones stored in the database."""
    zones = db.query(SafetyZone).all()
    measured = [(z, haversine_m(latitude, longitude, z.latitude, z.longitude)) for z in zones]
    inside = [(z, d) for z, d in measured if d <= z.radius_m]

    if inside:
        # The most severe zone wins; ties go to the zone whose centre is closest.
        zone, distance = max(inside, key=lambda zd: (SEVERITY[zd[0].zone_type], -zd[1]))
        status = zone.zone_type
        level = zone.safety_level
        message = zone.description or MESSAGES[status]
        current = _zone_dict(zone, distance)
    else:
        status, level, current = "safe", 85, None
        message = MESSAGES["safe"]

    nearby = [_zone_dict(z, d) for z, d in sorted(measured, key=lambda zd: zd[1])[:5]]
    return {
        "status": status,
        "label": LABELS[status],
        "safety_level": level,
        "message": message,
        "zone": current,
        "nearby": nearby,
    }
