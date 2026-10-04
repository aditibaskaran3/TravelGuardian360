from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.utils.validation import clean_text


class DocumentIn(BaseModel):
    # None means the document belongs to the tourist themself ("Myself").
    family_member_id: int | None = None
    document_name: str | None = Field(default=None, max_length=120)
    document_number: str | None = Field(default=None, max_length=80)

    @field_validator("document_name", "document_number")
    @classmethod
    def _strip(cls, v):
        return clean_text(v)


class DocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    family_member_id: int | None
    document_name: str | None
    document_number: str | None
    file_name: str | None
    file_type: str | None
    created_at: datetime
    updated_at: datetime
