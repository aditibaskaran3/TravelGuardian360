import os
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models import FamilyMember, TravelDocument, User
from app.schemas.document import DocumentOut
from app.utils.deps import get_current_tourist

router = APIRouter(prefix="/documents", tags=["Documents"])

MAX_DOCUMENTS = 50
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_CONTENT_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "application/pdf": ".pdf",
}

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "documents")
os.makedirs(UPLOAD_DIR, exist_ok=True)


def _check_family_member(db: Session, user: User, family_member_id: int | None) -> None:
    if family_member_id is None:
        return
    exists = (
        db.query(FamilyMember)
        .filter(FamilyMember.id == family_member_id, FamilyMember.user_id == user.id)
        .first()
    )
    if not exists:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Family member not found.")


def _own(db: Session, user: User, document_id: int) -> TravelDocument:
    document = db.query(TravelDocument).filter(TravelDocument.id == document_id, TravelDocument.user_id == user.id).first()
    if not document:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not found.")
    return document


def _delete_file(document: TravelDocument) -> None:
    if document.file_path:
        full_path = os.path.join(UPLOAD_DIR, document.file_path)
        if os.path.exists(full_path):
            try:
                os.remove(full_path)
            except OSError:
                pass


async def _store_file(file: UploadFile | None) -> tuple[str | None, str | None, str | None]:
    """Validate and persist an optional uploaded file. Returns (stored_filename, original_name, content_type)."""
    if file is None or not file.filename:
        return None, None, None
    content_type = (file.content_type or "").lower()
    extension = ALLOWED_CONTENT_TYPES.get(content_type)
    if extension is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Only JPG, PNG or PDF files are allowed.")
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "File is too large. The maximum size is 10 MB.")
    stored_name = f"{uuid.uuid4().hex}{extension}"
    with open(os.path.join(UPLOAD_DIR, stored_name), "wb") as out:
        out.write(contents)
    return stored_name, file.filename, content_type


@router.get("", response_model=list[DocumentOut])
def list_documents(user: User = Depends(get_current_tourist), db: Session = Depends(get_db)):
    return db.query(TravelDocument).filter(TravelDocument.user_id == user.id).order_by(TravelDocument.id).all()


@router.post("", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
async def add_document(
    family_member_id: int | None = Form(default=None),
    document_name: str | None = Form(default=None),
    document_number: str | None = Form(default=None),
    file: UploadFile | None = File(default=None),
    user: User = Depends(get_current_tourist),
    db: Session = Depends(get_db),
):
    if db.query(TravelDocument).filter(TravelDocument.user_id == user.id).count() >= MAX_DOCUMENTS:
        raise HTTPException(status.HTTP_409_CONFLICT, f"You can add up to {MAX_DOCUMENTS} documents.")
    _check_family_member(db, user, family_member_id)
    stored_name, original_name, content_type = await _store_file(file)
    document = TravelDocument(
        user_id=user.id,
        family_member_id=family_member_id,
        document_name=(document_name or "").strip() or None,
        document_number=(document_number or "").strip() or None,
        file_path=stored_name,
        file_name=original_name,
        file_type=content_type,
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    return document


@router.put("/{document_id}", response_model=DocumentOut)
async def update_document(
    document_id: int,
    family_member_id: int | None = Form(default=None),
    document_name: str | None = Form(default=None),
    document_number: str | None = Form(default=None),
    file: UploadFile | None = File(default=None),
    remove_file: bool = Form(default=False),
    user: User = Depends(get_current_tourist),
    db: Session = Depends(get_db),
):
    document = _own(db, user, document_id)
    _check_family_member(db, user, family_member_id)
    document.family_member_id = family_member_id
    document.document_name = (document_name or "").strip() or None
    document.document_number = (document_number or "").strip() or None

    if file is not None and file.filename:
        stored_name, original_name, content_type = await _store_file(file)
        _delete_file(document)
        document.file_path = stored_name
        document.file_name = original_name
        document.file_type = content_type
    elif remove_file:
        _delete_file(document)
        document.file_path = None
        document.file_name = None
        document.file_type = None

    db.commit()
    db.refresh(document)
    return document


@router.get("/{document_id}/file")
def get_document_file(document_id: int, user: User = Depends(get_current_tourist), db: Session = Depends(get_db)):
    document = _own(db, user, document_id)
    if not document.file_path:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "This document has no attached file.")
    full_path = os.path.join(UPLOAD_DIR, document.file_path)
    if not os.path.exists(full_path):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "The attached file could not be found.")
    return FileResponse(full_path, media_type=document.file_type or "application/octet-stream", filename=document.file_name or document.file_path)


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(document_id: int, user: User = Depends(get_current_tourist), db: Session = Depends(get_db)):
    document = _own(db, user, document_id)
    _delete_file(document)
    db.delete(document)
    db.commit()
