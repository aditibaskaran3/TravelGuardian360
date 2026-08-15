from pydantic import BaseModel
from typing import Optional


class MedicalIDPayload(BaseModel):
    bloodGroup: Optional[str] = None
    allergies: list[str] = []
    medicalConditions: list[str] = []
    medications: list[str] = []


class MedicalIDOut(BaseModel):
    id: str
    user_id: str
    bloodGroup: Optional[str] = None
    allergies: list[str]
    medicalConditions: list[str]
    medications: list[str]
    updatedAt: str

    class Config:
        from_attributes = True
