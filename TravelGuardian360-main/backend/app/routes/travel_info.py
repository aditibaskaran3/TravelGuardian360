from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models import TravelInfo, User
from app.services.translate import get_lang, localize_fields
from app.utils.deps import get_current_user

router = APIRouter(prefix="/travel-info", tags=["Travel Information"])


@router.get("")
def list_travel_info(
    category: str | None = Query(default=None, pattern="^(emergency|safety|tourist|help|travel)$"),
    _user: User = Depends(get_current_user), db: Session = Depends(get_db), lang: str = Depends(get_lang),
):
    query = db.query(TravelInfo)
    if category:
        query = query.filter(TravelInfo.category == category)
    rows = query.order_by(TravelInfo.category, TravelInfo.sort_order, TravelInfo.id).all()
    items = [
        {"id": r.id, "category": r.category, "title": r.title, "content": r.content, "phone": r.phone, "destination": r.destination}
        for r in rows
    ]
    return localize_fields(items, ["title", "content"], lang)
