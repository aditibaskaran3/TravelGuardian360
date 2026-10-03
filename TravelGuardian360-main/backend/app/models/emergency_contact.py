from sqlalchemy import Boolean, Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database.database import Base


class EmergencyContact(Base):
    __tablename__ = "emergency_contacts"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(120), nullable=False)
    phone = Column(String(30), nullable=False)
    relationship_label = Column("relationship", String(60), nullable=False)
    is_primary = Column(Boolean, nullable=False, default=False)

    user = relationship("User", back_populates="contacts")
