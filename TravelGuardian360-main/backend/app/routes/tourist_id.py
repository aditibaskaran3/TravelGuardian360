from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models import TouristID, User
from app.schemas.tourist_id import TouristIDUpdate
from app.services.serializers import tourist_id_out
from app.services.tourist_id import compute_record_hash, ensure_tourist_id
from app.utils.deps import get_current_tourist
from app.utils.time import utcnow

router = APIRouter(prefix="/tourist-id", tags=["Tourist ID"])


@router.get("/me")
def get_my_tourist_id(user: User = Depends(get_current_tourist), db: Session = Depends(get_db)):
    tid = ensure_tourist_id(db, user)
    db.commit()
    return tourist_id_out(user, tid, db)


@router.put("/me")
def update_my_tourist_id(payload: TouristIDUpdate, user: User = Depends(get_current_tourist), db: Session = Depends(get_db)):
    tid = ensure_tourist_id(db, user)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(tid, field, value)
    tid.record_hash = compute_record_hash(user, tid)
    # Changing identity details invalidates an earlier verification.
    tid.verification_status = "pending"
    tid.verified_at = None
    tid.verified_by = None
    db.commit()
    return tourist_id_out(user, tid, db)


@router.post("/me/verification-request")
def request_verification(user: User = Depends(get_current_tourist), db: Session = Depends(get_db)):
    tid = ensure_tourist_id(db, user)
    if tid.verification_status != "verified":
        tid.verification_requested_at = utcnow()
    db.commit()
    return tourist_id_out(user, tid, db)


@router.get("/verify/{id_number}")
def verify_tourist_id(id_number: str, db: Session = Depends(get_db)):
    """Target of the QR code. Returns only what a checkpoint needs to confirm an identity."""
    tid = db.query(TouristID).filter(TouristID.id_number == id_number).first()
    if not tid or not tid.user.is_active:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No Tourist ID matches this code.")
    return {
        "id_number": tid.id_number,
        "full_name": tid.user.full_name,
        "nationality": tid.nationality,
        "verification_status": tid.verification_status,
        "record_hash": tid.record_hash,
        "ledger_status": tid.ledger_status,
    }
