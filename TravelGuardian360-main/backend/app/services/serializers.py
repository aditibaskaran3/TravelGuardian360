import json

from sqlalchemy.orm import Session

from app.models import EmergencyContact, FamilyMember, Location, MedicalInfo, SOSRequest, TouristID, Trip, User
from app.utils.time import utcnow

# A tracked position older than this is treated as stale on the admin map.
STALE_AFTER_MINUTES = 30


def iso(dt):
    return dt.isoformat() + "Z" if dt else None


def tourist_id_out(user: User, tid: TouristID, db: Session) -> dict:
    medical = db.query(MedicalInfo).filter(MedicalInfo.user_id == user.id).first()
    contact = (
        db.query(EmergencyContact).filter(EmergencyContact.user_id == user.id)
        .order_by(EmergencyContact.is_primary.desc(), EmergencyContact.id).first()
    )
    trip = db.query(Trip).filter(Trip.user_id == user.id, Trip.status == "active").first()
    return {
        "id_number": tid.id_number,
        "full_name": user.full_name,
        "avatar_url": user.avatar_url,
        "nationality": tid.nationality,
        "date_of_birth": tid.date_of_birth.isoformat() if tid.date_of_birth else None,
        "passport_number": tid.passport_number,
        "verification_status": tid.verification_status,
        "verification_requested_at": iso(tid.verification_requested_at),
        "verified_at": iso(tid.verified_at),
        "record_hash": tid.record_hash,
        "ledger_status": tid.ledger_status,
        "emergency_contact": (
            {"name": contact.name, "phone": contact.phone, "relationship": contact.relationship_label}
            if contact else None
        ),
        "medical_info_available": bool(
            medical and any([medical.blood_group, medical.allergies, medical.conditions, medical.medications])
        ),
        "trip_status": "active" if trip else "none",
        "trip_destination": trip.destination if trip else None,
    }


def latest_location(db: Session, user_id: int) -> Location | None:
    return (
        db.query(Location).filter(Location.user_id == user_id)
        .order_by(Location.recorded_at.desc(), Location.id.desc()).first()
    )


def location_status(loc: Location | None) -> str:
    if loc is None:
        return "unavailable"
    if not loc.tracking_active:
        return "paused"
    age = (utcnow() - loc.recorded_at).total_seconds() / 60
    return "live" if age <= STALE_AFTER_MINUTES else "stale"


def location_out(loc: Location | None) -> dict | None:
    if loc is None:
        return None
    return {
        "latitude": loc.latitude, "longitude": loc.longitude, "accuracy": loc.accuracy, "label": loc.label,
        "tracking_active": loc.tracking_active, "recorded_at": iso(loc.recorded_at), "status": location_status(loc),
    }


def build_emergency_info(db: Session, user: User) -> str:
    """Snapshot stored with an SOS so responders have it even if the profile changes later."""
    settings = json.loads(user.settings_json or "{}")
    contacts = (
        db.query(EmergencyContact).filter(EmergencyContact.user_id == user.id)
        .order_by(EmergencyContact.is_primary.desc(), EmergencyContact.id).all()
    )
    info = {
        "name": user.full_name,
        "phone": user.phone,
        "contacts": [{"name": c.name, "phone": c.phone, "relationship": c.relationship_label} for c in contacts],
    }
    family = db.query(FamilyMember).filter(FamilyMember.user_id == user.id, FamilyMember.is_travelling.is_(True)).all()
    share_medical = settings.get("share_medical_in_sos", True)
    info["family"] = [
        {
            "name": f.full_name, "relationship": f.relationship_label, "phone": f.phone,
            **({"blood_group": f.blood_group, "allergies": f.allergies} if share_medical else {}),
        }
        for f in family
    ]
    medical = db.query(MedicalInfo).filter(MedicalInfo.user_id == user.id).first()
    if medical and share_medical:
        info["medical"] = {
            "blood_group": medical.blood_group, "allergies": medical.allergies, "conditions": medical.conditions,
        }
    return json.dumps(info)


def sos_out(sos: SOSRequest, db: Session, include_info: bool = True) -> dict:
    user = sos.user
    contact = (
        db.query(EmergencyContact).filter(EmergencyContact.user_id == sos.user_id)
        .order_by(EmergencyContact.is_primary.desc(), EmergencyContact.id).first()
    )
    out = {
        "id": sos.id,
        "user_id": sos.user_id,
        "tourist_name": user.full_name if user else None,
        "tourist_phone": user.phone if user else None,
        "trip_id": sos.trip_id,
        "trip_destination": sos.trip.destination if sos.trip else None,
        "latitude": sos.latitude,
        "longitude": sos.longitude,
        "location_label": sos.location_label,
        "status": sos.status,
        "message": sos.message,
        "admin_note": sos.admin_note,
        "created_at": iso(sos.created_at),
        "acknowledged_at": iso(sos.acknowledged_at),
        "resolved_at": iso(sos.resolved_at),
        "emergency_contact": (
            {"name": contact.name, "phone": contact.phone, "relationship": contact.relationship_label}
            if contact else None
        ),
    }
    if include_info and sos.emergency_info:
        out["emergency_info"] = json.loads(sos.emergency_info)
    return out
