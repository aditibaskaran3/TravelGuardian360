import uuid
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.auth.security import create_access_token, get_current_user, get_password_hash, verify_password
from app.database import get_db
from app.models.user import User
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest, TokenResponse, UserPublic

router = APIRouter()


@router.post("/register", response_model=AuthResponse)
def register_user(payload: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    user_id = f"user-{uuid.uuid4()}"
    user = User(
        id=user_id,
        tourist_id=f"TG-{uuid.uuid4().hex[:6].upper()}",
        full_name=payload.fullName.strip(),
        email=payload.email.lower(),
        phone=payload.phone.strip(),
        password_hash=get_password_hash(payload.password),
        nationality=payload.nationality.strip() or "India",
        emergency_contact_name=payload.emergencyContactName.strip() or "Emergency Contact",
        emergency_contact_phone=payload.emergencyContactPhone.strip() or "+91-9999999999",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.id})
    return {
        "token": token,
        "user": {
            "id": user.id,
            "touristId": user.tourist_id,
            "fullName": user.full_name,
            "email": user.email,
            "phone": user.phone,
            "nationality": user.nationality,
            "emergencyContact": {
                "name": user.emergency_contact_name,
                "phone": user.emergency_contact_phone,
            },
            "createdAt": user.created_at.isoformat(),
        },
    }


@router.post("/login", response_model=AuthResponse)
def login_user(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = create_access_token({"sub": user.id})
    return {
        "token": token,
        "user": {
            "id": user.id,
            "touristId": user.tourist_id,
            "fullName": user.full_name,
            "email": user.email,
            "phone": user.phone,
            "nationality": user.nationality,
            "emergencyContact": {
                "name": user.emergency_contact_name,
                "phone": user.emergency_contact_phone,
            },
            "createdAt": user.created_at.isoformat(),
        },
    }


@router.get("/me", response_model=UserPublic)
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "touristId": current_user.tourist_id,
        "fullName": current_user.full_name,
        "email": current_user.email,
        "phone": current_user.phone,
        "nationality": current_user.nationality,
        "emergencyContact": {
            "name": current_user.emergency_contact_name,
            "phone": current_user.emergency_contact_phone,
        },
        "createdAt": current_user.created_at.isoformat(),
    }
