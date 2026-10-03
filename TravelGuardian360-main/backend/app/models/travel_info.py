from sqlalchemy import Column, Integer, String, Text

from app.database.database import Base


class TravelInfo(Base):
    __tablename__ = "travel_info"

    id = Column(Integer, primary_key=True)
    # emergency | safety | tourist | help | travel
    category = Column(String(12), nullable=False, index=True)
    title = Column(String(150), nullable=False)
    content = Column(Text, nullable=False)
    phone = Column(String(30))
    destination = Column(String(100))
    sort_order = Column(Integer, nullable=False, default=0)
