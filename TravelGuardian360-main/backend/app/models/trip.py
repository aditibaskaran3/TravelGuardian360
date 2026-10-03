from sqlalchemy import Column, Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database.database import Base
from app.utils.time import utcnow


class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    destination = Column(String(150), nullable=False)
    destination_lat = Column(Float)
    destination_lon = Column(Float)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    # upcoming | active | completed
    status = Column(String(12), nullable=False, default="upcoming", index=True)
    accommodation = Column(String(200))
    transport = Column(String(200))
    notes = Column(Text)
    created_at = Column(DateTime, nullable=False, default=utcnow)
    started_at = Column(DateTime)
    ended_at = Column(DateTime)

    user = relationship("User", back_populates="trips")
