from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models import MedicalInfo, User
from app.schemas.medical import MedicalIn, MedicalOut
from app.utils.deps import get_current_tourist

router = APIRouter(prefix="/medical", tags=["Medical ID"])

EMPTY = {
    "blood_group": None, "allergies": None, "conditions": None, "medications": None,
    "notes": None, "emergency_contact": None, "updated_at": None,
}


@router.get("")
def get_medical(user: User = Depends(get_current_tourist), db: Session = Depends(get_db)):
    info = db.query(MedicalInfo).filter(MedicalInfo.user_id == user.id).first()
    return MedicalOut.model_validate(info).model_dump(mode="json") if info else EMPTY


@router.put("", response_model=MedicalOut)
def save_medical(payload: MedicalIn, user: User = Depends(get_current_tourist), db: Session = Depends(get_db)):
    info = db.query(MedicalInfo).filter(MedicalInfo.user_id == user.id).first()
    if info is None:
        info = MedicalInfo(user_id=user.id)
        db.add(info)
    for field, value in payload.model_dump().items():
        setattr(info, field, value)
    db.commit()
    db.refresh(info)
    return info
