from pydantic import BaseModel
from typing import Optional


class TripOut(BaseModel):
    id: str
    user_id: str
    status: str
    startedAt: str
    endedAt: Optional[str] = None
    isActive: bool

    class Config:
        from_attributes = True
