from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database.database import Base
from app.utils.time import utcnow


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(30), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(10), nullable=False, default="user", index=True)
    is_active = Column(Boolean, nullable=False, default=True)
    avatar_url = Column(String(500))
    settings_json = Column(Text, nullable=False, default="{}")
    created_at = Column(DateTime, nullable=False, default=utcnow)
    last_login_at = Column(DateTime)

    tourist_id = relationship(
        "TouristID", back_populates="user", uselist=False, cascade="all, delete-orphan",
        foreign_keys="TouristID.user_id",
    )
    trips = relationship("Trip", back_populates="user", cascade="all, delete-orphan")
    locations = relationship("Location", back_populates="user", cascade="all, delete-orphan")
    contacts = relationship("EmergencyContact", back_populates="user", cascade="all, delete-orphan")
    family_members = relationship("FamilyMember", back_populates="user", cascade="all, delete-orphan")
    medical = relationship("MedicalInfo", back_populates="user", uselist=False, cascade="all, delete-orphan")
    sos_requests = relationship(
        "SOSRequest", back_populates="user", cascade="all, delete-orphan", foreign_keys="SOSRequest.user_id"
    )
    notifications = relationship("NotificationRecipient", back_populates="user", cascade="all, delete-orphan")
