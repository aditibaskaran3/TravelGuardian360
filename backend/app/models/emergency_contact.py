from sqlalchemy import Column, String, Boolean, ForeignKey
from app.database import Base


class EmergencyContact(Base):
    __tablename__ = "emergency_contacts"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    relationship = Column(String, nullable=False)
    is_primary = Column(Boolean, default=False, nullable=False)
