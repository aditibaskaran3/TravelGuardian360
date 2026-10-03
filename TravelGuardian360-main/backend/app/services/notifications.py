from sqlalchemy.orm import Session

from app.models import Notification, NotificationRecipient, User


def send_notification(
    db: Session, title: str, message: str, type_: str = "general",
    user_ids: list[int] | None = None, created_by: int | None = None,
) -> Notification:
    """Create a notification for specific users, or for every active tourist when user_ids is None."""
    if user_ids is None:
        recipients = [u.id for u in db.query(User.id).filter(User.role == "user", User.is_active.is_(True)).all()]
        target_all = True
    else:
        valid = db.query(User.id).filter(User.id.in_(user_ids), User.role == "user").all()
        recipients = [row.id for row in valid]
        target_all = False
    notification = Notification(title=title, message=message, type=type_, target_all=target_all, created_by=created_by)
    notification.recipients = [NotificationRecipient(user_id=uid) for uid in recipients]
    db.add(notification)
    return notification
