from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models import Trip, User
from app.schemas.trip import TripCreate, TripOut, TripUpdate
from app.services.geocode import search_place
from app.utils.deps import get_current_tourist
from app.utils.time import utcnow

router = APIRouter(prefix="/trips", tags=["Trips"])


def _own_trip(db: Session, user: User, trip_id: int) -> Trip:
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.user_id == user.id).first()
    if not trip:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Trip not found.")
    return trip


def _active_trip(db: Session, user: User) -> Trip | None:
    return db.query(Trip).filter(Trip.user_id == user.id, Trip.status == "active").first()


def _locate(trip: Trip) -> None:
    """Best-effort coordinates for the destination so weather and safety can follow the trip."""
    if trip.destination_lat is None or trip.destination_lon is None:
        found = search_place(trip.destination)
        if found:
            trip.destination_lat, trip.destination_lon = found


def _activate(trip: Trip) -> None:
    trip.status = "active"
    trip.started_at = utcnow()
    trip.ended_at = None


@router.get("", response_model=list[TripOut])
def list_trips(
    status_filter: str | None = Query(default=None, alias="status", pattern="^(upcoming|active|completed)$"),
    user: User = Depends(get_current_tourist), db: Session = Depends(get_db),
):
    query = db.query(Trip).filter(Trip.user_id == user.id)
    if status_filter:
        query = query.filter(Trip.status == status_filter)
    return query.order_by(Trip.start_date.desc(), Trip.id.desc()).all()


@router.get("/active", response_model=TripOut | None)
def get_active_trip(user: User = Depends(get_current_tourist), db: Session = Depends(get_db)):
    return _active_trip(db, user)


@router.post("", response_model=TripOut, status_code=status.HTTP_201_CREATED)
def create_trip(payload: TripCreate, user: User = Depends(get_current_tourist), db: Session = Depends(get_db)):
    if payload.start_now and _active_trip(db, user):
        raise HTTPException(status.HTTP_409_CONFLICT, "You already have an active trip. End it before starting another.")
    trip = Trip(user_id=user.id, **payload.model_dump(exclude={"start_now"}))
    if payload.start_now:
        _activate(trip)
    _locate(trip)
    db.add(trip)
    db.commit()
    db.refresh(trip)
    return trip


@router.get("/{trip_id}", response_model=TripOut)
def get_trip(trip_id: int, user: User = Depends(get_current_tourist), db: Session = Depends(get_db)):
    return _own_trip(db, user, trip_id)


@router.put("/{trip_id}", response_model=TripOut)
def update_trip(trip_id: int, payload: TripUpdate, user: User = Depends(get_current_tourist), db: Session = Depends(get_db)):
    trip = _own_trip(db, user, trip_id)
    destination_changed = payload.destination != trip.destination
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(trip, field, value)
    if destination_changed and payload.destination_lat is None:
        trip.destination_lat = trip.destination_lon = None
    _locate(trip)
    db.commit()
    db.refresh(trip)
    return trip


@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trip(trip_id: int, user: User = Depends(get_current_tourist), db: Session = Depends(get_db)):
    db.delete(_own_trip(db, user, trip_id))
    db.commit()


@router.post("/{trip_id}/start", response_model=TripOut)
def start_trip(trip_id: int, user: User = Depends(get_current_tourist), db: Session = Depends(get_db)):
    trip = _own_trip(db, user, trip_id)
    if trip.status == "active":
        return trip
    if trip.status == "completed":
        raise HTTPException(status.HTTP_409_CONFLICT, "This trip has already been completed.")
    if _active_trip(db, user):
        raise HTTPException(status.HTTP_409_CONFLICT, "You already have an active trip. End it before starting another.")
    _activate(trip)
    db.commit()
    db.refresh(trip)
    return trip


@router.post("/{trip_id}/end", response_model=TripOut)
def end_trip(trip_id: int, user: User = Depends(get_current_tourist), db: Session = Depends(get_db)):
    trip = _own_trip(db, user, trip_id)
    if trip.status != "active":
        raise HTTPException(status.HTTP_409_CONFLICT, "Only an active trip can be ended.")
    trip.status = "completed"
    trip.ended_at = utcnow()
    db.commit()
    db.refresh(trip)
    return trip
