from sqlalchemy import Boolean, Column, Date, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database.database import Base


class FamilyMember(Base):
    """A person travelling with the tourist (or whose details the tourist wants on file)."""

    __tablename__ = "family_members"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    full_name = Column(String(120), nullable=False)
    relationship_label = Column("relationship", String(60), nullable=False)
    date_of_birth = Column(Date)
    phone = Column(String(30))
    nationality = Column(String(80))
    passport_number = Column(String(40))
    blood_group = Column(String(5))
    allergies = Column(Text)
    medical_notes = Column(Text)
    is_travelling = Column(Boolean, nullable=False, default=True)

    user = relationship("User", back_populates="family_members")
