import re
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from typing import Optional
from pydantic import BaseModel
from datetime import datetime, timezone
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

CATEGORY_MAP = {
    "application": DraftCategory.APPLICATION,
    "applications": DraftCategory.APPLICATION,
    "affidavit": DraftCategory.AFFIDAVIT,
    "affidavits": DraftCategory.AFFIDAVIT,
    "petition": DraftCategory.PETITION,
    "petitions": DraftCategory.PETITION,
    "complaint": DraftCategory.COMPLAINT,
    "complaints": DraftCategory.COMPLAINT,
    "reply": DraftCategory.REPLY,
    "replies": DraftCategory.REPLY,
    "written_statement": DraftCategory.WRITTEN_STATEMENT,
    "written_statements": DraftCategory.WRITTEN_STATEMENT,
    "written statement": DraftCategory.WRITTEN_STATEMENT,
    "written statements": DraftCategory.WRITTEN_STATEMENT,
    "notice": DraftCategory.NOTICE,
    "notices": DraftCategory.NOTICE,
    "agreement": DraftCategory.AGREEMENT,
    "agreements": DraftCategory.AGREEMENT,
    "appeal": DraftCategory.APPEAL,
    "appeals": DraftCategory.APPEAL,
    "vakalatnama": DraftCategory.VAKALATNAMA,
    "motion": DraftCategory.MOTION,
    "motions": DraftCategory.MOTION,
    "other": DraftCategory.OTHER,
}

LANGUAGE_MAP = {
    "en": DraftLanguage.ENGLISH,
    "english": DraftLanguage.ENGLISH,
    "mr": DraftLanguage.MARATHI,
    "marathi": DraftLanguage.MARATHI,
    "hi": DraftLanguage.HINDI,
    "hindi": DraftLanguage.HINDI,
    "gu": DraftLanguage.GUJARATI,
    "gujarati": DraftLanguage.GUJARATI,
}

CATEGORY_ALIASES = CATEGORY_MAP
LANG_ALIASES = LANGUAGE_MAP

def normalize_category(cat: Optional[str]) -> Optional[DraftCategory]:
    if not cat:
        return None
    cleaned = cat.strip().lower()
    if cleaned in CATEGORY_MAP:
        return CATEGORY_MAP[cleaned]
    upper = cat.strip().upper()
    if hasattr(DraftCategory, upper):
        return getattr(DraftCategory, upper)
    return DraftCategory.OTHER

def normalize_language(lang: Optional[str]) -> Optional[DraftLanguage]:
    if not lang:
        return None
    cleaned = lang.strip().lower()
    if cleaned in LANGUAGE_MAP:
        return LANGUAGE_MAP[cleaned]
    upper = lang.strip().upper()
    if hasattr(DraftLanguage, upper):
        return getattr(DraftLanguage, upper)
    return DraftLanguage.ENGLISH


def serialize_draft(d: Draft) -> dict:
    cat_str = d.category.value if hasattr(d.category, "value") else str(d.category)
    lang_str = d.language.value if hasattr(d.language, "value") else str(d.language)
    return {
        "id": str(d.id),
        "title": d.title,
        "content": d.content or "",
        "category": cat_str,
        "practice_area": d.practice_area,
        "subcategory": d.subcategory,
        "court_type": d.court_type,
        "storage_url": d.storage_url,
        "status": d.status or "active",
        "language": lang_str,
        "case_id": str(d.case_id) if d.case_id else None,
        "client_id": str(d.client_id) if d.client_id else None,
        "client_name": d.client.name if d.client else None,
        "case_no": d.case.case_no if d.case else None,
        "case_title": d.case.title if d.case else None,
        "tags": d.tags or [],
        "is_template": bool(d.is_template),
        "is_public_template": bool(d.is_public_template),
        "ai_generated": bool(d.ai_generated),
        "version": d.version or 1,
        "parent_id": str(d.parent_id) if d.parent_id else None,
        "word_count": d.word_count or 0,
        "firm_id": str(d.firm_id) if d.firm_id else None,
        "created_at": d.created_at.isoformat() if d.created_at else None,
        "updated_at": d.updated_at.isoformat() if d.updated_at else None,
    }


class DraftCreate(BaseModel):
    title: str
    content: Optional[str] = None
    category: str = "other"
    practice_area: Optional[str] = None
    subcategory: Optional[str] = None
    court_type: Optional[str] = None
    storage_url: Optional[str] = None
    status: Optional[str] = "active"
    language: str = "en"
    case_id: Optional[str] = None
    client_id: Optional[str] = None
    parent_id: Optional[str] = None
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
    case_id: Optional[str] = None
    client_id: Optional[str] = None
    tags: Optional[list] = None
    is_template: Optional[bool] = None


class AutoFillRequest(BaseModel):
    template_content: str
    client_id: Optional[uuid.UUID] = None
    case_id: Optional[uuid.UUID] = None


