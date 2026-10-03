from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database.database import Base
from app.utils.time import utcnow


class MedicalInfo(Base):
    __tablename__ = "medical_info"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    blood_group = Column(String(5))
    allergies = Column(Text)
    conditions = Column(Text)
    medications = Column(Text)
    notes = Column(Text)
    emergency_contact = Column(String(200))
    updated_at = Column(DateTime, nullable=False, default=utcnow, onupdate=utcnow)

    user = relationship("User", back_populates="medical")
