from datetime import datetime, timezone


def utcnow() -> datetime:
    """Naive UTC timestamp, which is what SQLite stores."""
    return datetime.now(timezone.utc).replace(tzinfo=None)
