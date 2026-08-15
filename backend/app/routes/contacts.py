import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.auth.security import get_current_user
from app.database import get_db
from app.models.emergency_contact import EmergencyContact
from app.models.user import User
from app.schemas.contacts import EmergencyContactCreate, EmergencyContactOut

router = APIRouter()


@router.get("/contacts", response_model=list[EmergencyContactOut])
def list_contacts(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    contacts = db.query(EmergencyContact).filter(EmergencyContact.user_id == current_user.id).all()
    return contacts


@router.post("/contacts", response_model=EmergencyContactOut)
def add_contact(payload: EmergencyContactCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    contact = EmergencyContact(
        id=f"contact-{uuid.uuid4()}",
        user_id=current_user.id,
        name=payload.name.strip(),
        phone=payload.phone.strip(),
        relationship=payload.relationship.strip() or "Contact",
        is_primary=payload.isPrimary,
    )
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact


@router.delete("/contacts/{contact_id}")
def delete_contact(contact_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    contact = db.query(EmergencyContact).filter(EmergencyContact.id == contact_id, EmergencyContact.user_id == current_user.id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    db.delete(contact)
    db.commit()
    return {"success": True}


@router.put("/contacts")
def replace_contacts(payload: list[EmergencyContactCreate], current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    existing = db.query(EmergencyContact).filter(EmergencyContact.user_id == current_user.id).all()
    for item in existing:
        db.delete(item)

    for idx, item in enumerate(payload):
        contact = EmergencyContact(
            id=f"contact-{uuid.uuid4()}",
            user_id=current_user.id,
            name=item.name.strip(),
            phone=item.phone.strip(),
            relationship=item.relationship.strip() or "Contact",
            is_primary=(idx == 0) or item.isPrimary,
        )
        db.add(contact)

    db.commit()
    return {"success": True, "count": len(payload)}
