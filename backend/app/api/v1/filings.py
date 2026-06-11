from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
import uuid
from datetime import date

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.filing import Filing, FilingStatus, CaseNote

router = APIRouter()


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
    current_user: User = Depends(get_current_user),
):
    q = db.query(Filing)
    if case_id:
        q = q.filter(Filing.case_id == case_id)
    filings = q.order_by(Filing.created_at.desc()).all()
    return {"total": len(filings), "filings": [serialize_filing(f) for f in filings]}


@router.post("/", status_code=201)
async def create_filing(
    data: FilingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    filing = Filing(
        case_id=data.case_id,
        title=data.title,
        filing_type=data.filing_type,
        draft_id=data.draft_id,
        created_by_id=str(current_user.id),
        court_fee=data.court_fee or 0,
        stamp_duty=data.stamp_duty or 0,
        estamp_reference=data.estamp_reference,
        other_costs=data.other_costs or 0,
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
    current_user: User = Depends(get_current_user),
):
    filing = db.query(Filing).filter(Filing.id == filing_id).first()
    if not filing:
        raise HTTPException(status_code=404, detail="Filing not found")
    return serialize_filing(filing)


@router.put("/{filing_id}")
async def update_filing(
    filing_id: str,
    data: FilingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    filing = db.query(Filing).filter(Filing.id == filing_id).first()
    if not filing:
        raise HTTPException(status_code=404, detail="Filing not found")
    for field, val in data.model_dump(exclude_none=True).items():
        if field == "status":
            try:
                setattr(filing, field, FilingStatus(val))
            except ValueError:
                pass
        else:
            setattr(filing, field, val)
    db.commit()
    db.refresh(filing)
    return serialize_filing(filing)


@router.delete("/{filing_id}", status_code=204)
async def delete_filing(
    filing_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    filing = db.query(Filing).filter(Filing.id == filing_id).first()
    if not filing:
        raise HTTPException(status_code=404, detail="Filing not found")
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
    current_user: User = Depends(get_current_user),
):
    notes = db.query(CaseNote).filter(CaseNote.case_id == case_id)\
        .order_by(CaseNote.is_pinned.desc(), CaseNote.created_at.desc()).all()
    return {"total": len(notes), "notes": [serialize_note(n) for n in notes]}


@router.post("/notes/", status_code=201)
async def create_note(
    data: NoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
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
    current_user: User = Depends(get_current_user),
):
    note = db.query(CaseNote).filter(CaseNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    for field, val in data.model_dump(exclude_none=True).items():
        setattr(note, field, val)
    db.commit()
    db.refresh(note)
    return serialize_note(note)


@router.delete("/notes/{note_id}", status_code=204)
async def delete_note(
    note_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    note = db.query(CaseNote).filter(CaseNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    db.delete(note)
    db.commit()
