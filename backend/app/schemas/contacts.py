from pydantic import BaseModel


class EmergencyContactCreate(BaseModel):
    name: str
    phone: str
    relationship: str = "Contact"
    isPrimary: bool = False


class EmergencyContactOut(BaseModel):
    id: str
    name: str
    phone: str
    relationship: str
    isPrimary: bool

    class Config:
        from_attributes = True
