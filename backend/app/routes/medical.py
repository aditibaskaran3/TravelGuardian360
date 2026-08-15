import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.auth.security import get_current_user
from app.database import get_db
from app.models.medical_id import MedicalID
from app.models.user import User
from app.schemas.medical import MedicalIDOut, MedicalIDPayload

router = APIRouter()


@router.get("/medical", response_model=MedicalIDOut | None)
def get_medical(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    medical = db.query(MedicalID).filter(MedicalID.user_id == current_user.id).first()
    if not medical:
        return None
    return {
        "id": medical.id,
        "user_id": medical.user_id,
        "bloodGroup": medical.blood_group,
        "allergies": (medical.allergies.split("||") if medical.allergies else []),
        "medicalConditions": (medical.medical_conditions.split("||") if medical.medical_conditions else []),
        "medications": (medical.medications.split("||") if medical.medications else []),
        "updatedAt": medical.updated_at.isoformat(),
    }


@router.post("/medical", response_model=MedicalIDOut)
def save_medical(payload: MedicalIDPayload, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    medical = db.query(MedicalID).filter(MedicalID.user_id == current_user.id).first()
    if not medical:
        medical = MedicalID(
            id=f"medical-{uuid.uuid4()}",
            user_id=current_user.id,
            blood_group=payload.bloodGroup,
            allergies="||".join(payload.allergies),
            medical_conditions="||".join(payload.medicalConditions),
            medications="||".join(payload.medications),
        )
        db.add(medical)
    else:
        medical.blood_group = payload.bloodGroup
        medical.allergies = "||".join(payload.allergies)
        medical.medical_conditions = "||".join(payload.medicalConditions)
        medical.medications = "||".join(payload.medications)

    db.commit()
    db.refresh(medical)
    return {
        "id": medical.id,
        "user_id": medical.user_id,
        "bloodGroup": medical.blood_group,
        "allergies": (medical.allergies.split("||") if medical.allergies else []),
        "medicalConditions": (medical.medical_conditions.split("||") if medical.medical_conditions else []),
        "medications": (medical.medications.split("||") if medical.medications else []),
        "updatedAt": medical.updated_at.isoformat(),
    }
