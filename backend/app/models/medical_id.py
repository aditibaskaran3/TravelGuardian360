from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class MedicalID(Base):
    __tablename__ = "medical_ids"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), unique=True, nullable=False)
    blood_group = Column(String, nullable=True)
    allergies = Column(String, nullable=True)
    medical_conditions = Column(String, nullable=True)
    medications = Column(String, nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
