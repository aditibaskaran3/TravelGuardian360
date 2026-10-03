import re

EMAIL_RE = re.compile(r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$")
PHONE_RE = re.compile(r"^\+?[0-9][0-9 ()\-]{5,18}[0-9]$")
BLOOD_GROUPS = {"A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"}


def clean_email(value: str) -> str:
    value = value.strip().lower()
    if not EMAIL_RE.match(value):
        raise ValueError("Enter a valid email address.")
    return value


def clean_phone(value: str) -> str:
    value = value.strip()
    if not PHONE_RE.match(value):
        raise ValueError("Enter a valid phone number, for example +91 98765 43210.")
    return value


def clean_password(value: str) -> str:
    if len(value) < 8:
        raise ValueError("Password must be at least 8 characters.")
    if not re.search(r"[A-Za-z]", value) or not re.search(r"[0-9]", value):
        raise ValueError("Password must contain both letters and numbers.")
    return value


def clean_text(value: str | None) -> str | None:
    if value is None:
        return None
    value = value.strip()
    return value or None
