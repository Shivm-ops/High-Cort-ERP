import copy
import ipaddress
import os
import re
import socket
import uuid
from datetime import datetime
from typing import Any, Dict, Optional
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

from app.core.database import get_db
from app.core.permissions import ROLES_ADMIN, require_firm_member, require_roles
from app.models.firm import Firm
from app.models.kyc import DocumentType, EntityType, KycRecord, KycStatus
from app.models.user import User

router = APIRouter()

SUPPORTED_LANGUAGES = {"en", "mr", "hi", "gu"}
MAX_IMAGE_STR_LEN = 3_000_000
MAX_KYC_FILE_BYTES = 10 * 1024 * 1024
ALLOWED_KYC_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".webp"}

DEFAULT_FIRM_SETTINGS: Dict[str, Any] = {
    "drafts": {
        "default_language": "en",
        "preferred_categories": ["Civil", "Criminal", "Corporate", "Family", "Property"],
    },
    "notifications": {
        "alerts": {
            "expiry": True,
            "hearing": True,
            "deadline": True,
            "payment": False,
            "team": True,
        },
        "channels": {
            "email": True,
            "sms": False,
            "whatsapp": False,
            "inapp": True,
        },
    },
    "billing": {
        "default_gst_rate": "18%",
        "invoice_prefix": "INV-2026-",
        "payment_terms": "Net 15",
        "upi_qr_data": "",
    },
    "efiling": {
        "state": "Maharashtra",
        "district": "Mumbai City",
        "portals": {
            "ecourts": {"username": "", "configured": False},
            "hc_efiling": {"username": "", "configured": False},
            "consumer": {"username": "", "configured": False},
            "mact": {"username": "", "configured": False},
        },
    },
    "integrations": {
        "whatsapp_enabled": False,
        "whatsapp_phone_id": "",
        "has_whatsapp_token": False,
    },
    "role_permissions": {
        "Senior Advocate": ["view", "create", "edit", "delete", "approve"],
        "Associate Advocate": ["view", "create", "edit"],
        "Junior Advocate": ["view", "create"],
        "Paralegal": ["view", "create"],
        "Clerk": ["view"],
        "Admin": ["view", "create", "edit", "delete", "approve"],
    },
    "branding_assets": {
        "dashboard_logo": "",
        "login_branding": "",
        "invoice_accent": "",
        "portal_banner": "",
    },
}


def _validate_image_str(val: Optional[str], field_name: str) -> None:
    if val is not None and len(val) > MAX_IMAGE_STR_LEN:
        raise HTTPException(
            status_code=400,
            detail=f"{field_name} exceeds maximum allowed size (~2 MB image).",
        )


def _deep_merge(base: Dict[str, Any], override: Dict[str, Any]) -> Dict[str, Any]:
    result = copy.deepcopy(base)
    for key, value in (override or {}).items():
        if isinstance(value, dict) and isinstance(result.get(key), dict):
            result[key] = _deep_merge(result[key], value)
        else:
            result[key] = copy.deepcopy(value)
    return result


