from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class LocationCreate(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    accuracy: float | None = Field(default=None, ge=0)
    label: str | None = Field(default=None, max_length=200)
    tracking_active: bool = True


class LocationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    trip_id: int | None
    latitude: float
    longitude: float
    accuracy: float | None
    label: str | None
    tracking_active: bool
    recorded_at: datetime
