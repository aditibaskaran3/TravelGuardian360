from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models import Location, Trip, User
from app.schemas.location import LocationCreate, LocationOut
from app.services.geocode import reverse_geocode
from app.services.serializers import latest_location, location_out
from app.utils.deps import get_current_tourist, get_current_user

router = APIRouter(prefix="/locations", tags=["Locations"])


@router.post("", response_model=LocationOut, status_code=201)
def record_location(payload: LocationCreate, user: User = Depends(get_current_tourist), db: Session = Depends(get_db)):
    trip = db.query(Trip).filter(Trip.user_id == user.id, Trip.status == "active").first()
    label = payload.label or reverse_geocode(db, payload.latitude, payload.longitude)
    loc = Location(
        user_id=user.id, trip_id=trip.id if trip else None, latitude=payload.latitude,
        longitude=payload.longitude, accuracy=payload.accuracy, label=label, tracking_active=payload.tracking_active,
    )
    db.add(loc)
    db.commit()
    db.refresh(loc)
    return loc


@router.get("/latest")
def get_latest(user: User = Depends(get_current_tourist), db: Session = Depends(get_db)):
    return location_out(latest_location(db, user.id))


@router.get("/history", response_model=list[LocationOut])
def history(limit: int = Query(default=20, ge=1, le=200), user: User = Depends(get_current_tourist), db: Session = Depends(get_db)):
    return (
        db.query(Location).filter(Location.user_id == user.id)
        .order_by(Location.recorded_at.desc(), Location.id.desc()).limit(limit).all()
    )


@router.post("/tracking/stop")
def stop_tracking(user: User = Depends(get_current_tourist), db: Session = Depends(get_db)):
    last = latest_location(db, user.id)
    if last and last.tracking_active:
        db.add(Location(
            user_id=user.id, trip_id=last.trip_id, latitude=last.latitude, longitude=last.longitude,
            accuracy=last.accuracy, label=last.label, tracking_active=False,
        ))
        db.commit()
        last = latest_location(db, user.id)
    return location_out(last)


@router.get("/geocode")
def geocode(
    lat: float = Query(ge=-90, le=90), lon: float = Query(ge=-180, le=180),
    _user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    return {"label": reverse_geocode(db, lat, lon)}
