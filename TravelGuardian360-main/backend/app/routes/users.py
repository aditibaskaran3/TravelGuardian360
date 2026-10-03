import json

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models import EmergencyContact, FamilyMember, User
from app.schemas.auth import UserOut
from app.schemas.user import PasswordChange, ProfileUpdate, SettingsUpdate
from app.services.tourist_id import compute_record_hash, ensure_tourist_id
from app.utils.deps import get_current_tourist
from app.utils.security import hash_password, verify_password

router = APIRouter(prefix="/users", tags=["Users"])

DEFAULT_SETTINGS = {
    "safety_alerts": True, "weather_alerts": True, "travel_alerts": True, "trip_reminders": True,
    "share_location_with_admin": True, "share_medical_in_sos": True, "auto_location_updates": True,
    "high_accuracy_location": True, "sos_countdown": True, "notify_contacts_on_sos": True,
    "temperature_unit": "c",
}


def _settings(user: User) -> dict:
    return {**DEFAULT_SETTINGS, **json.loads(user.settings_json or "{}")}


@router.get("/me")
def get_profile(user: User = Depends(get_current_tourist), db: Session = Depends(get_db)):
    tid = ensure_tourist_id(db, user)
    db.commit()
    contact = (
        db.query(EmergencyContact).filter(EmergencyContact.user_id == user.id)
        .order_by(EmergencyContact.is_primary.desc(), EmergencyContact.id).first()
    )
    return {
        **UserOut.model_validate(user).model_dump(mode="json"),
        "tourist_id": tid.id_number,
        "family_count": db.query(FamilyMember).filter(FamilyMember.user_id == user.id).count(),
        "emergency_contact": (
            {"name": contact.name, "phone": contact.phone, "relationship": contact.relationship_label}
            if contact else None
        ),
    }


@router.put("/me")
def update_profile(payload: ProfileUpdate, user: User = Depends(get_current_tourist), db: Session = Depends(get_db)):
    data = payload.model_dump(exclude_unset=True)
    if data.get("email") and data["email"] != user.email:
        if db.query(User).filter(User.email == data["email"], User.id != user.id).first():
            raise HTTPException(status.HTTP_409_CONFLICT, "That email is already in use.")
    for field, value in data.items():
        if value is not None or field == "avatar_url":
            setattr(user, field, value)
    tid = ensure_tourist_id(db, user)
    tid.record_hash = compute_record_hash(user, tid)
    db.commit()
    db.refresh(user)
    return get_profile(user, db)


@router.put("/me/password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(payload: PasswordChange, user: User = Depends(get_current_tourist), db: Session = Depends(get_db)):
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Your current password is incorrect.")
    user.password_hash = hash_password(payload.new_password)
    db.commit()


@router.get("/me/settings")
def get_settings(user: User = Depends(get_current_tourist)):
    return _settings(user)


@router.put("/me/settings")
def update_settings(payload: SettingsUpdate, user: User = Depends(get_current_tourist), db: Session = Depends(get_db)):
    merged = {**_settings(user), **payload.model_dump(exclude_none=True)}
    user.settings_json = json.dumps(merged)
    db.commit()
    return merged
