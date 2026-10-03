from sqlalchemy import Column, DateTime, Integer, String, Text, UniqueConstraint

from app.database.database import Base
from app.utils.time import utcnow


class Translation(Base):
    """Cache of translated server-side text (notifications, safety zones, travel information, messages)."""

    __tablename__ = "translations"
    __table_args__ = (UniqueConstraint("lang", "source_hash", name="uq_translation_lang_source"),)

    id = Column(Integer, primary_key=True)
    lang = Column(String(8), nullable=False, index=True)
    source_hash = Column(String(40), nullable=False)
    source = Column(Text, nullable=False)
    text = Column(Text, nullable=False)
    created_at = Column(DateTime, nullable=False, default=utcnow)
