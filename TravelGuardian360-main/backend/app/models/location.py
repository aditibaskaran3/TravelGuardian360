from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database.database import Base
from app.utils.time import utcnow


class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id", ondelete="SET NULL"))
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    accuracy = Column(Float)
    label = Column(String(200))
    tracking_active = Column(Boolean, nullable=False, default=True)
    recorded_at = Column(DateTime, nullable=False, default=utcnow, index=True)

    user = relationship("User", back_populates="locations")
