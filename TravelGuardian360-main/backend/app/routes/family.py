from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models import FamilyMember, User
from app.schemas.family import FamilyIn, FamilyOut
from app.utils.deps import get_current_tourist

router = APIRouter(prefix="/family", tags=["Family"])

MAX_MEMBERS = 15


def _own(db: Session, user: User, member_id: int) -> FamilyMember:
    member = db.query(FamilyMember).filter(FamilyMember.id == member_id, FamilyMember.user_id == user.id).first()
    if not member:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Family member not found.")
    return member


def _apply(member: FamilyMember, payload: FamilyIn) -> None:
    data = payload.model_dump()
    member.relationship_label = data.pop("relationship")
    for field, value in data.items():
        setattr(member, field, value)


@router.get("", response_model=list[FamilyOut])
def list_family(user: User = Depends(get_current_tourist), db: Session = Depends(get_db)):
    return db.query(FamilyMember).filter(FamilyMember.user_id == user.id).order_by(FamilyMember.id).all()


@router.post("", response_model=FamilyOut, status_code=status.HTTP_201_CREATED)
def add_member(payload: FamilyIn, user: User = Depends(get_current_tourist), db: Session = Depends(get_db)):
    if db.query(FamilyMember).filter(FamilyMember.user_id == user.id).count() >= MAX_MEMBERS:
        raise HTTPException(status.HTTP_409_CONFLICT, f"You can add up to {MAX_MEMBERS} family members.")
    member = FamilyMember(user_id=user.id)
    _apply(member, payload)
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


@router.put("/{member_id}", response_model=FamilyOut)
def update_member(member_id: int, payload: FamilyIn, user: User = Depends(get_current_tourist), db: Session = Depends(get_db)):
    member = _own(db, user, member_id)
    _apply(member, payload)
    db.commit()
    db.refresh(member)
    return member


@router.delete("/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_member(member_id: int, user: User = Depends(get_current_tourist), db: Session = Depends(get_db)):
    db.delete(_own(db, user, member_id))
    db.commit()
