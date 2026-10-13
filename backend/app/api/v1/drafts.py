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


CATEGORY_ALIASES = {
    "applications": DraftCategory.APPLICATION,
    "application": DraftCategory.APPLICATION,
    "affidavits": DraftCategory.AFFIDAVIT,
    "affidavit": DraftCategory.AFFIDAVIT,
    "petitions": DraftCategory.PETITION,
    "petition": DraftCategory.PETITION,
    "complaints": DraftCategory.COMPLAINT,
    "complaint": DraftCategory.COMPLAINT,
    "replies": DraftCategory.REPLY,
    "reply": DraftCategory.REPLY,
    "written statements": DraftCategory.WRITTEN_STATEMENT,
    "written_statements": DraftCategory.WRITTEN_STATEMENT,
    "written statement": DraftCategory.WRITTEN_STATEMENT,
    "written_statement": DraftCategory.WRITTEN_STATEMENT,
    "notices": DraftCategory.NOTICE,
    "notice": DraftCategory.NOTICE,
    "agreements": DraftCategory.AGREEMENT,
    "agreement": DraftCategory.AGREEMENT,
    "appeals": DraftCategory.APPEAL,
    "appeal": DraftCategory.APPEAL,
    "vakalatnama": DraftCategory.VAKALATNAMA,
    "motions": DraftCategory.MOTION,
    "motion": DraftCategory.MOTION,
    "bail": DraftCategory.APPLICATION,
    "civil": DraftCategory.PETITION,
    "other": DraftCategory.OTHER,
}

LANG_ALIASES = {
    "en": DraftLanguage.ENGLISH,
    "english": DraftLanguage.ENGLISH,
    "hi": DraftLanguage.HINDI,
    "hindi": DraftLanguage.HINDI,
    "mr": DraftLanguage.MARATHI,
    "marathi": DraftLanguage.MARATHI,
    "gu": DraftLanguage.GUJARATI,
    "gujarati": DraftLanguage.GUJARATI,
}


