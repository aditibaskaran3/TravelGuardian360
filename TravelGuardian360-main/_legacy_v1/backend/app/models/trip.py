from sqlalchemy import Column, String, DateTime, Boolean
from sqlalchemy.sql import func
from app.database import Base


class Trip(Base):
    __tablename__ = "trips"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, nullable=False, index=True)
    status = Column(String, nullable=False, default="active")
    started_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
