import hmac
import hashlib
import time
import base64
import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, Request
from sqlalchemy.orm import Session, joinedload
from typing import Optional

from app.core.database import get_db
from app.core.config import settings
from app.core.security import get_current_user
from app.core.permissions import (
    require_firm_member, check_object_firm, apply_firm_filter
)
from app.models.document import Document, DocumentType
from app.models.case import Case
from app.models.client import Client
from app.models.user import User
from app.services.document_service import DocumentService
from app.services.audit_service import log_action, extract_ip, AuditAction
from app.services.esign import ESignService

router = APIRouter()
doc_service = DocumentService()

# ── Download token signing ────────────────────────────────────────────────────
_DOWNLOAD_SECRET = (settings.SECRET_KEY + "-doc-download").encode()
_DOWNLOAD_EXPIRY_SEC = 3600   # 1 hour


def _make_download_token(doc_id: str, user_id: str) -> str:
    """Create a time-limited HMAC token for secure document download."""
    expires = int(time.time()) + _DOWNLOAD_EXPIRY_SEC
    payload = f"{doc_id}:{user_id}:{expires}"
    sig = hmac.new(_DOWNLOAD_SECRET, payload.encode(), hashlib.sha256).hexdigest()
    raw = f"{payload}:{sig}"
    return base64.urlsafe_b64encode(raw.encode()).decode()


def _verify_download_token(token: str, doc_id: str, user_id: str) -> bool:
    """Verify the download token has not expired and is authentic."""
    try:
        raw = base64.urlsafe_b64decode(token.encode()).decode()
        parts = raw.rsplit(":", 1)
        if len(parts) != 2:
            return False
        payload, sig = parts
        expected_sig = hmac.new(_DOWNLOAD_SECRET, payload.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected_sig):
            return False
        d_id, u_id, expires = payload.split(":")
        if d_id != doc_id or u_id != user_id:
            return False
        if int(time.time()) > int(expires):
            return False
        return True
    except Exception:
        return False


# ── Firm ownership helpers ────────────────────────────────────────────────────

def _doc_firm_check(doc: Document, current_user: User, db: Session):
    """Verify document belongs to the current user's firm via case or client."""
    if doc.case_id:
        case = db.query(Case).filter(Case.id == doc.case_id).first()
        if case:
            check_object_firm(case, current_user)
            return
    if doc.client_id:
        client = db.query(Client).filter(Client.id == doc.client_id).first()
        if client:
            check_object_firm(client, current_user)
            return
    # Document with no parent — only uploader or superadmin
    if str(doc.uploaded_by_id) != str(current_user.id) and not current_user.is_superadmin:
        raise HTTPException(status_code=403, detail="Access denied")


def _verify_case_firm(case_id, current_user, db):
    if case_id:
        import uuid
        cid = uuid.UUID(case_id) if isinstance(case_id, str) else case_id
        case = apply_firm_filter(db.query(Case), Case, current_user).filter(
            Case.id == cid
        ).first()
        if not case:
            raise HTTPException(status_code=403, detail="Case not found or access denied")


def _verify_client_firm(client_id, current_user, db):
    if client_id:
        import uuid
        cid = uuid.UUID(client_id) if isinstance(client_id, str) else client_id
        client = apply_firm_filter(db.query(Client), Client, current_user).filter(
            Client.id == cid
        ).first()
        if not client:
            raise HTTPException(status_code=403, detail="Client not found or access denied")


