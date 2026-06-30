from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from app.core.database import get_db
from app.core.permissions import require_firm_member, require_roles, ROLES_ADMIN
from app.models.user import User
from app.models.kyc import KycRecord, DocumentType, EntityType, KycStatus
from datetime import datetime

router = APIRouter()

SUPPORTED_LANGUAGES = {"en", "mr", "hi", "gu"}


def serialize_user(u: User) -> dict:
    return {
        "id": str(u.id),
        "email": u.email,
        "full_name": u.full_name,
        "role": u.role,
        "phone": u.phone,
        "bar_council_no": u.bar_council_no,
        "preferred_language": getattr(u, "preferred_language", "en") or "en",
        "firm_id": str(u.firm_id) if u.firm_id else None,
    }


class LanguageUpdate(BaseModel):
    preferred_language: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    preferred_language: Optional[str] = None

class KycSubmitRequest(BaseModel):
    document_type: str
    document_number: str
    document_url: str


@router.get("/advocates")
async def list_advocates(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    """Return active advocates in the same firm only — used for case assignment dropdowns."""
    # ── Tenant isolation: only same-firm advocates ────────────────────────────
    users = db.query(User).filter(
        User.firm_id == current_user.firm_id,
        User.is_active == True,
    ).order_by(User.full_name).all()
    return {"advocates": [serialize_user(u) for u in users]}


@router.get("/me")
async def get_me(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    return serialize_user(current_user)


@router.patch("/me")
async def update_me(
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    if data.full_name is not None:
        current_user.full_name = data.full_name
    if data.phone is not None:
        current_user.phone = data.phone
    if data.preferred_language is not None:
        if data.preferred_language not in SUPPORTED_LANGUAGES:
            raise HTTPException(status_code=400, detail=f"Unsupported language. Allowed: {SUPPORTED_LANGUAGES}")
        current_user.preferred_language = data.preferred_language
    db.commit()
    db.refresh(current_user)
    return serialize_user(current_user)


@router.patch("/me/language")
async def update_language(
    data: LanguageUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    if data.preferred_language not in SUPPORTED_LANGUAGES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported language '{data.preferred_language}'. Allowed: en, mr, hi, gu"
        )
    current_user.preferred_language = data.preferred_language
    db.commit()
    return {"preferred_language": current_user.preferred_language, "message": "Language updated"}


@router.get("/me/kyc")
async def get_my_kyc(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    records = db.query(KycRecord).filter(
        KycRecord.user_id == current_user.id,
        KycRecord.entity_type == EntityType.USER
    ).all()
    return [{
        "id": str(r.id),
        "document_type": r.document_type,
        "document_number": "********" + str(r.document_number)[-4:] if r.document_number else None,
        "document_url": r.document_url,
        "status": r.status,
        "rejection_reason": r.rejection_reason,
        "submitted_at": r.submitted_at.isoformat() if r.submitted_at else None
    } for r in records]


@router.post("/me/kyc")
async def submit_my_kyc(
    data: KycSubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    # Check if a pending or approved record already exists for this document type
    existing = db.query(KycRecord).filter(
        KycRecord.user_id == current_user.id,
        KycRecord.document_type == data.document_type,
        KycRecord.status.in_([KycStatus.PENDING, KycStatus.APPROVED])
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"KYC for {data.document_type} is already {existing.status}")

    new_kyc = KycRecord(
        entity_type=EntityType.USER,
        user_id=current_user.id,
        firm_id=current_user.firm_id,
        document_type=DocumentType(data.document_type),
        document_number=data.document_number,
        document_url=data.document_url,
        status=KycStatus.PENDING,
        submitted_at=datetime.utcnow()
    )
    db.add(new_kyc)
    db.commit()
    db.refresh(new_kyc)
    return {"message": "KYC document submitted successfully", "id": str(new_kyc.id)}


@router.get("/")
async def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*ROLES_ADMIN)),
):
    """Admin-only: list all users in the same firm."""
    # ── Tenant isolation ──────────────────────────────────────────────────────
    # Super admin sees all; firm admin sees own firm only
    if current_user.is_superadmin:
        users = db.query(User).filter(User.is_active == True).all()
    else:
        users = db.query(User).filter(
            User.firm_id == current_user.firm_id,
            User.is_active == True,
        ).all()
    return {"users": [serialize_user(u) for u in users]}


@router.get("/{user_id}")
async def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    # ── Object-level security: only own firm unless super admin ───────────────
    if not current_user.is_superadmin and str(user.firm_id) != str(current_user.firm_id):
        raise HTTPException(status_code=403, detail="Access denied")
    return serialize_user(user)


class FirmUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    ai_provider: Optional[str] = None
    ai_api_key: Optional[str] = None
    ai_api_base: Optional[str] = None
    ai_model: Optional[str] = None


@router.get("/me/firm")
async def get_my_firm(
    current_user: User = Depends(require_firm_member),
):
    firm = current_user.firm
    if not firm:
        raise HTTPException(status_code=404, detail="Firm not found")
    
    return {
        "id": str(firm.id),
        "name": firm.name,
        "email": firm.email,
        "phone": firm.phone,
        "address": firm.address,
        "ai_provider": firm.ai_provider or "platform",
        "ai_api_base": firm.ai_api_base,
        "ai_model": firm.ai_model,
        "has_api_key": bool(firm.ai_api_key),
    }


@router.patch("/me/firm")
async def update_my_firm(
    data: FirmUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    firm = current_user.firm
    if not firm:
        raise HTTPException(status_code=404, detail="Firm not found")
        
    if data.name is not None:
        firm.name = data.name
    if data.email is not None:
        firm.email = data.email
    if data.phone is not None:
        firm.phone = data.phone
    if data.address is not None:
        firm.address = data.address
        
    # BYOK settings
    if data.ai_provider is not None:
        firm.ai_provider = data.ai_provider
    if data.ai_api_key is not None:
        if data.ai_api_key == "":
            firm.ai_api_key = None
        elif not data.ai_api_key.startswith("********"):
            firm.ai_api_key = data.ai_api_key
    if data.ai_api_base is not None:
        firm.ai_api_base = data.ai_api_base
    if data.ai_model is not None:
        firm.ai_model = data.ai_model
        
    db.commit()
    db.refresh(firm)
    
    return {
        "id": str(firm.id),
        "name": firm.name,
        "email": firm.email,
        "phone": firm.phone,
        "address": firm.address,
        "ai_provider": firm.ai_provider or "platform",
        "ai_api_base": firm.ai_api_base,
        "ai_model": firm.ai_model,
        "has_api_key": bool(firm.ai_api_key),
    }