def _sanitize_firm_settings(raw: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    merged = _deep_merge(DEFAULT_FIRM_SETTINGS, raw or {})

    # Mask sensitive WhatsApp token from API responses
    raw_integrations = (raw or {}).get("integrations") or {}
    has_token = bool(raw_integrations.get("whatsapp_api_token"))
    integrations = merged.get("integrations") or {}
    integrations.pop("whatsapp_api_token", None)
    integrations["has_whatsapp_token"] = has_token
    merged["integrations"] = integrations

    # Strip any legacy password fields inside portal objects
    portals = (merged.get("efiling") or {}).get("portals") or {}
    for portal_key, portal_val in portals.items():
        if isinstance(portal_val, dict):
            portal_val.pop("password", None)
            portal_val["configured"] = bool(portal_val.get("username"))

    return merged


def _serialize_kyc_record(r: KycRecord) -> dict:
    has_file = bool(
        r.document_url
        and not r.document_url.startswith("blob:")
        and os.path.isfile(r.document_url)
    )
    doc_type_val = (
        r.document_type.value
        if hasattr(r.document_type, "value")
        else str(r.document_type)
    )
    status_val = r.status.value if hasattr(r.status, "value") else str(r.status)
    return {
        "id": str(r.id),
        "document_type": doc_type_val,
        "document_number": (
            "********" + str(r.document_number)[-4:] if r.document_number else None
        ),
        "document_url": r.document_url,
        "has_file": has_file,
        "status": status_val,
        "rejection_reason": r.rejection_reason,
        "submitted_at": r.submitted_at.isoformat() if r.submitted_at else None,
    }


def serialize_user(u: User) -> dict:
    from app.services.tenant_domain import domain_fields

    payload = {
        "id": str(u.id),
        "email": u.email,
        "full_name": u.full_name,
        "role": u.user_type.value if u.user_type else "associate_advocate",
        "phone": u.phone,
        "address": u.address,
        "bar_council_no": u.bar_council_no,
        "avatar_url": u.avatar_url,
        "signature_url": getattr(u, "signature_url", None),
        "seal_url": getattr(u, "seal_url", None),
        "preferred_language": getattr(u, "preferred_language", "en") or "en",
        "preferences": getattr(u, "preferences_json", None) or {},
        "firm_id": str(u.firm_id) if u.firm_id else None,
        "firm_name": u.firm.name if u.firm else None,
    }
    if u.firm:
        payload.update(domain_fields(u.firm))
    return payload


class LanguageUpdate(BaseModel):
    preferred_language: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    bar_council_no: Optional[str] = None
    address: Optional[str] = None
    preferred_language: Optional[str] = None
    avatar_url: Optional[str] = None
    signature_url: Optional[str] = None
    seal_url: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None


class KycSubmitRequest(BaseModel):
    document_type: str
    document_number: str
    document_url: str


class FirmUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    gst_no: Optional[str] = None
    pan_no: Optional[str] = None
    website: Optional[str] = None
    custom_domain: Optional[str] = None
    logo_url: Optional[str] = None
    ai_provider: Optional[str] = None
    ai_api_key: Optional[str] = None
    ai_api_base: Optional[str] = None
    ai_model: Optional[str] = None


class FirmSettingsUpdate(BaseModel):
    drafts: Optional[Dict[str, Any]] = None
    notifications: Optional[Dict[str, Any]] = None
    billing: Optional[Dict[str, Any]] = None
    efiling: Optional[Dict[str, Any]] = None
    integrations: Optional[Dict[str, Any]] = None
    role_permissions: Optional[Dict[str, Any]] = None
    branding_assets: Optional[Dict[str, Any]] = None


def _serialize_firm(firm: Firm) -> dict:
    from app.services.tenant_domain import domain_fields

    return {
        "id": str(firm.id),
        "name": firm.name,
        "email": firm.email,
        "phone": firm.phone,
        "address": firm.address,
        "gst_no": firm.gst_no,
        "pan_no": firm.pan_no,
        "website": firm.website,
        "logo_url": getattr(firm, "logo_url", None),
        "ai_provider": firm.ai_provider or "platform",
        "ai_api_base": firm.ai_api_base,
        "ai_model": firm.ai_model,
        "has_api_key": bool(firm.ai_api_key),
        **domain_fields(firm),
    }


@router.get("/advocates")
async def list_advocates(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    """Return active advocates in the same firm only — used for case assignment dropdowns."""
    users = (
        db.query(User)
        .filter(
            User.firm_id == current_user.firm_id,
            User.is_active == True,
        )
        .order_by(User.full_name)
        .all()
    )
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
    _validate_image_str(data.avatar_url, "Advocate photograph")
    _validate_image_str(data.signature_url, "Digital signature")
    _validate_image_str(data.seal_url, "Advocate seal")

    if data.full_name is not None:
        current_user.full_name = data.full_name.strip() or current_user.full_name
    if data.phone is not None:
        current_user.phone = data.phone.strip() or None
    if data.bar_council_no is not None:
        current_user.bar_council_no = data.bar_council_no.strip() or None
    if data.address is not None:
        current_user.address = data.address.strip() or None
    if data.avatar_url is not None:
        current_user.avatar_url = data.avatar_url or None
    if data.signature_url is not None:
        current_user.signature_url = data.signature_url or None
    if data.seal_url is not None:
        current_user.seal_url = data.seal_url or None
    if data.preferred_language is not None:
        if data.preferred_language not in SUPPORTED_LANGUAGES:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported language. Allowed: {SUPPORTED_LANGUAGES}",
            )
        current_user.preferred_language = data.preferred_language
    if data.preferences is not None:
        existing_preferences = dict(getattr(current_user, "preferences_json", None) or {})
        current_user.preferences_json = _deep_merge(existing_preferences, data.preferences)
        flag_modified(current_user, "preferences_json")

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
            detail=f"Unsupported language '{data.preferred_language}'. Allowed: en, mr, hi, gu",
        )
    current_user.preferred_language = data.preferred_language
    db.commit()
    return {"preferred_language": current_user.preferred_language, "message": "Language updated"}


