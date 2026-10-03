from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models import SafetyZone, User
from app.schemas.safety_zone import ZoneOut
from app.services.safety import evaluate_position
from app.services.translate import get_lang, localize_fields, translate_text
from app.utils.deps import get_current_user

router = APIRouter(prefix="/safety-zones", tags=["Safety Zones"])

ZONE_TEXT = ["name", "city", "description"]


@router.get("", response_model=list[ZoneOut])
def list_zones(_user: User = Depends(get_current_user), db: Session = Depends(get_db), lang: str = Depends(get_lang)):
    zones = db.query(SafetyZone).order_by(SafetyZone.city, SafetyZone.name).all()
    return localize_fields([ZoneOut.model_validate(z).model_dump() for z in zones], ZONE_TEXT, lang)


@router.get("/status")
def zone_status(
    lat: float = Query(ge=-90, le=90), lon: float = Query(ge=-180, le=180),
    _user: User = Depends(get_current_user), db: Session = Depends(get_db), lang: str = Depends(get_lang),
):
    result = evaluate_position(db, lat, lon)
    zones = ([result["zone"]] if result["zone"] else []) + result["nearby"]
    localize_fields(zones, ZONE_TEXT, lang)
    result["label"] = translate_text(result["label"], lang)
    result["message"] = translate_text(result["message"], lang)
    return result
