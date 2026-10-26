import hmac
import hashlib
import time
import base64
import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, Request, Query, Header
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload
from typing import Optional, List, Dict, Any

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


def _decode_and_verify_download_token(token: str, doc_id: str) -> Optional[str]:
    """Verify HMAC token and return authorized user_id if valid."""
    try:
        raw = base64.urlsafe_b64decode(token.encode()).decode()
        parts = raw.rsplit(":", 1)
        if len(parts) != 2:
            return None
        payload, sig = parts
        expected_sig = hmac.new(_DOWNLOAD_SECRET, payload.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected_sig):
            return None
        d_id, u_id, expires = payload.split(":")
        if d_id != doc_id:
            return None
        if int(time.time()) > int(expires):
            return None
        return u_id
    except Exception:
        return None


def _verify_download_token(token: str, doc_id: str, user_id: str) -> bool:
    """Verify the download token has not expired and is authentic."""
    res_uid = _decode_and_verify_download_token(token, doc_id)
    return res_uid == user_id


# ── Firm ownership helpers ────────────────────────────────────────────────────

def _doc_firm_check(doc: Document, current_user: User, db: Session):
    """Verify document belongs to the current user's firm via case, client, or firm membership."""
    if current_user.is_superadmin:
        return
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
    # Document with no case/client: verify caller is uploader or in same firm
    if str(doc.uploaded_by_id) == str(current_user.id):
        return
    if current_user.firm_id and doc.uploaded_by_id:
        uploader = db.query(User).filter(User.id == doc.uploaded_by_id).first()
        if uploader and uploader.firm_id == current_user.firm_id:
            return
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


