"""Imports every model so the metadata is complete before tables are created."""
from app.database.database import Base
from app.models import *  # noqa: F401,F403

__all__ = ["Base"]
