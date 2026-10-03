from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    fullName: str
    email: EmailStr
    phone: str
    password: str
    nationality: str = "India"
    emergencyContactName: str = "Emergency Contact"
    emergencyContactPhone: str = "+91-9999999999"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserPublic(BaseModel):
    id: str
    touristId: str
    fullName: str
    email: str
    phone: str
    nationality: str
    emergencyContact: dict
    createdAt: str

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    token: str
    user: UserPublic
