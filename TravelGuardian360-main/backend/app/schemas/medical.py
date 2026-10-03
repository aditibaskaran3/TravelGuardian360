from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.utils.validation import BLOOD_GROUPS, clean_text


class MedicalIn(BaseModel):
    blood_group: str | None = None
    allergies: str | None = Field(default=None, max_length=1000)
    conditions: str | None = Field(default=None, max_length=1000)
    medications: str | None = Field(default=None, max_length=1000)
    notes: str | None = Field(default=None, max_length=1000)
    emergency_contact: str | None = Field(default=None, max_length=200)

    @field_validator("blood_group")
    @classmethod
    def _blood(cls, v):
        v = clean_text(v)
        if v is not None and v.upper() not in BLOOD_GROUPS:
            raise ValueError("Choose a valid blood group.")
        return v.upper() if v else v

    @field_validator("allergies", "conditions", "medications", "notes", "emergency_contact")
    @classmethod
    def _strip(cls, v):
        return clean_text(v)


class MedicalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    blood_group: str | None
    allergies: str | None
    conditions: str | None
    medications: str | None
    notes: str | None
    emergency_contact: str | None
    updated_at: datetime
