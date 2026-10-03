from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database.database import Base


class TouristID(Base):
    __tablename__ = "tourist_ids"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    id_number = Column(String(24), unique=True, index=True, nullable=False)
    nationality = Column(String(80))
    date_of_birth = Column(Date)
    passport_number = Column(String(40))
    # pending | verified
    verification_status = Column(String(12), nullable=False, default="pending")
    verification_requested_at = Column(DateTime)
    verified_at = Column(DateTime)
    verified_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    # Digest of the identity record; a ledger-based verifier can anchor this value.
    record_hash = Column(String(64), nullable=False)
    # Stays "not_connected" until a ledger integration exists.
    ledger_status = Column(String(20), nullable=False, default="not_connected")
    ledger_reference = Column(String(120))

    user = relationship("User", back_populates="tourist_id", foreign_keys=[user_id])
