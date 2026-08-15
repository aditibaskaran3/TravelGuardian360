import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.auth.security import get_current_user
from app.database import get_db
from app.models.trip import Trip
from app.models.user import User

router = APIRouter()


@router.get("/trip")
def get_current_trip(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    trip = db.query(Trip).filter(Trip.user_id == current_user.id, Trip.is_active == True).order_by(Trip.created_at.desc()).first()
    if not trip:
        return {"trip": None, "status": "idle"}
    return {
        "trip": {
            "id": trip.id,
            "user_id": trip.user_id,
            "status": trip.status,
            "startedAt": trip.started_at.isoformat(),
            "endedAt": trip.ended_at.isoformat() if trip.ended_at else None,
            "isActive": trip.is_active,
        },
        "status": trip.status,
    }


@router.post("/trip/start")
def start_trip(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    active_trip = db.query(Trip).filter(Trip.user_id == current_user.id, Trip.is_active == True).first()
    if active_trip:
        return {"trip": {"id": active_trip.id, "status": active_trip.status}, "status": "active"}

    trip = Trip(
        id=f"trip-{uuid.uuid4()}",
        user_id=current_user.id,
        status="active",
        is_active=True,
    )
    db.add(trip)
    db.commit()
    db.refresh(trip)
    return {"trip": {"id": trip.id, "status": trip.status}, "status": "active"}


@router.post("/trip/end")
def end_trip(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    trip = db.query(Trip).filter(Trip.user_id == current_user.id, Trip.is_active == True).order_by(Trip.created_at.desc()).first()
    if not trip:
        return {"trip": None, "status": "idle"}

    trip.status = "idle"
    trip.is_active = False
    trip.ended_at = datetime.utcnow()
    db.commit()
    return {"trip": {"id": trip.id, "status": trip.status}, "status": "idle"}
