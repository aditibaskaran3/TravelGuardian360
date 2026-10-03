from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.utils.validation import clean_phone


class ContactIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    phone: str
    relationship: str = Field(min_length=2, max_length=60)
    is_primary: bool = False

    @field_validator("name", "relationship")
    @classmethod
    def _strip(cls, v):
        v = v.strip()
        if len(v) < 2:
            raise ValueError("This field is required.")
        return v

    @field_validator("phone")
    @classmethod
    def _phone(cls, v):
        return clean_phone(v)


class ContactOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    phone: str
    relationship: str = Field(validation_alias="relationship_label")
    is_primary: bool