def _safe_doc_dict(d: Document) -> dict:
    """Serialize document WITHOUT exposing internal file_path or storage_key."""
    return {
        "id": str(d.id),
        "name": d.name,
        "original_filename": d.original_filename,
        "doc_type": d.doc_type,
        "file_size": d.file_size,
        "mime_type": d.mime_type,
        "description": d.description,
        "is_evidence": d.is_evidence,
        "evidence_status": d.evidence_status,
        "exhibit_number": d.exhibit_number,
        "ocr_processed": d.ocr_processed,
        "case_id": str(d.case_id) if d.case_id else None,
        "case_no": d.case.case_no if d.case else None,
        "case_title": d.case.title if d.case else None,
        "client_id": str(d.client_id) if d.client_id else None,
        "client_name": d.client.name if d.client else None,
        "client_phone": d.client.phone if d.client else None,
        "uploaded_by_id": str(d.uploaded_by_id) if d.uploaded_by_id else None,
        "signature_status": d.signature_status,
        "signature_request_id": d.signature_request_id,
        "created_at": d.created_at.isoformat() if d.created_at else None,
        # ⚠️ file_path intentionally omitted — use /download endpoint instead
    }


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/")
async def list_documents(
    case_id: Optional[str] = None, client_id: Optional[str] = None,
    doc_type: Optional[str] = None, skip: int = 0, limit: int = 50,
    db: Session = Depends(get_db), current_user: User = Depends(require_firm_member),
):
    from sqlalchemy import or_ as sql_or
    firm_case_ids = [c.id for c in apply_firm_filter(db.query(Case), Case, current_user).all()]
    firm_client_ids = [c.id for c in apply_firm_filter(db.query(Client), Client, current_user).all()]

    query = db.query(Document).options(
        joinedload(Document.case),
        joinedload(Document.client)
    ).filter(
        sql_or(
            Document.case_id.in_(firm_case_ids),
            Document.client_id.in_(firm_client_ids),
            Document.uploaded_by_id == current_user.id,
        )
    )
    import uuid
    if case_id:
        _verify_case_firm(case_id, current_user, db)
        cid = uuid.UUID(case_id) if isinstance(case_id, str) else case_id
        query = query.filter(Document.case_id == cid)
    if client_id:
        _verify_client_firm(client_id, current_user, db)
        clid = uuid.UUID(client_id) if isinstance(client_id, str) else client_id
        query = query.filter(Document.client_id == clid)
    if doc_type:
        query = query.filter(Document.doc_type == doc_type)

    total = query.count()
    docs = query.order_by(Document.created_at.desc()).offset(skip).limit(limit).all()
    return {"total": total, "documents": [_safe_doc_dict(d) for d in docs]}


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_document(
    request: Request,
    file: UploadFile = File(...),
    case_id: Optional[str] = Form(None),
    client_id: Optional[str] = Form(None),
    doc_type: str = Form("other"),
    description: Optional[str] = Form(None),
    enable_ocr: bool = Form(True),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    ip = extract_ip(request)
    _verify_case_firm(case_id, current_user, db)
    _verify_client_firm(client_id, current_user, db)

    file_content = await file.read()
    file_url, file_hash = await doc_service.upload_to_storage(file_content, file.filename, file.content_type)

    ocr_text = None
    if enable_ocr and file.content_type in ["application/pdf", "image/jpeg", "image/png", "image/tiff"]:
        ocr_text = await doc_service.extract_text(file_content, file.content_type)

    import uuid
    resolved_case_id = uuid.UUID(case_id) if isinstance(case_id, str) and case_id else case_id
    resolved_client_id = uuid.UUID(client_id) if isinstance(client_id, str) and client_id else client_id
    if resolved_case_id and not resolved_client_id:
        case_obj = db.query(Case).filter(Case.id == resolved_case_id).first()
        if case_obj:
            resolved_client_id = case_obj.client_id

    doc = Document(
        name=file.filename,
        original_filename=file.filename,
        file_path=file_url,          # stored internally
        file_size=len(file_content),
        mime_type=file.content_type,
        doc_type=doc_type,
        case_id=resolved_case_id,
        client_id=resolved_client_id,
        uploaded_by_id=current_user.id,
        description=description,
        ocr_text=ocr_text,
        ocr_processed=ocr_text is not None,
        extracted_metadata={} if ocr_text is None else {
            "Date": "auto-extracted",
            "Parties": [],
        },
        hash_sha256=file_hash,
    )
    db.add(doc)
    db.flush()

    log_action(db, AuditAction.DOCUMENT_UPLOAD, "DOCUMENT", str(doc.id),
               user=current_user, ip=ip,
               details={"filename": file.filename, "size": len(file_content), "doc_type": doc_type})
    db.commit()
    db.refresh(doc)
    return {
        "id": str(doc.id),
        "name": doc.name,
        "ocr_processed": doc.ocr_processed,
        "message": "Document uploaded successfully",
    }


@router.get("/{doc_id}/download")
async def get_download_url(
    doc_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    """
    Return a short-lived presigned URL (S3) or signed token URL (local dev).
    File path is never exposed directly. Firm ownership is verified before URL generation.
    URL expires in 1 hour.
    """
    ip = extract_ip(request)
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # ── Object-level security ─────────────────────────────────────────────────
    _doc_firm_check(doc, current_user, db)

    # ── Generate secure download URL ──────────────────────────────────────────
    if doc_service.s3_client and doc.file_path and doc.file_path.startswith("https://"):
        # Extract S3 key from URL
        bucket_url = f"https://{settings.AWS_S3_BUCKET}.s3.{settings.AWS_REGION}.amazonaws.com/"
        object_key = doc.file_path.replace(bucket_url, "")
        download_url = await doc_service.generate_download_url(object_key, expiry_seconds=3600)
        url_type = "presigned_s3"
    else:
        # Local dev: HMAC-signed token via our own API
        token = _make_download_token(doc_id, str(current_user.id))
        download_url = f"/api/v1/documents/{doc_id}/stream?token={token}"
        url_type = "signed_local"

    log_action(db, AuditAction.DOCUMENT_DOWNLOAD, "DOCUMENT", doc_id,
               user=current_user, ip=ip,
               details={"filename": doc.name, "url_type": url_type})
    db.commit()

    return {
        "download_url": download_url,
        "filename": doc.name,
        "mime_type": doc.mime_type,
        "expires_in_seconds": 3600,
        "expires_in": "1 hour",
    }


@router.get("/{doc_id}/stream")
async def stream_document(
    doc_id: str,
    token: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Serve file content only if the signed token is valid and not expired.
    This is the local-dev fallback; in production S3 presigned URLs are used instead.
    """
    if not _verify_download_token(token, doc_id, str(current_user.id)):
        raise HTTPException(status_code=403, detail="Download token is invalid or expired")

    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    _doc_firm_check(doc, current_user, db)

    from fastapi.responses import FileResponse
    local_path = doc.file_path.replace("local://", "")
    if not os.path.exists(local_path):
        raise HTTPException(status_code=404, detail="File not found on server")

    return FileResponse(
        path=local_path,
        filename=doc.original_filename or doc.name,
        media_type=doc.mime_type or "application/octet-stream",
    )


@router.get("/{doc_id}")
async def get_document(
    doc_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    _doc_firm_check(doc, current_user, db)
    return _safe_doc_dict(doc)


@router.delete("/{doc_id}")
async def delete_document(
    doc_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    ip = extract_ip(request)
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    _doc_firm_check(doc, current_user, db)

    doc_name = doc.name
    db.delete(doc)
    log_action(db, AuditAction.DOCUMENT_DELETE, "DOCUMENT", doc_id,
               user=current_user, ip=ip, details={"filename": doc_name})
    db.commit()
    return {"message": "Document deleted"}


@router.post("/{doc_id}/ocr")
async def process_ocr(
    doc_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    _doc_firm_check(doc, current_user, db)
    return {"message": "OCR processing queued", "document_id": doc_id}


@router.post("/{doc_id}/request-esign")
async def request_esign(
    doc_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    _doc_firm_check(doc, current_user, db)
    
    if not doc.client_id:
        raise HTTPException(status_code=400, detail="Cannot request e-Sign without a linked client.")
        
    client = db.query(Client).filter(Client.id == doc.client_id).first()
    if not client or not client.email:
        raise HTTPException(status_code=400, detail="Client has no email address for e-Sign request.")

    # Call mock e-Sign service
    result = await ESignService.request_signature(str(doc.id), client.email, client.name)
    
    doc.signature_status = result["status"]
    doc.signature_request_id = result["request_id"]
    db.commit()
    
    return {"message": result["message"], "signature_status": doc.signature_status}
