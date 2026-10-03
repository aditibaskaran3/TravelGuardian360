from pydantic import BaseModel, Field, field_validator

from app.utils.validation import clean_text


class SOSCreate(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    location_label: str | None = Field(default=None, max_length=200)
    message: str | None = Field(default=None, max_length=500)

    @field_validator("location_label", "message")
    @classmethod
    def _strip(cls, v):
        return clean_text(v)


class SOSStatusUpdate(BaseModel):
    status: str = Field(pattern="^(active|acknowledged|resolved)$")
    admin_note: str | None = Field(default=None, max_length=500)
