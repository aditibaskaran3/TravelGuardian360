from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models import EmergencyContact, User
from app.schemas.emergency_contact import ContactIn, ContactOut
from app.utils.deps import get_current_tourist

router = APIRouter(prefix="/emergency-contacts", tags=["Emergency Contacts"])


def _own(db: Session, user: User, contact_id: int) -> EmergencyContact:
    contact = db.query(EmergencyContact).filter(
        EmergencyContact.id == contact_id, EmergencyContact.user_id == user.id
    ).first()
    if not contact:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Contact not found.")
    return contact


def _single_primary(db: Session, user: User, keep: EmergencyContact) -> None:
    db.query(EmergencyContact).filter(
        EmergencyContact.user_id == user.id, EmergencyContact.id != keep.id
    ).update({"is_primary": False})


@router.get("", response_model=list[ContactOut])
def list_contacts(user: User = Depends(get_current_tourist), db: Session = Depends(get_db)):
    return (
        db.query(EmergencyContact).filter(EmergencyContact.user_id == user.id)
        .order_by(EmergencyContact.is_primary.desc(), EmergencyContact.id).all()
    )


@router.post("", response_model=ContactOut, status_code=status.HTTP_201_CREATED)
def add_contact(payload: ContactIn, user: User = Depends(get_current_tourist), db: Session = Depends(get_db)):
    first = db.query(EmergencyContact).filter(EmergencyContact.user_id == user.id).count() == 0
    contact = EmergencyContact(
        user_id=user.id, name=payload.name, phone=payload.phone,
        relationship_label=payload.relationship, is_primary=payload.is_primary or first,
    )
    db.add(contact)
    db.flush()
    if contact.is_primary:
        _single_primary(db, user, contact)
    db.commit()
    db.refresh(contact)
    return contact


@router.put("/{contact_id}", response_model=ContactOut)
def update_contact(contact_id: int, payload: ContactIn, user: User = Depends(get_current_tourist), db: Session = Depends(get_db)):
    contact = _own(db, user, contact_id)
    contact.name, contact.phone = payload.name, payload.phone
    contact.relationship_label = payload.relationship
    contact.is_primary = payload.is_primary
    if payload.is_primary:
        _single_primary(db, user, contact)
    db.commit()
    db.refresh(contact)
    return contact


@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contact(contact_id: int, user: User = Depends(get_current_tourist), db: Session = Depends(get_db)):
    contact = _own(db, user, contact_id)
    was_primary = contact.is_primary
    db.delete(contact)
    db.flush()
    if was_primary:
        successor = db.query(EmergencyContact).filter(EmergencyContact.user_id == user.id).order_by(EmergencyContact.id).first()
        if successor:
            successor.is_primary = True
    db.commit()
