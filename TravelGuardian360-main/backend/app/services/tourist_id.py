import hashlib
import secrets

from sqlalchemy.orm import Session

from app.models import TouristID, User


def compute_record_hash(user: User, tid: TouristID) -> str:
    """Digest of the identity fields that a verification layer would attest to."""
    payload = "|".join([
        tid.id_number, user.full_name, user.email, tid.nationality or "",
        tid.date_of_birth.isoformat() if tid.date_of_birth else "", tid.passport_number or "",
    ])
    return hashlib.sha256(payload.encode()).hexdigest()


def _new_id_number(db: Session) -> str:
    while True:
        number = "TG360-" + "".join(secrets.choice("ABCDEFGHJKLMNPQRSTUVWXYZ23456789") for _ in range(8))
        if not db.query(TouristID).filter(TouristID.id_number == number).first():
            return number


def ensure_tourist_id(db: Session, user: User) -> TouristID:
    tid = db.query(TouristID).filter(TouristID.user_id == user.id).first()
    if tid:
        return tid
    tid = TouristID(user_id=user.id, id_number=_new_id_number(db), record_hash="")
    db.add(tid)
    db.flush()
    tid.record_hash = compute_record_hash(user, tid)
    return tid