@router.get("/me/kyc")
async def get_my_kyc(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    records = (
        db.query(KycRecord)
        .filter(
            KycRecord.user_id == current_user.id,
            KycRecord.entity_type == EntityType.USER,
        )
        .order_by(KycRecord.submitted_at.desc())
        .all()
    )
    return [_serialize_kyc_record(r) for r in records]


@router.post("/me/kyc")
async def submit_my_kyc(
    data: KycSubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    try:
        doc_enum = DocumentType(data.document_type)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid KYC document type")

    existing = (
        db.query(KycRecord)
        .filter(
            KycRecord.user_id == current_user.id,
            KycRecord.document_type == doc_enum,
            KycRecord.status.in_([KycStatus.PENDING, KycStatus.APPROVED]),
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"KYC for {data.document_type} is already {existing.status.value}",
        )

    new_kyc = KycRecord(
        entity_type=EntityType.USER,
        user_id=current_user.id,
        firm_id=current_user.firm_id,
        document_type=doc_enum,
        document_number=data.document_number.strip(),
        document_url=data.document_url,
        status=KycStatus.PENDING,
        submitted_at=datetime.utcnow(),
    )
    db.add(new_kyc)
    db.commit()
    db.refresh(new_kyc)
    return {"message": "KYC document submitted successfully", "id": str(new_kyc.id)}


@router.post("/me/kyc/upload")
async def upload_my_kyc(
    document_type: str = Form(...),
    document_number: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    """Upload a real KYC file to server storage and record the verification request."""
    try:
        doc_enum = DocumentType(document_type)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid KYC document type")

    doc_num_clean = (document_number or "").strip()
    if not doc_num_clean:
        raise HTTPException(status_code=400, detail="Document number is required")

    existing = (
        db.query(KycRecord)
        .filter(
            KycRecord.user_id == current_user.id,
            KycRecord.document_type == doc_enum,
            KycRecord.status.in_([KycStatus.PENDING, KycStatus.APPROVED]),
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"KYC for {document_type} is already {existing.status.value}",
        )

    orig_name = os.path.basename(file.filename or "kyc_document")
    ext = os.path.splitext(orig_name)[1].lower()
    if ext not in ALLOWED_KYC_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file format. Please upload PDF, PNG, JPG, JPEG, or WEBP.",
        )

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")
    if len(contents) > MAX_KYC_FILE_BYTES:
        raise HTTPException(status_code=400, detail="KYC file exceeds maximum limit of 10 MB")

    safe_name = re.sub(r"[^A-Za-z0-9._-]", "_", orig_name)
    kyc_dir = os.path.join("uploads", "kyc", str(current_user.id))
    os.makedirs(kyc_dir, exist_ok=True)
    disk_name = f"{uuid.uuid4().hex}_{safe_name}"
    file_path = os.path.join(kyc_dir, disk_name)

    with open(file_path, "wb") as out_file:
        out_file.write(contents)

    new_kyc = KycRecord(
        entity_type=EntityType.USER,
        user_id=current_user.id,
        firm_id=current_user.firm_id,
        document_type=doc_enum,
        document_number=doc_num_clean,
        document_url=file_path,
        status=KycStatus.PENDING,
        submitted_at=datetime.utcnow(),
    )
    db.add(new_kyc)
    db.commit()
    db.refresh(new_kyc)
    return _serialize_kyc_record(new_kyc)


@router.get("/me/kyc/{kyc_id}/download")
async def download_my_kyc(
    kyc_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    try:
        kyc_uuid = uuid.UUID(kyc_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid KYC record ID")

    record = db.query(KycRecord).filter(KycRecord.id == kyc_uuid).first()
    if not record:
        raise HTTPException(status_code=404, detail="KYC record not found")

    if not current_user.is_superadmin and record.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    if (
        not record.document_url
        or record.document_url.startswith("blob:")
        or not os.path.isfile(record.document_url)
    ):
        raise HTTPException(status_code=404, detail="KYC file not found on server")

    return FileResponse(record.document_url, filename=os.path.basename(record.document_url))


@router.get("/me/firm")
async def get_my_firm(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    from app.services.tenant_domain import ensure_firm_subdomain

    firm = current_user.firm
    if not firm:
        raise HTTPException(status_code=404, detail="Firm not found")
    ensure_firm_subdomain(db, firm)
    db.commit()
    return _serialize_firm(firm)


def _validate_ai_base_url(raw_url: str) -> str:
    """Validate BYOK AI base URL to prevent SSRF against internal or private hosts."""
    cleaned = raw_url.strip()
    parsed = urlparse(cleaned)
    if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password:
        raise HTTPException(status_code=400, detail="AI API base URL must be a valid HTTPS URL without credentials")

    host = parsed.hostname.strip().lower()
    if host in {"localhost", "metadata.google.internal"}:
        raise HTTPException(status_code=400, detail="Private or internal AI API host is not allowed")

    def _is_forbidden_ip(ip_str: str) -> bool:
        try:
            ip_obj = ipaddress.ip_address(ip_str)
            return (
                ip_obj.is_private
                or ip_obj.is_loopback
                or ip_obj.is_link_local
                or ip_obj.is_multicast
                or ip_obj.is_reserved
                or ip_obj.is_unspecified
            )
        except ValueError:
            return False

    if _is_forbidden_ip(host):
        raise HTTPException(status_code=400, detail="Private or reserved IP addresses are not allowed for AI API base URL")

    try:
        addr_info = socket.getaddrinfo(host, parsed.port or 443, type=socket.SOCK_STREAM)
        for item in addr_info:
            resolved_ip = item[4][0]
            if _is_forbidden_ip(resolved_ip):
                raise HTTPException(status_code=400, detail="Resolved AI API host points to a private or internal network")
    except socket.gaierror:
        raise HTTPException(status_code=400, detail="Unable to resolve AI API base hostname")

    return cleaned


@router.patch("/me/firm")
async def update_my_firm(
    data: FirmUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    firm = current_user.firm
    if not firm:
        raise HTTPException(status_code=404, detail="Firm not found")

    _validate_image_str(data.logo_url, "Firm logo")

    from app.services.tenant_domain import ensure_firm_subdomain, normalize_custom_domain

    if data.name is not None:
        firm.name = data.name
    if data.email is not None:
        firm.email = data.email
    if data.phone is not None:
        firm.phone = data.phone
    if data.address is not None:
        firm.address = data.address
    if data.gst_no is not None:
        firm.gst_no = data.gst_no
    if data.pan_no is not None:
        firm.pan_no = data.pan_no
    if data.website is not None:
        firm.website = data.website
    if data.logo_url is not None:
        firm.logo_url = data.logo_url or None
    if data.custom_domain is not None:
        try:
            custom = normalize_custom_domain(data.custom_domain)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc))
        if custom:
            clash = (
                db.query(Firm)
                .filter(Firm.custom_domain == custom, Firm.id != firm.id)
                .first()
            )
            if clash:
                raise HTTPException(status_code=400, detail="This domain is already in use")
        firm.custom_domain = custom
    ensure_firm_subdomain(db, firm)

    # BYOK settings (admin-only)
    if any(
        val is not None
        for val in (data.ai_provider, data.ai_api_key, data.ai_api_base, data.ai_model)
    ):
        if not current_user.is_superadmin and current_user.user_type not in ROLES_ADMIN:
            raise HTTPException(status_code=403, detail="Only firm administrators can update AI provider settings")

    if data.ai_provider is not None:
        firm.ai_provider = data.ai_provider
    if data.ai_api_key is not None:
        if data.ai_api_key == "":
            firm.ai_api_key = None
        elif not data.ai_api_key.startswith("********"):
            firm.ai_api_key = data.ai_api_key
    if data.ai_api_base is not None:
        firm.ai_api_base = _validate_ai_base_url(data.ai_api_base) if data.ai_api_base.strip() else None
    if data.ai_model is not None:
        firm.ai_model = data.ai_model

    db.commit()
    db.refresh(firm)
    return _serialize_firm(firm)


@router.get("/me/firm/settings")
async def get_my_firm_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    """Return firm-wide workflow, billing, notification, e-filing, and branding settings."""
    firm = current_user.firm
    if not firm:
        raise HTTPException(status_code=404, detail="Firm not found")
    return _sanitize_firm_settings(getattr(firm, "settings_json", None))


@router.patch("/me/firm/settings")
async def update_my_firm_settings(
    data: FirmSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    """Persist firm-wide settings into firms.settings_json."""
    firm = current_user.firm
    if not firm:
        raise HTTPException(status_code=404, detail="Firm not found")

    if data.billing and "upi_qr_data" in data.billing:
        _validate_image_str(data.billing.get("upi_qr_data"), "UPI QR Code")
    if data.branding_assets:
        for asset_key, asset_val in data.branding_assets.items():
            if isinstance(asset_val, str):
                _validate_image_str(asset_val, f"Branding asset ({asset_key})")

    incoming = data.model_dump(exclude_none=True)
    current_raw = copy.deepcopy(getattr(firm, "settings_json", None) or {})

    # Preserve or clear WhatsApp API token safely without ever returning plaintext
    if "integrations" in incoming and isinstance(incoming["integrations"], dict):
        integration_in = incoming["integrations"]
        existing_token = (current_raw.get("integrations") or {}).get("whatsapp_api_token")
        if "whatsapp_api_token" in integration_in:
            raw_tok = integration_in.get("whatsapp_api_token") or ""
            if raw_tok == "":
                integration_in["whatsapp_api_token"] = ""
            elif raw_tok.startswith("********"):
                integration_in["whatsapp_api_token"] = existing_token or ""
        elif existing_token:
            integration_in["whatsapp_api_token"] = existing_token
        integration_in.pop("has_whatsapp_token", None)

    # Never store raw portal passwords in settings JSON
    if "efiling" in incoming and isinstance(incoming["efiling"], dict):
        portals = incoming["efiling"].get("portals")
        if isinstance(portals, dict):
            for p_key, p_val in portals.items():
                if isinstance(p_val, dict):
                    p_val.pop("password", None)
                    p_val["configured"] = bool((p_val.get("username") or "").strip())

    updated = _deep_merge(current_raw, incoming)
    firm.settings_json = updated
    flag_modified(firm, "settings_json")
    db.commit()
    db.refresh(firm)
    return _sanitize_firm_settings(firm.settings_json)


@router.get("/")
async def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*ROLES_ADMIN)),
):
    """Admin-only: list all users in the same firm."""
    if current_user.is_superadmin:
        users = db.query(User).filter(User.is_active == True).all()
    else:
        users = (
            db.query(User)
            .filter(
                User.firm_id == current_user.firm_id,
                User.is_active == True,
            )
            .all()
        )
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
    if not current_user.is_superadmin and str(user.firm_id) != str(current_user.firm_id):
        raise HTTPException(status_code=403, detail="Access denied")
    return serialize_user(user)
