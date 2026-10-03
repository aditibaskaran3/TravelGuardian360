"""Translates server-side text into the language the client asked for (X-Lang header).

Results are cached in the `translations` table, so each sentence is translated once. When the translation
service cannot be reached the original English text is returned, so a request never fails because of it.
"""
import hashlib
import re
from concurrent.futures import ThreadPoolExecutor

import httpx
from fastapi import Header

from app.database.database import SessionLocal
from app.models import Translation

API_CODES = {"hi": "hi", "ta": "ta", "te": "te", "mr": "mr", "es": "es", "fr": "fr", "de": "de", "ja": "ja", "zh": "zh-CN", "ru": "ru"}
_LETTERS = re.compile(r"[A-Za-z]{2,}")


def get_lang(x_lang: str | None = Header(default=None)) -> str:
    code = (x_lang or "en").strip().lower()[:2]
    return code if code in API_CODES else "en"


def _digest(text: str) -> str:
    return hashlib.sha1(text.encode()).hexdigest()


def _fetch(text: str, lang: str) -> str | None:
    try:
        response = httpx.get(
            "https://translate.googleapis.com/translate_a/single",
            params={"client": "gtx", "sl": "en", "tl": API_CODES[lang], "dt": "t", "q": text},
            timeout=8,
        )
        response.raise_for_status()
        return "".join(part[0] for part in response.json()[0]) or None
    except (httpx.HTTPError, ValueError, KeyError, IndexError, TypeError):
        return None


def translate_many(texts: list[str | None], lang: str) -> list[str | None]:
    """Translate a batch, keeping order. Empty and non-text values pass through unchanged."""
    if lang == "en" or lang not in API_CODES:
        return list(texts)
    wanted = {t for t in texts if t and _LETTERS.search(t)}
    if not wanted:
        return list(texts)
    result: dict[str, str] = {}
    with SessionLocal() as db:
        hashes = {_digest(t): t for t in wanted}
        rows = db.query(Translation).filter(Translation.lang == lang, Translation.source_hash.in_(hashes)).all()
        for row in rows:
            result[hashes[row.source_hash]] = row.text
        missing = [t for t in wanted if t not in result]
        if missing:
            with ThreadPoolExecutor(max_workers=8) as pool:
                fetched = list(pool.map(lambda t: _fetch(t, lang), missing))
            for source, translated in zip(missing, fetched):
                if translated:
                    result[source] = translated
                    db.add(Translation(lang=lang, source_hash=_digest(source), source=source, text=translated))
            db.commit()
    return [result.get(t, t) if t else t for t in texts]


def translate_text(text: str | None, lang: str) -> str | None:
    return translate_many([text], lang)[0]


def localize_fields(items: list[dict], fields: list[str], lang: str) -> list[dict]:
    """Translate the given fields of every dict in place and return the list."""
    if lang == "en":
        return items
    flat = [(item, f) for item in items for f in fields if item.get(f)]
    translated = translate_many([item[f] for item, f in flat], lang)
    for (item, f), value in zip(flat, translated):
        item[f] = value
    return items