@router.get("/templates")
async def list_templates(
    category: Optional[str] = None,
    language: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    """Return firm's own templates + global public templates."""
    from sqlalchemy import or_ as sql_or
    q = db.query(Draft).filter(Draft.is_template == True).filter(
        sql_or(
            Draft.firm_id == current_user.firm_id,
            Draft.is_public_template == True,
            Draft.firm_id.is_(None),
        )
    )
    if category:
        norm_cat = normalize_category(category)
        if norm_cat:
            q = q.filter(Draft.category == norm_cat)
    if language:
        norm_lang = normalize_language(language)
        if norm_lang:
            q = q.filter(Draft.language == norm_lang)
    if search:
        q = q.filter(Draft.title.ilike(f"%{search.strip()}%"))

    templates = q.order_by(Draft.title).all()
    return {"total": len(templates), "templates": [serialize_draft(t) for t in templates]}


@router.post("/auto-fill")
async def auto_fill_draft(
    req: AutoFillRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    client = None
    if req.client_id:
        client = apply_firm_filter(db.query(Client), Client, current_user).filter(
            Client.id == req.client_id
        ).first()

    case = None
    if req.case_id:
        case = apply_firm_filter(db.query(Case), Case, current_user).filter(
            Case.id == req.case_id
        ).first()

    advocate_name = current_user.full_name
    client_age = ""
    client_address = ""
    client_name = ""
    client_occupation = ""
    aadhaar = ""
    pan = ""

    if client:
        client_name = client.name or ""
        if client.date_of_birth:
            today = datetime.now(timezone.utc).date()
            age = today.year - client.date_of_birth.year - (
                (today.month, today.day) < (client.date_of_birth.month, client.date_of_birth.day)
            )
            client_age = str(age)
        address_parts = [p for p in [client.address, client.city, client.state, client.pincode] if p]
        client_address = ", ".join(address_parts)
        client_occupation = client.occupation or ""
        aadhaar = client.aadhaar_number or ""
        pan = client.pan or ""

    merge_map = {
        "client_name": client_name,
        "client_address": client_address,
        "client_age": client_age,
        "client_occupation": client_occupation,
        "aadhaar": aadhaar,
        "pan": pan,
        "case_number": (case.case_no or "") if case else "",
        "court_name": (case.court or "") if case else "",
        "judge_name": (case.judge or "") if case else "",
        "opponent_name": (case.respondent or case.petitioner or "") if case else "",
        "advocate_name": advocate_name or "",
        "filing_number": (case.case_no or "") if case else "",
        "practice_area": (case.practice_area or "") if case else "",
        "petitioner": (case.petitioner or client_name or "") if case else client_name,
        "respondent": (case.respondent or "") if case else "",
    }

    filled = req.template_content or ""
    for key, value in merge_map.items():
        filled = re.sub(r"\{\{" + re.escape(key) + r"\}\}", str(value), filled, flags=re.IGNORECASE)

    # Clean up any leftover placeholder tag
    filled = filled.replace("[DRAFT CONTENT HERE]", "1. That the facts and circumstances of the case are as set forth hereunder:\n\n2. That the applicant/petitioner has reasonable grounds to seek relief as prayed.\n\nPRAYER:\nWherefore it is prayed that this Hon'ble Court may be pleased to grant relief in the interest of justice.")

    return {
        "filled_content": filled,
        "merge_map": merge_map,
        "client_name": client_name,
        "case_no": case.case_no if case else None,
    }


@router.get("/")
async def list_drafts(
    skip: int = 0, limit: int = 100, category: Optional[str] = None,
    language: Optional[str] = None, search: Optional[str] = None,
    is_template: Optional[bool] = None, case_id: Optional[str] = None,
    client_id: Optional[str] = None,
    db: Session = Depends(get_db), current_user: User = Depends(require_firm_member),
):
    from sqlalchemy import or_ as sql_or
    query = db.query(Draft)
    if is_template is True:
        query = query.filter(
            Draft.is_template == True,
            sql_or(
                Draft.firm_id == current_user.firm_id,
                Draft.is_public_template == True,
                Draft.firm_id.is_(None),
            )
        )
    else:
        firm_id = get_user_firm_id(current_user)
        if firm_id:
            query = query.filter(sql_or(Draft.firm_id == firm_id, Draft.created_by_id == current_user.id))
        else:
            query = query.filter(Draft.created_by_id == current_user.id)

    if is_template is not None:
        query = query.filter(Draft.is_template == is_template)
    if category:
        norm_cat = normalize_category(category)
        if norm_cat:
            query = query.filter(Draft.category == norm_cat)
    if language:
        norm_lang = normalize_language(language)
        if norm_lang:
            query = query.filter(Draft.language == norm_lang)
    if search:
        query = query.filter(Draft.title.ilike(f"%{search.strip()}%"))
    if case_id:
        try:
            query = query.filter(Draft.case_id == uuid.UUID(case_id))
        except ValueError:
            pass
    if client_id:
        try:
            query = query.filter(Draft.client_id == uuid.UUID(client_id))
        except ValueError:
            pass

    query = query.filter(Draft.is_deleted == False)
    total = query.count()
    drafts = query.order_by(Draft.updated_at.desc().nullslast()).offset(skip).limit(limit).all()
    return {"total": total, "drafts": [serialize_draft(d) for d in drafts]}


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_draft(
    data: DraftCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    word_count = len((data.content or "").split())
    cat_val = normalize_category(data.category) or DraftCategory.OTHER
    lang_val = normalize_language(data.language) or DraftLanguage.ENGLISH

    draft_dict = data.model_dump()
    draft_dict["category"] = cat_val
    draft_dict["language"] = lang_val

    if data.case_id:
        try:
            draft_dict["case_id"] = uuid.UUID(data.case_id)
        except ValueError:
            draft_dict["case_id"] = None
    else:
        draft_dict["case_id"] = None

    if data.client_id:
        try:
            draft_dict["client_id"] = uuid.UUID(data.client_id)
        except ValueError:
            draft_dict["client_id"] = None
    else:
        draft_dict["client_id"] = None

    if data.parent_id:
        try:
            draft_dict["parent_id"] = uuid.UUID(data.parent_id)
        except ValueError:
            draft_dict["parent_id"] = None
    else:
        draft_dict["parent_id"] = None

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
    try:
        draft_uuid = uuid.UUID(draft_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid draft ID")

    draft = db.query(Draft).filter(Draft.id == draft_uuid).first()
    if not draft or draft.is_deleted:
        raise HTTPException(status_code=404, detail="Draft not found")
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
    try:
        draft_uuid = uuid.UUID(draft_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid draft ID")

    draft = db.query(Draft).filter(Draft.id == draft_uuid).first()
    if not draft or draft.is_deleted:
        raise HTTPException(status_code=404, detail="Draft not found")
    check_object_firm(draft, current_user)

    update_dict = data.model_dump(exclude_none=True)
    if "category" in update_dict and update_dict["category"]:
        update_dict["category"] = normalize_category(update_dict["category"]) or draft.category
    if "language" in update_dict and update_dict["language"]:
        update_dict["language"] = normalize_language(update_dict["language"]) or draft.language

    if "case_id" in update_dict:
        update_dict["case_id"] = uuid.UUID(update_dict["case_id"]) if update_dict["case_id"] else None
    if "client_id" in update_dict:
        update_dict["client_id"] = uuid.UUID(update_dict["client_id"]) if update_dict["client_id"] else None

    for field, val in update_dict.items():
        setattr(draft, field, val)

    if data.content is not None:
        setattr(draft, "word_count", len((data.content or "").split()))
        setattr(draft, "version", int(getattr(draft, "version", 1) or 1) + 1)

    setattr(draft, "updated_at", datetime.now(timezone.utc).replace(tzinfo=None))
    db.commit()
    db.refresh(draft)
    return serialize_draft(draft)


@router.post("/{draft_id}/duplicate")
async def duplicate_draft(
    draft_id: str,
    title: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    """Save As / Duplicate an existing draft into a new draft."""
    try:
        draft_uuid = uuid.UUID(draft_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid draft ID")

    original = db.query(Draft).filter(Draft.id == draft_uuid).first()
    if not original or original.is_deleted:
        raise HTTPException(status_code=404, detail="Original draft not found")
    if not original.is_public_template:
        check_object_firm(original, current_user)

    new_title = (title or "").strip() or f"{original.title} (Copy)"
    copy_draft = Draft(
        title=new_title,
        content=original.content,
        category=original.category,
        practice_area=original.practice_area,
        subcategory=original.subcategory,
        court_type=original.court_type,
        status="active",
        language=original.language,
        case_id=original.case_id,
        client_id=original.client_id,
        created_by_id=current_user.id,
        firm_id=get_user_firm_id(current_user),
        parent_id=original.id,
        version=1,
        word_count=original.word_count,
        is_template=False,
    )
    db.add(copy_draft)
    db.commit()
    db.refresh(copy_draft)
    return serialize_draft(copy_draft)


@router.get("/{draft_id}/versions")
async def get_draft_versions(
    draft_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    try:
        draft_uuid = uuid.UUID(draft_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid draft ID")

    draft = db.query(Draft).filter(Draft.id == draft_uuid).first()
    if not draft or draft.is_deleted:
        raise HTTPException(status_code=404, detail="Draft not found")
    if not draft.is_public_template:
        check_object_firm(draft, current_user)

    from sqlalchemy import or_ as sql_or
    root_id = draft.parent_id if draft.parent_id else draft.id
    versions = db.query(Draft).filter(
        sql_or(Draft.id == root_id, Draft.parent_id == root_id),
        Draft.is_deleted == False
    ).order_by(Draft.version.desc()).all()

    return {"versions": [serialize_draft(v) for v in versions]}


@router.delete("/{draft_id}")
async def delete_draft(
    draft_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    try:
        draft_uuid = uuid.UUID(draft_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid draft ID")

    draft = db.query(Draft).filter(Draft.id == draft_uuid).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    check_object_firm(draft, current_user)

    # Soft delete to preserve integrity
    setattr(draft, "is_deleted", True)
    setattr(draft, "updated_at", datetime.now(timezone.utc).replace(tzinfo=None))
    db.commit()
    return {"message": "Draft deleted successfully"}



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
