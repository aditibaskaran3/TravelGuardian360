from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models import User
from app.utils.security import decode_access_token

bearer = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Your session has expired. Please sign in again.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None:
        raise unauthorized
    user_id = decode_access_token(credentials.credentials)
    if user_id is None:
        raise unauthorized
    user = db.get(User, user_id)
    if user is None:
        raise unauthorized
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This account has been deactivated.")
    return user


def get_current_tourist(user: User = Depends(get_current_user)) -> User:
    if user.role != "user":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This area is for tourist accounts.")
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    """Role is read from the database row, never from the token or the client."""
    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Administrator access is required.")
    return user