def _sanitize_text(text: Optional[str]) -> Optional[str]:
    """Strip NUL (0x00) characters which are forbidden in PostgreSQL text/varchar columns."""
    if not text:
        return None
    cleaned = text.replace("\x00", "").replace("\u0000", "").strip()
    return cleaned if cleaned else None


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
    elif resolved_case_id and resolved_client_id:
        case_obj = db.query(Case).filter(Case.id == resolved_case_id).first()
        if case_obj and case_obj.client_id and str(case_obj.client_id) != str(resolved_client_id):
            raise HTTPException(status_code=400, detail="The selected case does not belong to the selected client.")

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
    Return short-lived presigned/signed token URLs for preview and download.
    Firm ownership is verified before URL generation.
    """
    ip = extract_ip(request)
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    _doc_firm_check(doc, current_user, db)

    token = _make_download_token(doc_id, str(current_user.id))
    if doc_service.s3_client and doc.file_path and doc.file_path.startswith("https://"):
        bucket_url = f"https://{settings.AWS_S3_BUCKET}.s3.{settings.AWS_REGION}.amazonaws.com/"
        object_key = doc.file_path.replace(bucket_url, "")
        download_url = await doc_service.generate_download_url(object_key, expiry_seconds=3600)
        preview_url = download_url
        url_type = "presigned_s3"
    else:
        preview_url = f"/api/v1/documents/{doc_id}/stream?disposition=inline&token={token}"
        download_url = f"/api/v1/documents/{doc_id}/stream?disposition=attachment&token={token}"
        url_type = "signed_local"

    log_action(db, AuditAction.DOCUMENT_DOWNLOAD, "DOCUMENT", doc_id,
               user=current_user, ip=ip,
               details={"filename": doc.name, "url_type": url_type})
    db.commit()

    return {
        "download_url": download_url,
        "preview_url": preview_url,
        "token": token,
        "filename": doc.name,
        "mime_type": doc.mime_type,
        "expires_in_seconds": 3600,
        "expires_in": "1 hour",
    }


@router.get("/{doc_id}/stream")
async def stream_document(
    doc_id: str,
    token: Optional[str] = Query(None),
    disposition: Optional[str] = Query("inline"),
    request: Request = None,
    db: Session = Depends(get_db),
):
    """
    Serve file content for inline preview or attachment download.
    Supports either signed HMAC token (for browser iframe/window.open)
    or Authorization: Bearer <jwt> header.
    Firm isolation is strictly verified.
    """
    authed_user = None

    # 1. Verify signed HMAC token if provided
    if token:
        user_id = _decode_and_verify_download_token(token, doc_id)
        if not user_id:
            raise HTTPException(status_code=403, detail="Invalid or expired download token")
        try:
            import uuid
            u_uuid = uuid.UUID(user_id)
            authed_user = db.query(User).filter(User.id == u_uuid, User.is_active == True).first()
        except Exception:
            pass
        if not authed_user:
            raise HTTPException(status_code=403, detail="Invalid user associated with download token")

    # 2. Check Authorization header
    if not authed_user and request:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            raw_jwt = auth_header.split(" ", 1)[1]
            try:
                from app.core.security import decode_token
                import uuid
                payload = decode_token(raw_jwt)
                user_sub = payload.get("sub")
                if user_sub:
                    try:
                        u_uuid = uuid.UUID(user_sub)
                        authed_user = db.query(User).filter(User.id == u_uuid, User.is_active == True).first()
                    except ValueError:
                        authed_user = db.query(User).filter(User.email == user_sub, User.is_active == True).first()
            except Exception:
                pass

    if not authed_user:
        raise HTTPException(status_code=401, detail="Authentication required or token expired")

    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    _doc_firm_check(doc, authed_user, db)

    from fastapi.responses import FileResponse
    local_path = doc.file_path.replace("local://", "") if doc.file_path else ""
    if not local_path or not os.path.exists(local_path):
        raise HTTPException(status_code=404, detail="File content not found on server")

    filename = doc.original_filename or doc.name or "document"
    ext = (filename.rsplit(".", 1)[-1]).lower() if "." in filename else ""
    mime = doc.mime_type or "application/octet-stream"
    if mime == "application/octet-stream":
        if ext == "pdf":
            mime = "application/pdf"
        elif ext in ("jpg", "jpeg"):
            mime = "image/jpeg"
        elif ext == "png":
            mime = "image/png"
        elif ext == "txt":
            mime = "text/plain; charset=utf-8"
        elif ext == "docx":
            mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

    import urllib.parse
    disp_type = "inline" if disposition == "inline" else "attachment"
    encoded_filename = urllib.parse.quote(filename)
    headers = {
        "Content-Disposition": f'{disp_type}; filename="{filename}"; filename*=UTF-8\'\'{encoded_filename}',
        "Access-Control-Expose-Headers": "Content-Disposition",
    }
    return FileResponse(
        path=local_path,
        filename=filename,
        media_type=mime,
        content_disposition_type=disp_type,
        headers=headers,
    )


@router.get("/{doc_id}/content")
async def get_document_content(
    doc_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    """
    Extract and return text content from document (via OCR or file text extraction)
    for preview and AI drafting.
    """
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    _doc_firm_check(doc, current_user, db)

    text = ""
    if doc.ocr_text and doc.ocr_text.strip():
        text = doc.ocr_text.strip()
    else:
        from app.services.data_bridge_service import bridge_service_extract_text
        local_path = doc.file_path.replace("local://", "") if doc.file_path else ""
        if local_path and os.path.exists(local_path):
            try:
                with open(local_path, "rb") as f:
                    raw = f.read()
                text = bridge_service_extract_text(raw, doc.name, doc.mime_type)
            except Exception as e:
                logger.warning(f"Failed to read file for text extraction {doc_id}: {e}")

    token = _make_download_token(doc_id, str(current_user.id))
    return {
        "id": str(doc.id),
        "name": doc.name,
        "original_filename": doc.original_filename,
        "doc_type": doc.doc_type,
        "mime_type": doc.mime_type,
        "file_size": doc.file_size,
        "text": text,
        "has_text": bool(text.strip()),
        "preview_url": f"/api/v1/documents/{doc_id}/stream?token={token}&disposition=inline",
        "download_url": f"/api/v1/documents/{doc_id}/stream?token={token}&disposition=attachment",
        "case_id": str(doc.case_id) if doc.case_id else None,
        "case_title": doc.case.title if doc.case else None,
        "case_no": doc.case.case_no if doc.case else None,
        "client_id": str(doc.client_id) if doc.client_id else None,
        "client_name": doc.client.name if doc.client else None,
        "created_at": doc.created_at.isoformat() if doc.created_at else None,
    }


class DocumentUpdateRequest(BaseModel):
    name: Optional[str] = None
    doc_type: Optional[str] = None
    client_id: Optional[str] = None
    case_id: Optional[str] = None
    description: Optional[str] = None
    is_evidence: Optional[bool] = None
    exhibit_number: Optional[str] = None
    text: Optional[str] = None


@router.patch("/{doc_id}")
async def update_document(
    doc_id: str,
    payload: DocumentUpdateRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    ip = extract_ip(request)
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    _doc_firm_check(doc, current_user, db)

    import uuid
    # Resolve target case & client
    target_case_id = doc.case_id
    if payload.case_id is not None:
        if payload.case_id.strip():
            _verify_case_firm(payload.case_id, current_user, db)
            target_case_id = uuid.UUID(payload.case_id)
        else:
            target_case_id = None

    target_client_id = doc.client_id
    if payload.client_id is not None:
        if payload.client_id.strip():
            _verify_client_firm(payload.client_id, current_user, db)
            target_client_id = uuid.UUID(payload.client_id)
        else:
            target_client_id = None

    # Cross-validate case and client
    if target_case_id and target_client_id:
        case_obj = db.query(Case).filter(Case.id == target_case_id).first()
        if case_obj and case_obj.client_id and str(case_obj.client_id) != str(target_client_id):
            raise HTTPException(status_code=400, detail="The selected case does not belong to the selected client.")
    elif target_case_id and not target_client_id:
        case_obj = db.query(Case).filter(Case.id == target_case_id).first()
        if case_obj and case_obj.client_id:
            target_client_id = case_obj.client_id

    if payload.name is not None and payload.name.strip():
        doc.name = payload.name.strip()
    if payload.doc_type is not None:
        doc.doc_type = payload.doc_type
    if payload.description is not None:
        doc.description = payload.description
    if payload.is_evidence is not None:
        doc.is_evidence = payload.is_evidence
    if payload.exhibit_number is not None:
        doc.exhibit_number = payload.exhibit_number
    if payload.text is not None:
        clean_text = _sanitize_text(payload.text) or ""
        doc.ocr_text = clean_text
        doc.ocr_processed = True
        doc.version = (doc.version or 1) + 1
        local_path = doc.file_path.replace("local://", "") if doc.file_path else ""
        if local_path and os.path.exists(local_path) and doc.name.lower().endswith(".txt"):
            try:
                with open(local_path, "w", encoding="utf-8") as f:
                    f.write(clean_text)
                doc.file_size = len(clean_text.encode("utf-8"))
            except Exception as e:
                logger.warning(f"Could not rewrite text file {doc.id}: {e}")

    doc.case_id = target_case_id
    doc.client_id = target_client_id

    log_action(db, AuditAction.DOCUMENT_UPDATE, "DOCUMENT", doc_id,
               user=current_user, ip=ip,
               details={"name": doc.name, "case_id": str(doc.case_id) if doc.case_id else None, "client_id": str(doc.client_id) if doc.client_id else None})
    db.commit()
    db.refresh(doc)
    return _safe_doc_dict(doc)


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
    doc.is_deleted = True
    log_action(db, AuditAction.DOCUMENT_DELETE, "DOCUMENT", doc_id,
               user=current_user, ip=ip, details={"filename": doc_name})
    db.commit()
    return {"message": "Document deleted", "id": doc_id, "name": doc_name}


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
