from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text

from app.database.database import Base
from app.utils.time import utcnow


class AuditLog(Base):
    """Records privileged reads, such as an administrator opening emergency medical details."""

    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True)
    admin_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    action = Column(String(60), nullable=False)
    target_user_id = Column(Integer)
    detail = Column(Text)
    created_at = Column(DateTime, nullable=False, default=utcnow)
