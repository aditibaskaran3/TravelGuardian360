from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database.database import Base
from app.utils.time import utcnow


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    # safety | weather | travel | emergency | trip | general
    type = Column(String(12), nullable=False, default="general", index=True)
    target_all = Column(Boolean, nullable=False, default=False)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    created_at = Column(DateTime, nullable=False, default=utcnow, index=True)

    recipients = relationship("NotificationRecipient", back_populates="notification", cascade="all, delete-orphan")


class NotificationRecipient(Base):
    __tablename__ = "notification_recipients"

    id = Column(Integer, primary_key=True)
    notification_id = Column(Integer, ForeignKey("notifications.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    is_read = Column(Boolean, nullable=False, default=False)
    read_at = Column(DateTime)

    notification = relationship("Notification", back_populates="recipients")
    user = relationship("User", back_populates="notifications")
