from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models import Location, SOSRequest, Trip, User
from app.schemas.sos import SOSCreate
from app.services.geocode import reverse_geocode
from app.services.serializers import build_emergency_info, sos_out
from app.services.translate import get_lang, translate_text
from app.utils.deps import get_current_tourist
from app.utils.time import utcnow

router = APIRouter(prefix="/sos", tags=["SOS"])


def _own(db: Session, user: User, sos_id: int) -> SOSRequest:
    sos = db.query(SOSRequest).filter(SOSRequest.id == sos_id, SOSRequest.user_id == user.id).first()
    if not sos:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Emergency request not found.")
    return sos


@router.post("", status_code=status.HTTP_201_CREATED)
def raise_sos(payload: SOSCreate, user: User = Depends(get_current_tourist), db: Session = Depends(get_db)):
    open_request = db.query(SOSRequest).filter(SOSRequest.user_id == user.id, SOSRequest.status != "resolved").first()
    if open_request:
        # Pressing SOS twice must not create duplicate emergencies; return the one already open.
        return sos_out(open_request, db)
    trip = db.query(Trip).filter(Trip.user_id == user.id, Trip.status == "active").first()
    label = payload.location_label or reverse_geocode(db, payload.latitude, payload.longitude)
    sos = SOSRequest(
        user_id=user.id, trip_id=trip.id if trip else None, latitude=payload.latitude, longitude=payload.longitude,
        location_label=label, message=payload.message, status="active", emergency_info=build_emergency_info(db, user),
    )
    db.add(sos)
    # The emergency position also becomes the latest known position for monitoring.
    db.add(Location(
        user_id=user.id, trip_id=trip.id if trip else None, latitude=payload.latitude,
        longitude=payload.longitude, label=label, tracking_active=True,
    ))
    db.commit()
    db.refresh(sos)
    return sos_out(sos, db)


@router.get("")
def my_requests(user: User = Depends(get_current_tourist), db: Session = Depends(get_db)):
    rows = db.query(SOSRequest).filter(SOSRequest.user_id == user.id).order_by(SOSRequest.created_at.desc()).limit(20).all()
    return [sos_out(r, db, include_info=False) for r in rows]


@router.get("/current")
def current_request(user: User = Depends(get_current_tourist), db: Session = Depends(get_db), lang: str = Depends(get_lang)):
    sos = (
        db.query(SOSRequest).filter(SOSRequest.user_id == user.id, SOSRequest.status != "resolved")
        .order_by(SOSRequest.created_at.desc()).first()
    )
    if not sos:
        return None
    out = sos_out(sos, db)
    out["admin_note"] = translate_text(out["admin_note"], lang)
    return out


@router.put("/{sos_id}/cancel")
def cancel_sos(sos_id: int, user: User = Depends(get_current_tourist), db: Session = Depends(get_db)):
    """The tourist reports they are safe, which closes the request."""
    sos = _own(db, user, sos_id)
    if sos.status != "resolved":
        sos.status = "resolved"
        sos.resolved_at = utcnow()
        sos.admin_note = (sos.admin_note + " | " if sos.admin_note else "") + "Closed by the tourist: reported safe."
        db.commit()
    return sos_out(sos, db)
