from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.utils.validation import clean_email, clean_password, clean_phone


class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: str
    phone: str
    password: str
    confirm_password: str | None = None

    @field_validator("full_name")
    @classmethod
    def _name(cls, v):
        v = " ".join(v.split())
        if len(v) < 2:
            raise ValueError("Enter your full name.")
        return v

    @field_validator("email")
    @classmethod
    def _email(cls, v):
        return clean_email(v)

    @field_validator("phone")
    @classmethod
    def _phone(cls, v):
        return clean_phone(v)

    @field_validator("password")
    @classmethod
    def _password(cls, v):
        return clean_password(v)

    @model_validator(mode="after")
    def _match(self):
        if self.confirm_password is not None and self.confirm_password != self.password:
            raise ValueError("Passwords do not match.")
        return self


class LoginRequest(BaseModel):
    email: str
    password: str = Field(min_length=1)

    @field_validator("email")
    @classmethod
    def _email(cls, v):
        return clean_email(v)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: str
    phone: str
    role: str
    is_active: bool
    avatar_url: str | None = None
    created_at: datetime
    last_login_at: datetime | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
