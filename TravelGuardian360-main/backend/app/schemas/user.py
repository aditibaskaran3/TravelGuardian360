from pydantic import BaseModel, Field, field_validator

from app.utils.validation import clean_email, clean_password, clean_phone


class ProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=120)
    email: str | None = None
    phone: str | None = None
    avatar_url: str | None = Field(default=None, max_length=500)

    @field_validator("email")
    @classmethod
    def _email(cls, v):
        return clean_email(v) if v is not None else v

    @field_validator("phone")
    @classmethod
    def _phone(cls, v):
        return clean_phone(v) if v is not None else v


class PasswordChange(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def _pw(cls, v):
        return clean_password(v)


class SettingsUpdate(BaseModel):
    """Preferences are free-form flags; unknown keys are rejected to keep the store tidy."""

    safety_alerts: bool | None = None
    weather_alerts: bool | None = None
    travel_alerts: bool | None = None
    trip_reminders: bool | None = None
    share_location_with_admin: bool | None = None
    share_medical_in_sos: bool | None = None
    auto_location_updates: bool | None = None
    high_accuracy_location: bool | None = None
    sos_countdown: bool | None = None
    notify_contacts_on_sos: bool | None = None
    temperature_unit: str | None = Field(default=None, pattern="^(c|f)$")
