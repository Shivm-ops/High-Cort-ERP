import re
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from typing import Optional
from pydantic import BaseModel
from datetime import datetime
import uuid

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.permissions import (
    require_firm_member, require_roles, check_object_firm, apply_firm_filter,
    get_user_firm_id, ROLES_ADMIN
)
from app.models.draft import Draft, DraftCategory, DraftLanguage
from app.models.user import User
from app.models.client import Client
from app.models.case import Case

router = APIRouter()


def serialize_draft(d: Draft) -> dict:
    return {
        "id": str(d.id),
        "title": d.title,
        "content": d.content,
        "category": d.category,
        "practice_area": d.practice_area,
        "subcategory": d.subcategory,
        "court_type": d.court_type,
        "storage_url": d.storage_url,
        "status": d.status,
        "language": d.language,
        "case_id": str(d.case_id) if d.case_id else None,
        "client_id": str(d.client_id) if d.client_id else None,
        "tags": d.tags or [],
        "is_template": d.is_template,
        "ai_generated": d.ai_generated,
        "version": d.version or 1,
        "word_count": d.word_count,
        "firm_id": str(d.firm_id) if d.firm_id else None,
        "created_at": d.created_at.isoformat() if d.created_at else None,
        "updated_at": d.updated_at.isoformat() if d.updated_at else None,
    }


class DraftCreate(BaseModel):
    title: str
    content: Optional[str] = None
    category: str
    practice_area: Optional[str] = None
    subcategory: Optional[str] = None
    court_type: Optional[str] = None
    storage_url: Optional[str] = None
    status: Optional[str] = "active"
    language: str = "en"
    case_id: Optional[str] = None
    client_id: Optional[str] = None
    tags: list = []
    is_template: bool = False
    ai_generated: bool = False


class DraftUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    practice_area: Optional[str] = None
    subcategory: Optional[str] = None
    court_type: Optional[str] = None
    storage_url: Optional[str] = None
    status: Optional[str] = None
    language: Optional[str] = None
    tags: Optional[list] = None
    is_template: Optional[bool] = None


class AutoFillRequest(BaseModel):
    template_content: str
    client_id: uuid.UUID
    case_id: Optional[uuid.UUID] = None


