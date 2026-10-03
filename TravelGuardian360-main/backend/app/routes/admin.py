"""Administrator API. Every route except /admin/login depends on require_admin, which checks the role in the database."""
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models import (
    AuditLog, EmergencyContact, FamilyMember, Location, MedicalInfo, Notification, NotificationRecipient,
    SafetyZone, SOSRequest, TouristID, Trip, User,
)
from app.schemas.admin import AdminUserUpdate, BulkVerification, TouristVerification
from app.schemas.auth import LoginRequest, TokenResponse, UserOut
from app.schemas.notification import NotificationEdit, NotificationIn
from app.schemas.safety_zone import ZoneIn, ZoneOut
from app.schemas.sos import SOSStatusUpdate
from app.schemas.user import PasswordChange
from app.services.notifications import send_notification
from app.services.serializers import iso, latest_location, location_out, location_status, sos_out
from app.services.tourist_id import compute_record_hash, ensure_tourist_id
from app.utils.deps import require_admin
from app.utils.security import create_access_token, hash_password, verify_password
from app.utils.time import utcnow

router = APIRouter(prefix="/admin", tags=["Admin"])


# ----------------------------------------------------------------------------- helpers

def _tourist_or_404(db: Session, user_id: int) -> User:
    user = db.get(User, user_id)
    if not user or user.role != "user":
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found.")
    return user


def _trip_dict(trip: Trip, include_tourist: bool = True) -> dict:
    out = {
        "id": trip.id, "destination": trip.destination, "start_date": trip.start_date.isoformat(),
        "end_date": trip.end_date.isoformat(), "status": trip.status, "accommodation": trip.accommodation,
        "transport": trip.transport, "notes": trip.notes,
    }
    if include_tourist:
        out.update({"user_id": trip.user_id, "tourist_name": trip.user.full_name, "tourist_email": trip.user.email})
    return out


def _user_row(db: Session, user: User) -> dict:
    tid = user.tourist_id
    trip = db.query(Trip).filter(Trip.user_id == user.id, Trip.status == "active").first()
    loc = latest_location(db, user.id)
    return {
        **UserOut.model_validate(user).model_dump(mode="json"),
        "tourist_id": tid.id_number if tid else None,
        "verification_status": tid.verification_status if tid else None,
        "current_trip": trip.destination if trip else None,
        "last_location": location_out(loc),
    }


def _audit(db: Session, admin: User, action: str, target: int | None = None, detail: str | None = None) -> None:
    db.add(AuditLog(admin_id=admin.id, action=action, target_user_id=target, detail=detail))


# ----------------------------------------------------------------------------- authentication

@router.post("/login", response_model=TokenResponse)
def admin_login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect email or password.")
    if user.role != "admin":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "This account does not have administrator access.")
    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "This account has been deactivated.")
    user.last_login_at = utcnow()
    db.commit()
    return TokenResponse(access_token=create_access_token(user.id, user.role), user=UserOut.model_validate(user))


