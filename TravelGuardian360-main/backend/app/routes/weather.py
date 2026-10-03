from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models import User
from app.services.weather import WeatherUnavailable, get_weather
from app.services.translate import get_lang, translate_text
from app.utils.deps import get_current_user

router = APIRouter(prefix="/weather", tags=["Weather"])


@router.get("")
def weather(
    lat: float = Query(ge=-90, le=90), lon: float = Query(ge=-180, le=180),
    name: str | None = Query(default=None, max_length=150), refresh: bool = False,
    _user: User = Depends(get_current_user), db: Session = Depends(get_db), lang: str = Depends(get_lang),
):
    try:
        result = get_weather(db, lat, lon, name, force=refresh)
    except WeatherUnavailable as exc:
        raise HTTPException(503, str(exc))
    result["condition"] = translate_text(result["condition"], lang)
    return result