@router.get("/templates")
async def list_templates(
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    """Return firm's own templates + global public templates."""
    # Firm-owned templates OR public platform templates (firm_id IS NULL)
    from sqlalchemy import or_ as sql_or
    q = db.query(Draft).filter(Draft.is_template == True).filter(
        sql_or(
            Draft.firm_id == current_user.firm_id,
            Draft.is_public_template == True,
        )
    )
    if category:
        q = q.filter(Draft.category == category)
    templates = q.order_by(Draft.title).all()
    return {"total": len(templates), "templates": [serialize_draft(t) for t in templates]}


@router.post("/auto-fill")
async def auto_fill_draft(
    req: AutoFillRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    # ── Verify client belongs to current firm ─────────────────────────────────
    client = apply_firm_filter(db.query(Client), Client, current_user).filter(
        Client.id == req.client_id
    ).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    case = None
    if req.case_id:
        case = apply_firm_filter(db.query(Case), Case, current_user).filter(
            Case.id == req.case_id
        ).first()

    advocate_name = current_user.full_name
    client_age = ""
    if client.date_of_birth:
        today = datetime.utcnow().date()
        age = today.year - client.date_of_birth.year - (
            (today.month, today.day) < (client.date_of_birth.month, client.date_of_birth.day)
        )
        client_age = str(age)

    address_parts = [p for p in [client.address, client.city, client.state, client.pincode] if p]
    client_address = ", ".join(address_parts)

    merge_map = {
        "client_name": client.name or "",
        "client_address": client_address,
        "client_age": client_age,
        "client_occupation": client.occupation or "",
        "aadhaar": client.aadhaar_number or "",
        "pan": client.pan or "",
        "case_number": (case.case_no or "") if case else "",
        "court_name": (case.court or "") if case else "",
        "judge_name": (case.judge or "") if case else "",
        "opponent_name": (case.respondent or case.petitioner or "") if case else "",
        "advocate_name": advocate_name or "",
        "filing_number": (case.case_no or "") if case else "",
        "practice_area": (case.practice_area or "") if case else "",
        "petitioner": (case.petitioner or "") if case else "",
        "respondent": (case.respondent or "") if case else "",
    }

    filled = req.template_content
    for key, value in merge_map.items():
        filled = re.sub(r"\{\{" + re.escape(key) + r"\}\}", str(value), filled, flags=re.IGNORECASE)

    return {
        "filled_content": filled,
        "merge_map": merge_map,
        "client_name": client.name,
        "case_no": case.case_no if case else None,
    }


@router.get("/")
async def list_drafts(
    skip: int = 0, limit: int = 50, category: Optional[str] = None,
    language: Optional[str] = None, search: Optional[str] = None,
    is_template: Optional[bool] = None, case_id: Optional[str] = None,
    db: Session = Depends(get_db), current_user: User = Depends(require_firm_member),
):
    from sqlalchemy import or_ as sql_or
    # ── Tenant isolation: firm's drafts + global public templates ─────────────
    query = db.query(Draft).filter(
        sql_or(
            Draft.firm_id == current_user.firm_id,
            Draft.is_public_template == True,
        )
    )
    if category:
        query = query.filter(Draft.category == category)
    if language:
        query = query.filter(Draft.language == language)
    if search:
        query = query.filter(Draft.title.ilike(f"%{search}%"))
    if is_template is not None:
        query = query.filter(Draft.is_template == is_template)
    if case_id:
        query = query.filter(Draft.case_id == case_id)
    total = query.count()
    drafts = query.offset(skip).limit(limit).all()
    return {"total": total, "drafts": [serialize_draft(d) for d in drafts]}


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_draft(
    data: DraftCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    word_count = len(data.content.split()) if data.content else 0
    draft = Draft(
        **data.model_dump(),
        created_by_id=current_user.id,
        word_count=word_count,
        firm_id=get_user_firm_id(current_user),
    )
    db.add(draft)
    db.commit()
    db.refresh(draft)
    return serialize_draft(draft)


@router.get("/{draft_id}")
async def get_draft(
    draft_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    draft = db.query(Draft).filter(Draft.id == draft_id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    # ── Object-level security: own firm or public template ────────────────────
    if not draft.is_public_template:
        check_object_firm(draft, current_user)
    return serialize_draft(draft)


@router.put("/{draft_id}")
async def update_draft(
    draft_id: str,
    data: DraftUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    draft = db.query(Draft).filter(Draft.id == draft_id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    # ── Object-level security ─────────────────────────────────────────────────
    check_object_firm(draft, current_user)
    for field, val in data.model_dump(exclude_none=True).items():
        setattr(draft, field, val)
    if data.content:
        draft.word_count = len(data.content.split())
        draft.version = (draft.version or 1) + 1
    db.commit()
    db.refresh(draft)
    return serialize_draft(draft)


@router.delete("/{draft_id}")
async def delete_draft(
    draft_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    draft = db.query(Draft).filter(Draft.id == draft_id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    # ── Object-level security ─────────────────────────────────────────────────
    check_object_firm(draft, current_user)
    
    # ── Destructive Action Validation ──────────────────────────────────────────
    # Only the original author (or a superadmin) can hard delete a draft.
    if not current_user.is_superadmin and draft.created_by_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only the author of this draft can delete it."
        )
        
    db.delete(draft)
    db.commit()
    return {"message": "Draft deleted"}


@router.get("/{draft_id}/translations")
async def get_draft_translations(
    draft_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    draft = db.query(Draft).filter(Draft.id == draft_id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    if not draft.is_public_template:
        check_object_firm(draft, current_user)

    from sqlalchemy import or_ as sql_or
    related = db.query(Draft).filter(
        Draft.id != draft.id,
        Draft.category == draft.category,
        Draft.language != draft.language,
        Draft.is_template == True,
        sql_or(
            Draft.firm_id == current_user.firm_id,
            Draft.is_public_template == True,
        )
    ).limit(5).all()

    return {
        "original": serialize_draft(draft),
        "translations": [serialize_draft(r) for r in related],
        "languages_available": list(set([r.language for r in related]))
    }
