from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.utils.validation import clean_text


class ZoneIn(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    city: str | None = Field(default=None, max_length=100)
    zone_type: str = Field(pattern="^(safe|caution|high_risk)$")
    safety_level: int = Field(ge=0, le=100)
    description: str | None = Field(default=None, max_length=1000)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    radius_m: int = Field(default=500, ge=50, le=50000)

    @field_validator("name", "city", "description")
    @classmethod
    def _strip(cls, v):
        return clean_text(v)


class ZoneOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    city: str | None
    zone_type: str
    safety_level: int
    description: str | None
    latitude: float
    longitude: float
    radius_m: int
