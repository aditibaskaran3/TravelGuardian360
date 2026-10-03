from datetime import date

from pydantic import BaseModel, Field, field_validator

from app.utils.validation import clean_text


class TouristIDUpdate(BaseModel):
    nationality: str | None = Field(default=None, max_length=80)
    date_of_birth: date | None = None
    passport_number: str | None = Field(default=None, max_length=40)

    @field_validator("nationality", "passport_number")
    @classmethod
    def _strip(cls, v):
        return clean_text(v)

    @field_validator("date_of_birth")
    @classmethod
    def _dob(cls, v):
        if v is not None and (v >= date.today() or v.year < 1900):
            raise ValueError("Enter a valid date of birth.")
        return v
