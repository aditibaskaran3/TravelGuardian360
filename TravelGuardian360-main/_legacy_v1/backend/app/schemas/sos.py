from pydantic import BaseModel
from typing import Optional


class SOSEventCreate(BaseModel):
    timestamp: Optional[int] = None
    coordinates: Optional[dict] = None
    contactName: str = "Emergency Contact"


class SOSEventOut(BaseModel):
    id: str
    user_id: str
    timestamp: str
    latitude: Optional[float]
    longitude: Optional[float]
    contactName: str

    class Config:
        from_attributes = True
