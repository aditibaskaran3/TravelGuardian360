from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserOut
from app.services.notifications import send_notification
from app.services.tourist_id import ensure_tourist_id
from app.utils.deps import get_current_user
from app.utils.security import create_access_token, hash_password, verify_password
from app.utils.time import utcnow

router = APIRouter(prefix="/auth", tags=["Authentication"])

INVALID_LOGIN = "Incorrect email or password."


def _token_response(user: User) -> TokenResponse:
    return TokenResponse(access_token=create_access_token(user.id, user.role), user=UserOut.model_validate(user))


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    """Public registration. The role is always "user"; administrators cannot be created here."""
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "An account with this email already exists.")
    user = User(
        full_name=payload.full_name, email=payload.email, phone=payload.phone,
        password_hash=hash_password(payload.password), role="user", last_login_at=utcnow(),
    )
    db.add(user)
    db.flush()
    ensure_tourist_id(db, user)
    send_notification(
        db, "Welcome to TravelGuardian360",
        "Your Tourist ID is ready. Add an emergency contact and your Medical ID so help can reach you faster.",
        "general", [user.id],
    )
    db.commit()
    db.refresh(user)
    return _token_response(user)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, INVALID_LOGIN)
    if user.role != "user":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Administrator accounts sign in from the Admin login.")
    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "This account has been deactivated. Contact support.")
    user.last_login_at = utcnow()
    db.commit()
    return _token_response(user)


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user