def serialize_draft(d: Draft) -> dict:
    client_name = None
    if d.client:
        client_name = d.client.name
    case_no = None
    case_title = None
    if d.case:
        case_no = d.case.case_no
        case_title = d.case.title

    return {
        "id": str(d.id),
        "title": d.title,
        "content": d.content,
        "category": d.category.value if hasattr(d.category, "value") else str(d.category),
        "practice_area": d.practice_area,
        "subcategory": d.subcategory,
        "court_type": d.court_type,
        "storage_url": d.storage_url,
        "status": d.status,
        "language": d.language.value if hasattr(d.language, "value") else str(d.language),
        "case_id": str(d.case_id) if d.case_id else None,
        "client_id": str(d.client_id) if d.client_id else None,
        "client_name": client_name,
        "case_number": case_no,
        "case_title": case_title,
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
    case_id: Optional[str] = None
    client_id: Optional[str] = None


class AutoFillRequest(BaseModel):
    template_content: str
    client_id: uuid.UUID
    case_id: Optional[uuid.UUID] = None


@router.get("/templates")
async def list_templates(
    category: Optional[str] = None,
    language: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    """Return firm's own templates + global public templates."""
    from sqlalchemy import or_ as sql_or
    
    # Check if public templates exist; if not, auto-seed
    public_count = db.query(Draft).filter(Draft.is_public_template == True).count()
    if public_count == 0:
        try:
            from app.services.template_seeds import seed_master_templates
            seed_master_templates(db)
        except Exception:
            pass

    q = db.query(Draft).options(joinedload(Draft.client), joinedload(Draft.case)).filter(
        Draft.is_template == True,
        Draft.is_deleted == False,
    ).filter(
        sql_or(
            Draft.firm_id == current_user.firm_id,
            Draft.is_public_template == True,
        )
    )

    if category:
        clean_cat = category.lower().strip()
        mapped_cat = CATEGORY_ALIASES.get(clean_cat)
        if mapped_cat:
            q = q.filter(Draft.category == mapped_cat)
        else:
            q = q.filter(Draft.category.ilike(f"%{clean_cat}%"))

    if language:
        clean_lang = language.lower().strip()
        mapped_lang = LANG_ALIASES.get(clean_lang)
        if mapped_lang:
            q = q.filter(Draft.language == mapped_lang)

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
    skip: int = 0, limit: int = 100, category: Optional[str] = None,
    language: Optional[str] = None, search: Optional[str] = None,
    is_template: Optional[bool] = None, case_id: Optional[str] = None,
    client_id: Optional[str] = None, status: Optional[str] = None,
    db: Session = Depends(get_db), current_user: User = Depends(require_firm_member),
):
    from sqlalchemy import or_ as sql_or
    query = db.query(Draft).options(
        joinedload(Draft.client), joinedload(Draft.case)
    ).filter(
        Draft.is_deleted == False
    )

    if is_template is False:
        # User drafts: belong to user's firm only
        query = query.filter(
            Draft.firm_id == current_user.firm_id,
            Draft.is_template == False,
        )
    else:
        query = query.filter(
            sql_or(
                Draft.firm_id == current_user.firm_id,
                Draft.is_public_template == True,
            )
        )
        if is_template is True:
            query = query.filter(Draft.is_template == True)

    if category:
        clean_cat = category.lower().strip()
        mapped_cat = CATEGORY_ALIASES.get(clean_cat)
        if mapped_cat:
            query = query.filter(Draft.category == mapped_cat)
        else:
            query = query.filter(Draft.category.ilike(f"%{clean_cat}%"))

    if language:
        clean_lang = language.lower().strip()
        mapped_lang = LANG_ALIASES.get(clean_lang)
        if mapped_lang:
            query = query.filter(Draft.language == mapped_lang)

    if search:
        query = query.filter(Draft.title.ilike(f"%{search}%"))
    if case_id:
        query = query.filter(Draft.case_id == case_id)
    if client_id:
        query = query.filter(Draft.client_id == client_id)
    if status:
        query = query.filter(Draft.status == status)

    total = query.count()
    drafts = query.order_by(Draft.updated_at.desc(), Draft.created_at.desc()).offset(skip).limit(limit).all()
    return {"total": total, "drafts": [serialize_draft(d) for d in drafts]}


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_draft(
    data: DraftCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    word_count = len(data.content.split()) if data.content else 0
    clean_cat = data.category.lower().strip() if data.category else "other"
    mapped_cat = CATEGORY_ALIASES.get(clean_cat, DraftCategory.OTHER)

    clean_lang = data.language.lower().strip() if data.language else "en"
    mapped_lang = LANG_ALIASES.get(clean_lang, DraftLanguage.ENGLISH)

    draft_dict = data.model_dump()
    draft_dict["category"] = mapped_cat
    draft_dict["language"] = mapped_lang

    draft = Draft(
        **draft_dict,
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
    draft = db.query(Draft).options(
        joinedload(Draft.client), joinedload(Draft.case)
    ).filter(Draft.id == draft_id).first()
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
        if field == "category" and val:
            clean_cat = val.lower().strip()
            setattr(draft, field, CATEGORY_ALIASES.get(clean_cat, val))
        elif field == "language" and val:
            clean_lang = val.lower().strip()
            setattr(draft, field, LANG_ALIASES.get(clean_lang, val))
        else:
            setattr(draft, field, val)

    if data.content is not None:
        draft.word_count = len(data.content.split())
        draft.version = (draft.version or 1) + 1

    draft.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(draft)
    return serialize_draft(draft)


@router.post("/{draft_id}/copy")
async def copy_draft(
    draft_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    """Save As: creates a duplicate copy of the draft with '(Copy)' in title."""
    draft = db.query(Draft).filter(Draft.id == draft_id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    if not draft.is_public_template:
        check_object_firm(draft, current_user)

    copy_title = f"{draft.title} (Copy)"
    new_draft = Draft(
        title=copy_title,
        content=draft.content,
        category=draft.category,
        practice_area=draft.practice_area,
        subcategory=draft.subcategory,
        court_type=draft.court_type,
        status="active",
        language=draft.language,
        case_id=draft.case_id,
        client_id=draft.client_id,
        tags=list(draft.tags or []),
        is_template=False,
        is_public_template=False,
        version=1,
        word_count=draft.word_count,
        firm_id=get_user_firm_id(current_user),
        created_by_id=current_user.id,
    )
    db.add(new_draft)
    db.commit()
    db.refresh(new_draft)
    return serialize_draft(new_draft)



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
