from sqlalchemy import Column, DateTime, Float, Integer, String, Text

from app.database.database import Base
from app.utils.time import utcnow


class SafetyZone(Base):
    __tablename__ = "safety_zones"

    id = Column(Integer, primary_key=True)
    name = Column(String(150), nullable=False)
    city = Column(String(100))
    # safe | caution | high_risk
    zone_type = Column(String(12), nullable=False, index=True)
    # 0-100, higher is safer
    safety_level = Column(Integer, nullable=False)
    description = Column(Text)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    radius_m = Column(Integer, nullable=False, default=500)
    updated_at = Column(DateTime, nullable=False, default=utcnow, onupdate=utcnow)
