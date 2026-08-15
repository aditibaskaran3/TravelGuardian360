import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.auth.security import get_current_user
from app.database import get_db
from app.models.sos_event import SOSEvent
from app.models.user import User
from app.schemas.sos import SOSEventCreate, SOSEventOut

router = APIRouter()


@router.post("/sos", response_model=SOSEventOut)
def create_sos(payload: SOSEventCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    event = SOSEvent(
        id=f"sos-{uuid.uuid4()}",
        user_id=current_user.id,
        timestamp=datetime.utcnow(),
        latitude=(payload.coordinates or {}).get("latitude") if payload.coordinates else None,
        longitude=(payload.coordinates or {}).get("longitude") if payload.coordinates else None,
        contact_name=payload.contactName or current_user.emergency_contact_name,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return {
        "id": event.id,
        "user_id": event.user_id,
        "timestamp": event.timestamp.isoformat(),
        "latitude": event.latitude,
        "longitude": event.longitude,
        "contactName": event.contact_name,
    }


@router.get("/sos", response_model=list[SOSEventOut])
def list_sos(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    events = db.query(SOSEvent).filter(SOSEvent.user_id == current_user.id).order_by(SOSEvent.timestamp.desc()).all()
    return [
        {
            "id": event.id,
            "user_id": event.user_id,
            "timestamp": event.timestamp.isoformat(),
            "latitude": event.latitude,
            "longitude": event.longitude,
            "contactName": event.contact_name,
        }
        for event in events
    ]
