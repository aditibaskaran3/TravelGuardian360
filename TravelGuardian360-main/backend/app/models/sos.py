from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database.database import Base
from app.utils.time import utcnow


class SOSRequest(Base):
    __tablename__ = "sos_requests"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id", ondelete="SET NULL"))
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location_label = Column(String(200))
    # active | acknowledged | resolved
    status = Column(String(14), nullable=False, default="active", index=True)
    message = Column(Text)
    # What responders need, captured at the moment the request is raised.
    emergency_info = Column(Text)
    admin_note = Column(Text)
    created_at = Column(DateTime, nullable=False, default=utcnow, index=True)
    acknowledged_at = Column(DateTime)
    resolved_at = Column(DateTime)
    handled_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))

    user = relationship("User", back_populates="sos_requests", foreign_keys=[user_id])
    trip = relationship("Trip")
