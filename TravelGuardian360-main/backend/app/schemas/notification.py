from pydantic import BaseModel, Field, field_validator

NOTIFICATION_TYPES = "^(safety|weather|travel|emergency|trip|general)$"


class NotificationIn(BaseModel):
    title: str = Field(min_length=2, max_length=150)
    message: str = Field(min_length=2, max_length=2000)
    type: str = Field(default="general", pattern=NOTIFICATION_TYPES)
    target_all: bool = True
    target_user_ids: list[int] = []

    @field_validator("title", "message")
    @classmethod
    def _strip(cls, v):
        v = v.strip()
        if len(v) < 2:
            raise ValueError("This field is required.")
        return v


class NotificationEdit(BaseModel):
    title: str = Field(min_length=2, max_length=150)
    message: str = Field(min_length=2, max_length=2000)
    type: str = Field(pattern=NOTIFICATION_TYPES)
