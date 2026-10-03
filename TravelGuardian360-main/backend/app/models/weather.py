from sqlalchemy import Column, DateTime, Float, Integer, String

from app.database.database import Base
from app.utils.time import utcnow


class WeatherInfo(Base):
    """Latest observation per place, so the app keeps working when the provider is unreachable."""

    __tablename__ = "weather_info"

    id = Column(Integer, primary_key=True)
    place_key = Column(String(40), unique=True, index=True, nullable=False)
    location_name = Column(String(150), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    temperature = Column(Float, nullable=False)
    feels_like = Column(Float)
    condition = Column(String(60), nullable=False)
    icon = Column(String(20), nullable=False)
    humidity = Column(Integer)
    wind_speed = Column(Float)
    fetched_at = Column(DateTime, nullable=False, default=utcnow)
