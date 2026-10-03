from datetime import date

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.utils.validation import BLOOD_GROUPS, clean_phone, clean_text


class FamilyIn(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    relationship: str = Field(min_length=2, max_length=60)
    date_of_birth: date | None = None
    phone: str | None = None
    nationality: str | None = Field(default=None, max_length=80)
    passport_number: str | None = Field(default=None, max_length=40)
    blood_group: str | None = None
    allergies: str | None = Field(default=None, max_length=1000)
    medical_notes: str | None = Field(default=None, max_length=1000)
    is_travelling: bool = True

    @field_validator("full_name", "relationship")
    @classmethod
    def _required(cls, v):
        v = " ".join(v.split())
        if len(v) < 2:
            raise ValueError("This field is required.")
        return v

    @field_validator("phone")
    @classmethod
    def _phone(cls, v):
        v = clean_text(v)
        return clean_phone(v) if v else None

    @field_validator("date_of_birth")
    @classmethod
    def _dob(cls, v):
        if v is not None and (v > date.today() or v.year < 1900):
            raise ValueError("Enter a valid date of birth.")
        return v

    @field_validator("blood_group")
    @classmethod
    def _blood(cls, v):
        v = clean_text(v)
        if v is not None and v.upper() not in BLOOD_GROUPS:
            raise ValueError("Choose a valid blood group.")
        return v.upper() if v else None

    @field_validator("nationality", "passport_number", "allergies", "medical_notes")
    @classmethod
    def _strip(cls, v):
        return clean_text(v)


class FamilyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    relationship: str = Field(validation_alias="relationship_label")
    date_of_birth: date | None
    phone: str | None
    nationality: str | None
    passport_number: str | None
    blood_group: str | None
    allergies: str | None
    medical_notes: str | None
    is_travelling: bool
