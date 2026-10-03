from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.utils.validation import clean_text


class TripBase(BaseModel):
    destination: str = Field(min_length=2, max_length=150)
    destination_lat: float | None = Field(default=None, ge=-90, le=90)
    destination_lon: float | None = Field(default=None, ge=-180, le=180)
    start_date: date
    end_date: date
    accommodation: str | None = Field(default=None, max_length=200)
    transport: str | None = Field(default=None, max_length=200)
    notes: str | None = Field(default=None, max_length=2000)

    @field_validator("destination", "accommodation", "transport", "notes")
    @classmethod
    def _strip(cls, v):
        return clean_text(v)

    @model_validator(mode="after")
    def _dates(self):
        if self.end_date < self.start_date:
            raise ValueError("The end date cannot be before the start date.")
        return self


class TripCreate(TripBase):
    start_now: bool = False


class TripUpdate(TripBase):
    pass


class TripOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    destination: str
    destination_lat: float | None
    destination_lon: float | None
    start_date: date
    end_date: date
    status: str
    accommodation: str | None
    transport: str | None
    notes: str | None
    created_at: datetime
    started_at: datetime | None
    ended_at: datetime | None
