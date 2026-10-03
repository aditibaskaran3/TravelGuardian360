from pydantic import BaseModel, Field, field_validator

from app.utils.validation import clean_email, clean_phone


class AdminUserUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=120)
    email: str | None = None
    phone: str | None = None
    is_active: bool | None = None

    @field_validator("email")
    @classmethod
    def _email(cls, v):
        return clean_email(v) if v is not None else v

    @field_validator("phone")
    @classmethod
    def _phone(cls, v):
        return clean_phone(v) if v is not None else v


class TouristVerification(BaseModel):
    verified: bool = True


class BulkVerification(BaseModel):
    """user_ids limits the approval to those tourists; leave it out to approve every open request."""

    user_ids: list[int] | None = None
