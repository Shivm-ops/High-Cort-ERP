from datetime import date
from typing import Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import (
    ROLES_ADVOCATES,
    apply_firm_filter,
    check_object_firm,
    require_firm_member,
    require_roles,
)
from app.models.case import Case
from app.models.draft import Draft
from app.models.filing import CaseNote, Filing, FilingStatus
from app.models.user import User

router = APIRouter()


def _assert_firm_case(case_id: uuid.UUID, current_user: User, db: Session) -> Case:
    case = (
        db.query(Case)
        .filter(Case.id == case_id, Case.is_deleted == False)
        .first()
    )
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    check_object_firm(case, current_user)
    return case


def _assert_firm_draft(draft_id_str: Optional[str], current_user: User, db: Session) -> Optional[uuid.UUID]:
    if not draft_id_str:
        return None
    try:
        draft_uuid = uuid.UUID(draft_id_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid draft ID")
    draft = (
        db.query(Draft)
        .filter(Draft.id == draft_uuid, Draft.is_deleted == False)
        .first()
    )
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    if not draft.is_public_template:
        check_object_firm(draft, current_user)
    return draft_uuid


def serialize_filing(f: Filing) -> dict:
    return {
        "id": str(f.id),
        "case_id": str(f.case_id),
        "draft_id": str(f.draft_id) if f.draft_id else None,
        "title": f.title,
        "filing_type": f.filing_type,
        "status": f.status,
        "filing_date": f.filing_date.isoformat() if f.filing_date else None,
        "acceptance_date": f.acceptance_date.isoformat() if f.acceptance_date else None,
        "defect_raised_date": f.defect_raised_date.isoformat() if f.defect_raised_date else None,
        "court_fee": f.court_fee or 0,
        "stamp_duty": f.stamp_duty or 0,
        "estamp_reference": f.estamp_reference,
        "other_costs": f.other_costs or 0,
        "total_cost": (f.court_fee or 0) + (f.stamp_duty or 0) + (f.other_costs or 0),
        "checklist": f.checklist or [],
        "document_ids": f.document_ids or [],
        "notes": f.notes,
        "defect_description": f.defect_description,
        "created_at": f.created_at.isoformat() if f.created_at else None,
        "updated_at": f.updated_at.isoformat() if f.updated_at else None,
    }


def serialize_note(n: CaseNote) -> dict:
    return {
        "id": str(n.id),
        "case_id": str(n.case_id),
        "content": n.content,
        "note_type": n.note_type,
        "is_pinned": n.is_pinned,
        "created_at": n.created_at.isoformat() if n.created_at else None,
        "updated_at": n.updated_at.isoformat() if n.updated_at else None,
    }


# ─── Filing models ────────────────────────────────────────────────────────────


class FilingCreate(BaseModel):
    case_id: uuid.UUID
    title: str
    filing_type: Optional[str] = None
    draft_id: Optional[str] = None
    court_fee: Optional[float] = 0
    stamp_duty: Optional[float] = 0
    estamp_reference: Optional[str] = None
    other_costs: Optional[float] = 0
    checklist: Optional[list] = []
    notes: Optional[str] = None


class FilingUpdate(BaseModel):
    title: Optional[str] = None
    filing_type: Optional[str] = None
    status: Optional[str] = None
    filing_date: Optional[date] = None
    acceptance_date: Optional[date] = None
    defect_raised_date: Optional[date] = None
    defect_description: Optional[str] = None
    court_fee: Optional[float] = None
    stamp_duty: Optional[float] = None
    estamp_reference: Optional[str] = None
    other_costs: Optional[float] = None
    checklist: Optional[list] = None
    document_ids: Optional[list] = None
    notes: Optional[str] = None


# ─── Filing endpoints ─────────────────────────────────────────────────────────


@router.get("/")
async def list_filings(
    case_id: Optional[uuid.UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    q = apply_firm_filter(
        db.query(Filing).join(Case, Filing.case_id == Case.id),
        Case,
        current_user,
    ).filter(Case.is_deleted == False)

    if case_id:
        _assert_firm_case(case_id, current_user, db)
        q = q.filter(Filing.case_id == case_id)

    filings = q.order_by(Filing.created_at.desc()).all()
    return {"total": len(filings), "filings": [serialize_filing(f) for f in filings]}


@router.post("/", status_code=201)
async def create_filing(
    data: FilingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    _assert_firm_case(data.case_id, current_user, db)
    resolved_draft_id = _assert_firm_draft(data.draft_id, current_user, db)

    filing = Filing(
        case_id=data.case_id,
        title=data.title,
        filing_type=data.filing_type,
        draft_id=resolved_draft_id,
        created_by_id=str(current_user.id),
        court_fee=max(0, data.court_fee or 0),
        stamp_duty=max(0, data.stamp_duty or 0),
        estamp_reference=data.estamp_reference,
        other_costs=max(0, data.other_costs or 0),
        checklist=data.checklist or [],
        notes=data.notes,
    )
    db.add(filing)
    db.commit()
    db.refresh(filing)
    return serialize_filing(filing)


@router.get("/{filing_id}")
async def get_filing(
    filing_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    try:
        filing_uuid = uuid.UUID(filing_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid filing ID")

    filing = db.query(Filing).filter(Filing.id == filing_uuid).first()
    if not filing:
        raise HTTPException(status_code=404, detail="Filing not found")
    _assert_firm_case(filing.case_id, current_user, db)
    return serialize_filing(filing)


@router.put("/{filing_id}")
async def update_filing(
    filing_id: str,
    data: FilingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    try:
        filing_uuid = uuid.UUID(filing_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid filing ID")

    filing = db.query(Filing).filter(Filing.id == filing_uuid).first()
    if not filing:
        raise HTTPException(status_code=404, detail="Filing not found")
    _assert_firm_case(filing.case_id, current_user, db)

    for field, val in data.model_dump(exclude_none=True).items():
        if field == "status":
            try:
                setattr(filing, field, FilingStatus(val))
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid filing status")
        else:
            setattr(filing, field, val)
    db.commit()
    db.refresh(filing)
    return serialize_filing(filing)


@router.delete("/{filing_id}", status_code=204)
async def delete_filing(
    filing_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*ROLES_ADVOCATES)),
):
    try:
        filing_uuid = uuid.UUID(filing_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid filing ID")

    filing = db.query(Filing).filter(Filing.id == filing_uuid).first()
    if not filing:
        raise HTTPException(status_code=404, detail="Filing not found")
    _assert_firm_case(filing.case_id, current_user, db)
    db.delete(filing)
    db.commit()


# ─── Case Notes endpoints ────────────────────────────────────────────────────


class NoteCreate(BaseModel):
    case_id: uuid.UUID
    content: str
    note_type: Optional[str] = "general"
    is_pinned: Optional[bool] = False


class NoteUpdate(BaseModel):
    content: Optional[str] = None
    note_type: Optional[str] = None
    is_pinned: Optional[bool] = None


@router.get("/notes/by-case/{case_id}")
async def get_notes_for_case(
    case_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    _assert_firm_case(case_id, current_user, db)
    notes = (
        db.query(CaseNote)
        .filter(CaseNote.case_id == case_id)
        .order_by(CaseNote.is_pinned.desc(), CaseNote.created_at.desc())
        .all()
    )
    return {"total": len(notes), "notes": [serialize_note(n) for n in notes]}


@router.post("/notes/", status_code=201)
async def create_note(
    data: NoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    _assert_firm_case(data.case_id, current_user, db)
    note = CaseNote(
        case_id=data.case_id,
        content=data.content,
        note_type=data.note_type or "general",
        is_pinned=data.is_pinned or False,
        created_by_id=str(current_user.id),
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return serialize_note(note)


@router.put("/notes/{note_id}")
async def update_note(
    note_id: str,
    data: NoteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    try:
        note_uuid = uuid.UUID(note_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid note ID")

    note = db.query(CaseNote).filter(CaseNote.id == note_uuid).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    _assert_firm_case(note.case_id, current_user, db)

    for field, val in data.model_dump(exclude_none=True).items():
        setattr(note, field, val)
    db.commit()
    db.refresh(note)
    return serialize_note(note)


@router.delete("/notes/{note_id}", status_code=204)
async def delete_note(
    note_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*ROLES_ADVOCATES)),
):
    try:
        note_uuid = uuid.UUID(note_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid note ID")

    note = db.query(CaseNote).filter(CaseNote.id == note_uuid).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    _assert_firm_case(note.case_id, current_user, db)
    db.delete(note)
    db.commit()