@router.put("/password", status_code=status.HTTP_204_NO_CONTENT)
def change_admin_password(payload: PasswordChange, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    if not verify_password(payload.current_password, admin.password_hash):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Your current password is incorrect.")
    admin.password_hash = hash_password(payload.new_password)
    _audit(db, admin, "password_changed")
    db.commit()


# ----------------------------------------------------------------------------- dashboard

@router.get("/dashboard")
def dashboard(_admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    now = utcnow()
    tourists = db.query(User).filter(User.role == "user")
    week_ago = now - timedelta(days=7)

    registrations = []
    for offset in range(6, -1, -1):
        day = (now - timedelta(days=offset)).date()
        count = tourists.filter(func.date(User.created_at) == day.isoformat()).count()
        registrations.append({"date": day.isoformat(), "count": count})

    def count_by(model, column):
        return {key: n for key, n in db.query(column, func.count()).select_from(model).group_by(column).all()}

    sos_counts = count_by(SOSRequest, SOSRequest.status)
    trip_counts = count_by(Trip, Trip.status)
    zone_counts = count_by(SafetyZone, SafetyZone.zone_type)
    recent_sos = db.query(SOSRequest).order_by(SOSRequest.created_at.desc()).limit(5).all()
    recent_users = tourists.order_by(User.created_at.desc()).limit(5).all()

    return {
        "total_users": tourists.count(),
        "active_users": tourists.filter(User.is_active.is_(True), User.last_login_at >= week_ago).count(),
        "active_trips": trip_counts.get("active", 0),
        "sos_requests": sum(sos_counts.values()),
        "registered_tourists": db.query(TouristID).count(),
        "pending_verifications": db.query(TouristID).filter(
            TouristID.verification_status == "pending", TouristID.verification_requested_at.isnot(None)
        ).count(),
        "verified_tourists": db.query(TouristID).filter(TouristID.verification_status == "verified").count(),
        "emergency_alerts": sos_counts.get("active", 0) + sos_counts.get("acknowledged", 0),
        "safety_zones": sum(zone_counts.values()),
        "tracking_now": sum(
            1 for u in tourists.all()
            if location_status(latest_location(db, u.id)) == "live"
        ),
        "registrations": registrations,
        "trips_by_status": {s: trip_counts.get(s, 0) for s in ("upcoming", "active", "completed")},
        "sos_by_status": {s: sos_counts.get(s, 0) for s in ("active", "acknowledged", "resolved")},
        "zones_by_type": {t: zone_counts.get(t, 0) for t in ("safe", "caution", "high_risk")},
        "recent_sos": [sos_out(s, db, include_info=False) for s in recent_sos],
        "recent_users": [_user_row(db, u) for u in recent_users],
    }


# ----------------------------------------------------------------------------- users

@router.get("/users")
def list_users(
    q: str | None = None,
    account: str | None = Query(default=None, pattern="^(active|inactive)$"),
    _admin: User = Depends(require_admin), db: Session = Depends(get_db),
):
    query = db.query(User).outerjoin(TouristID, TouristID.user_id == User.id).filter(User.role == "user")
    if q:
        like = f"%{q.strip()}%"
        query = query.filter(or_(
            User.full_name.ilike(like), User.email.ilike(like), User.phone.ilike(like), TouristID.id_number.ilike(like),
        ))
    if account:
        query = query.filter(User.is_active.is_(account == "active"))
    return [_user_row(db, u) for u in query.order_by(User.created_at.desc()).all()]


@router.get("/users/{user_id}")
def get_user(user_id: int, _admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    user = _tourist_or_404(db, user_id)
    contacts = db.query(EmergencyContact).filter(EmergencyContact.user_id == user.id).all()
    trips = db.query(Trip).filter(Trip.user_id == user.id).order_by(Trip.start_date.desc()).all()
    sos = db.query(SOSRequest).filter(SOSRequest.user_id == user.id).order_by(SOSRequest.created_at.desc()).limit(10).all()
    return {
        **_user_row(db, user),
        "contacts": [{"id": c.id, "name": c.name, "phone": c.phone, "relationship": c.relationship_label} for c in contacts],
        "trips": [_trip_dict(t, include_tourist=False) for t in trips],
        "sos_history": [sos_out(s, db, include_info=False) for s in sos],
        "family": [
            {"id": f.id, "full_name": f.full_name, "relationship": f.relationship_label, "phone": f.phone,
             "is_travelling": f.is_travelling, "date_of_birth": f.date_of_birth.isoformat() if f.date_of_birth else None}
            for f in db.query(FamilyMember).filter(FamilyMember.user_id == user.id).order_by(FamilyMember.id).all()
        ],
        "has_medical_record": db.query(MedicalInfo).filter(MedicalInfo.user_id == user.id).count() > 0,
    }


@router.put("/users/{user_id}")
def update_user(user_id: int, payload: AdminUserUpdate, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    user = _tourist_or_404(db, user_id)
    data = payload.model_dump(exclude_unset=True)
    if data.get("email") and data["email"] != user.email:
        if db.query(User).filter(User.email == data["email"], User.id != user.id).first():
            raise HTTPException(status.HTTP_409_CONFLICT, "That email is already in use.")
    for field, value in data.items():
        if value is not None:
            setattr(user, field, value)
    if "is_active" in data:
        _audit(db, admin, "account_reactivated" if user.is_active else "account_deactivated", user.id)
    tid = ensure_tourist_id(db, user)
    tid.record_hash = compute_record_hash(user, tid)
    db.commit()
    db.refresh(user)
    return _user_row(db, user)


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    user = _tourist_or_404(db, user_id)
    _audit(db, admin, "account_deleted", user.id, user.email)
    db.delete(user)
    db.commit()


@router.get("/users/{user_id}/emergency-medical")
def emergency_medical(user_id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    """Medical details are released only while the tourist has an unresolved SOS, and every read is logged."""
    user = _tourist_or_404(db, user_id)
    open_sos = db.query(SOSRequest).filter(SOSRequest.user_id == user.id, SOSRequest.status != "resolved").first()
    if not open_sos:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "Medical details are only available to administrators while an emergency request is open.",
        )
    info = db.query(MedicalInfo).filter(MedicalInfo.user_id == user.id).first()
    _audit(db, admin, "emergency_medical_viewed", user.id, f"SOS #{open_sos.id}")
    db.commit()
    return {
        "user_id": user.id,
        "blood_group": info.blood_group if info else None,
        "allergies": info.allergies if info else None,
        "conditions": info.conditions if info else None,
    }


@router.get("/audit-logs")
def audit_logs(_admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    rows = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(50).all()
    names = {u.id: u.full_name for u in db.query(User).filter(User.id.in_({r.admin_id for r in rows if r.admin_id} | {r.target_user_id for r in rows if r.target_user_id})).all()}
    return [
        {"id": r.id, "action": r.action, "admin": names.get(r.admin_id), "target": names.get(r.target_user_id),
         "detail": r.detail, "created_at": iso(r.created_at)}
        for r in rows
    ]


# ----------------------------------------------------------------------------- tourists

@router.get("/tourists")
def list_tourists(
    q: str | None = None,
    verification: str | None = Query(default=None, pattern="^(pending|verified)$"),
    _admin: User = Depends(require_admin), db: Session = Depends(get_db),
):
    query = db.query(User).join(TouristID, TouristID.user_id == User.id).filter(User.role == "user")
    if q:
        like = f"%{q.strip()}%"
        query = query.filter(or_(User.full_name.ilike(like), User.email.ilike(like), TouristID.id_number.ilike(like)))
    if verification:
        query = query.filter(TouristID.verification_status == verification)
    rows = []
    # Open verification requests come first so they are not missed.
    ordered = query.order_by(
        (TouristID.verification_status == "verified").asc(), TouristID.verification_requested_at.is_(None).asc(), User.created_at.desc()
    )
    for user in ordered.all():
        tid = user.tourist_id
        trip = db.query(Trip).filter(Trip.user_id == user.id, Trip.status == "active").first()
        upcoming = db.query(Trip).filter(Trip.user_id == user.id, Trip.status == "upcoming").order_by(Trip.start_date).first()
        contacts = db.query(EmergencyContact).filter(EmergencyContact.user_id == user.id).order_by(EmergencyContact.is_primary.desc()).all()
        rows.append({
            "user_id": user.id, "full_name": user.full_name, "email": user.email, "phone": user.phone,
            "is_active": user.is_active, "tourist_id": tid.id_number, "nationality": tid.nationality,
            "verification_status": tid.verification_status, "verification_requested": tid.verification_requested_at is not None,
            "verified_at": iso(tid.verified_at), "record_hash": tid.record_hash, "ledger_status": tid.ledger_status,
            "trip": _trip_dict(trip, include_tourist=False) if trip else (_trip_dict(upcoming, include_tourist=False) if upcoming else None),
            "emergency_contacts": [{"name": c.name, "phone": c.phone, "relationship": c.relationship_label} for c in contacts],
        })
    return rows


@router.post("/tourists/verify-requested")
def verify_all_requested(payload: BulkVerification | None = None, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    """Approve open verification requests in bulk: the selected tourists, or all of them. Each approval is notified and logged."""
    query = (
        db.query(TouristID).join(User, User.id == TouristID.user_id)
        .filter(TouristID.verification_status == "pending", TouristID.verification_requested_at.isnot(None), User.is_active.is_(True))
    )
    if payload and payload.user_ids is not None:
        query = query.filter(TouristID.user_id.in_(payload.user_ids))
    pending = query.all()
    for tid in pending:
        tid.verification_status, tid.verified_at, tid.verified_by = "verified", utcnow(), admin.id
        send_notification(db, "Tourist ID verified", "Your Tourist ID has been verified by TravelGuardian360.", "general", [tid.user_id], admin.id)
    _audit(db, admin, "tourist_ids_bulk_verified", None, f"{len(pending)} requests")
    db.commit()
    return {"verified": len(pending)}


@router.put("/tourists/{user_id}/verification")
def set_verification(user_id: int, payload: TouristVerification, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    user = _tourist_or_404(db, user_id)
    tid = ensure_tourist_id(db, user)
    if payload.verified:
        tid.verification_status, tid.verified_at, tid.verified_by = "verified", utcnow(), admin.id
        send_notification(db, "Tourist ID verified", "Your Tourist ID has been verified by TravelGuardian360.", "general", [user.id], admin.id)
    else:
        tid.verification_status, tid.verified_at, tid.verified_by = "pending", None, None
    _audit(db, admin, "tourist_id_verified" if payload.verified else "tourist_id_unverified", user.id)
    db.commit()
    return {"user_id": user.id, "tourist_id": tid.id_number, "verification_status": tid.verification_status}


# ----------------------------------------------------------------------------- trips & locations

@router.get("/trips")
def list_trips(
    trip_status: str | None = Query(default=None, alias="status", pattern="^(upcoming|active|completed)$"),
    q: str | None = None,
    _admin: User = Depends(require_admin), db: Session = Depends(get_db),
):
    query = db.query(Trip).join(User, User.id == Trip.user_id)
    if trip_status:
        query = query.filter(Trip.status == trip_status)
    if q:
        like = f"%{q.strip()}%"
        query = query.filter(or_(Trip.destination.ilike(like), User.full_name.ilike(like)))
    out = []
    for trip in query.order_by(Trip.start_date.desc()).all():
        row = _trip_dict(trip)
        row["current_location"] = location_out(latest_location(db, trip.user_id)) if trip.status == "active" else None
        out.append(row)
    return out


@router.get("/locations")
def list_locations(
    tracking: str | None = Query(default=None, pattern="^(live|stale|paused)$"),
    _admin: User = Depends(require_admin), db: Session = Depends(get_db),
):
    rows = []
    for user in db.query(User).filter(User.role == "user", User.is_active.is_(True)).all():
        loc = latest_location(db, user.id)
        if loc is None:
            continue
        info = location_out(loc)
        if tracking and info["status"] != tracking:
            continue
        trip = db.query(Trip).filter(Trip.user_id == user.id, Trip.status == "active").first()
        has_sos = db.query(SOSRequest).filter(SOSRequest.user_id == user.id, SOSRequest.status != "resolved").count() > 0
        rows.append({"user_id": user.id, "tourist_name": user.full_name, "trip": trip.destination if trip else None, "has_active_sos": has_sos, **info})
    rows.sort(key=lambda r: r["recorded_at"], reverse=True)
    return rows


# ----------------------------------------------------------------------------- SOS

@router.get("/sos")
def list_sos(
    sos_status: str | None = Query(default=None, alias="status", pattern="^(active|acknowledged|resolved)$"),
    _admin: User = Depends(require_admin), db: Session = Depends(get_db),
):
    query = db.query(SOSRequest)
    if sos_status:
        query = query.filter(SOSRequest.status == sos_status)
    return [sos_out(s, db, include_info=False) for s in query.order_by(SOSRequest.created_at.desc()).all()]


@router.get("/sos/{sos_id}")
def get_sos(sos_id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    sos = db.get(SOSRequest, sos_id)
    if not sos:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Emergency request not found.")
    out = sos_out(sos, db)
    if sos.status == "resolved":
        # Once an emergency is closed, medical details are no longer shown.
        out.get("emergency_info", {}).pop("medical", None)
    elif out.get("emergency_info", {}).get("medical"):
        _audit(db, admin, "emergency_medical_viewed", sos.user_id, f"SOS #{sos.id}")
        db.commit()
    return out


@router.put("/sos/{sos_id}")
def update_sos(sos_id: int, payload: SOSStatusUpdate, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    sos = db.get(SOSRequest, sos_id)
    if not sos:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Emergency request not found.")
    previous = sos.status
    sos.status = payload.status
    if payload.admin_note is not None:
        sos.admin_note = payload.admin_note or None
    now = utcnow()
    if payload.status == "acknowledged":
        sos.acknowledged_at, sos.handled_by, sos.resolved_at = sos.acknowledged_at or now, admin.id, None
    elif payload.status == "resolved":
        sos.acknowledged_at = sos.acknowledged_at or now
        sos.resolved_at, sos.handled_by = now, admin.id
    else:
        sos.acknowledged_at = sos.resolved_at = None
    if previous != payload.status and payload.status != "active":
        text = {
            "acknowledged": "Your emergency request has been acknowledged. Help is being coordinated.",
            "resolved": "Your emergency request has been marked as resolved. Stay safe.",
        }[payload.status]
        send_notification(db, "Emergency update", text, "emergency", [sos.user_id], admin.id)
    db.commit()
    db.refresh(sos)
    return sos_out(sos, db)


# ----------------------------------------------------------------------------- safety zones

@router.get("/safety-zones", response_model=list[ZoneOut])
def list_zones(_admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    return db.query(SafetyZone).order_by(SafetyZone.city, SafetyZone.name).all()


@router.post("/safety-zones", response_model=ZoneOut, status_code=status.HTTP_201_CREATED)
def create_zone(payload: ZoneIn, _admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    zone = SafetyZone(**payload.model_dump())
    db.add(zone)
    db.commit()
    db.refresh(zone)
    return zone


@router.put("/safety-zones/{zone_id}", response_model=ZoneOut)
def update_zone(zone_id: int, payload: ZoneIn, _admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    zone = db.get(SafetyZone, zone_id)
    if not zone:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Safety zone not found.")
    for field, value in payload.model_dump().items():
        setattr(zone, field, value)
    db.commit()
    db.refresh(zone)
    return zone


@router.delete("/safety-zones/{zone_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_zone(zone_id: int, _admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    zone = db.get(SafetyZone, zone_id)
    if not zone:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Safety zone not found.")
    db.delete(zone)
    db.commit()


# ----------------------------------------------------------------------------- notifications

def _notification_row(n: Notification) -> dict:
    return {
        "id": n.id, "title": n.title, "message": n.message, "type": n.type, "target_all": n.target_all,
        "recipient_count": len(n.recipients), "read_count": sum(1 for r in n.recipients if r.is_read),
        "recipients": [r.user.full_name for r in n.recipients[:5]] if not n.target_all else [],
        "created_at": iso(n.created_at),
    }


@router.get("/notifications")
def list_notifications(_admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    return [_notification_row(n) for n in db.query(Notification).order_by(Notification.created_at.desc()).all()]


@router.post("/notifications", status_code=status.HTTP_201_CREATED)
def create_notification(payload: NotificationIn, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    if not payload.target_all and not payload.target_user_ids:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Select at least one recipient.")
    notification = send_notification(
        db, payload.title, payload.message, payload.type,
        None if payload.target_all else payload.target_user_ids, admin.id,
    )
    db.commit()
    db.refresh(notification)
    return _notification_row(notification)


@router.put("/notifications/{notification_id}")
def update_notification(notification_id: int, payload: NotificationEdit, _admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    notification = db.get(Notification, notification_id)
    if not notification:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Notification not found.")
    notification.title, notification.message, notification.type = payload.title, payload.message, payload.type
    db.commit()
    db.refresh(notification)
    return _notification_row(notification)


@router.delete("/notifications/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notification(notification_id: int, _admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    notification = db.get(Notification, notification_id)
    if not notification:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Notification not found.")
    db.delete(notification)
    db.commit()
