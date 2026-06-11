import uuid
from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from pydantic import BaseModel

from app.core.database import get_db
from app.models.case_law import CaseLaw
from app.models.user import User
from app.core.security import get_current_user
from app.core.permissions import (
    require_firm_member, check_object_firm, apply_firm_filter, get_user_firm_id
)

router = APIRouter()

class CaseLawBase(BaseModel):
    title: str
    citation: Optional[str] = None
    court_name: Optional[str] = None
    judge_name: Optional[str] = None
    judgment_date: Optional[date] = None
    practice_area: Optional[str] = None
    keywords: List[str] = []
    mapped_sections: List[str] = []
    important_paragraphs: List[dict] = []
    arguments: List[dict] = []
    summary: Optional[str] = None
    ratio_decidendi: Optional[str] = None
    key_findings: Optional[str] = None
    personal_notes: Optional[str] = None
    document_url: Optional[str] = None
    is_favorite: bool = False
    case_id: Optional[uuid.UUID] = None

class CaseLawCreate(CaseLawBase):
    pass

class CaseLawUpdate(CaseLawBase):
    title: Optional[str] = None

class CaseLawOut(CaseLawBase):
    id: uuid.UUID

    class Config:
        from_attributes = True

@router.get("/", response_model=dict)
def get_case_laws(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
    search: Optional[str] = None,
    practice_area: Optional[str] = None,
    court_name: Optional[str] = None,
    is_favorite: Optional[bool] = None,
    case_id: Optional[uuid.UUID] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    # ── Tenant isolation: firm's own case laws + platform-global ones (no firm_id)
    query = db.query(CaseLaw).filter(
        or_(
            CaseLaw.firm_id == current_user.firm_id,
            CaseLaw.firm_id.is_(None),  # Platform-wide public case laws
        )
    )

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                CaseLaw.title.ilike(search_filter),
                CaseLaw.citation.ilike(search_filter),
                CaseLaw.summary.ilike(search_filter)
            )
        )
    if practice_area:
        query = query.filter(CaseLaw.practice_area == practice_area)
    if court_name:
        query = query.filter(CaseLaw.court_name == court_name)
    if is_favorite is not None:
        query = query.filter(CaseLaw.is_favorite == is_favorite)
    if case_id:
        query = query.filter(CaseLaw.case_id == case_id)

    total = query.count()
    results = query.order_by(CaseLaw.judgment_date.desc().nullslast()).offset(skip).limit(limit).all()
    return {
        "total": total,
        "items": [CaseLawOut.model_validate(c) for c in results]
    }

@router.get("/{case_law_id}", response_model=CaseLawOut)
def get_case_law(
    case_law_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    cl = db.query(CaseLaw).filter(CaseLaw.id == case_law_id).first()
    if not cl:
        raise HTTPException(status_code=404, detail="Case law not found")
    # ── Object-level security: own firm or public ─────────────────────────────
    if cl.firm_id and cl.firm_id != current_user.firm_id and not current_user.is_superadmin:
        raise HTTPException(status_code=403, detail="Access denied")
    return cl

@router.post("/", response_model=CaseLawOut)
def create_case_law(
    data: CaseLawCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    cl = CaseLaw(
        **data.model_dump(),
        firm_id=get_user_firm_id(current_user),
        created_by_id=current_user.id,
    )
    db.add(cl)
    db.commit()
    db.refresh(cl)
    return cl

@router.put("/{case_law_id}", response_model=CaseLawOut)
def update_case_law(
    case_law_id: uuid.UUID,
    data: CaseLawUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    cl = db.query(CaseLaw).filter(CaseLaw.id == case_law_id).first()
    if not cl:
        raise HTTPException(status_code=404, detail="Case law not found")
    if cl.firm_id and cl.firm_id != current_user.firm_id and not current_user.is_superadmin:
        raise HTTPException(status_code=403, detail="Access denied")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(cl, key, value)
    db.commit()
    db.refresh(cl)
    return cl

@router.delete("/{case_law_id}")
def delete_case_law(
    case_law_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    cl = db.query(CaseLaw).filter(CaseLaw.id == case_law_id).first()
    if not cl:
        raise HTTPException(status_code=404, detail="Case law not found")
    if cl.firm_id and cl.firm_id != current_user.firm_id and not current_user.is_superadmin:
        raise HTTPException(status_code=403, detail="Access denied")
    db.delete(cl)
    db.commit()
    return {"ok": True}
