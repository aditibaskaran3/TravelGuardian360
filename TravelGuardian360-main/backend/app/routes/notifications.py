from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models import Notification, NotificationRecipient, User
from app.services.serializers import iso
from app.services.translate import get_lang, localize_fields
from app.utils.deps import get_current_tourist
from app.utils.time import utcnow

router = APIRouter(prefix="/notifications", tags=["Notifications"])

# Maps a notification type to the preference that can silence it.
PREFERENCE_FOR_TYPE = {"safety": "safety_alerts", "weather": "weather_alerts", "travel": "travel_alerts", "trip": "trip_reminders"}


def _out(recipient: NotificationRecipient) -> dict:
    n = recipient.notification
    return {
        "id": recipient.id, "title": n.title, "message": n.message, "type": n.type,
        "is_read": recipient.is_read, "created_at": iso(n.created_at),
    }


def _visible(db: Session, user: User):
    import json
    prefs = json.loads(user.settings_json or "{}")
    muted = [t for t, key in PREFERENCE_FOR_TYPE.items() if prefs.get(key) is False]
    query = (
        db.query(NotificationRecipient).join(Notification)
        .filter(NotificationRecipient.user_id == user.id)
    )
    if muted:
        query = query.filter(Notification.type.notin_(muted))
    return query


@router.get("")
def list_notifications(
    limit: int = Query(default=50, ge=1, le=200), unread_only: bool = False,
    user: User = Depends(get_current_tourist), db: Session = Depends(get_db), lang: str = Depends(get_lang),
):
    query = _visible(db, user)
    if unread_only:
        query = query.filter(NotificationRecipient.is_read.is_(False))
    rows = query.order_by(Notification.created_at.desc(), NotificationRecipient.id.desc()).limit(limit).all()
    return localize_fields([_out(r) for r in rows], ["title", "message"], lang)


@router.get("/unread-count")
def unread_count(user: User = Depends(get_current_tourist), db: Session = Depends(get_db)):
    return {"count": _visible(db, user).filter(NotificationRecipient.is_read.is_(False)).count()}


@router.put("/read-all", status_code=status.HTTP_204_NO_CONTENT)
def mark_all_read(user: User = Depends(get_current_tourist), db: Session = Depends(get_db)):
    db.query(NotificationRecipient).filter(
        NotificationRecipient.user_id == user.id, NotificationRecipient.is_read.is_(False)
    ).update({"is_read": True, "read_at": utcnow()})
    db.commit()


@router.put("/{recipient_id}/read")
def mark_read(recipient_id: int, user: User = Depends(get_current_tourist), db: Session = Depends(get_db)):
    recipient = db.query(NotificationRecipient).filter(
        NotificationRecipient.id == recipient_id, NotificationRecipient.user_id == user.id
    ).first()
    if not recipient:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Notification not found.")
    recipient.is_read, recipient.read_at = True, utcnow()
    db.commit()
    return _out(recipient)
