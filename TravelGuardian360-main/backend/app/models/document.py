from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database.database import Base
from app.utils.time import utcnow


class TravelDocument(Base):
    """A named/numbered travel document kept for quick reference, with an optional attached file."""

    __tablename__ = "travel_documents"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    # Null family_member_id means the document belongs to the tourist themself ("Myself").
    family_member_id = Column(Integer, ForeignKey("family_members.id", ondelete="CASCADE"), nullable=True, index=True)
    document_name = Column(String(120))
    document_number = Column(String(80))
    # Stored filename on disk (uuid-based); original_filename/content_type are kept for display and download.
    file_path = Column(String(255), nullable=True)
    file_name = Column(String(255), nullable=True)
    file_type = Column(String(100), nullable=True)
    created_at = Column(DateTime, nullable=False, default=utcnow)
    updated_at = Column(DateTime, nullable=False, default=utcnow, onupdate=utcnow)

    user = relationship("User", back_populates="documents")
    family_member = relationship("FamilyMember")
