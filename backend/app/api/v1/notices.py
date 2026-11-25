import io
import re
import uuid
from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from pydantic import BaseModel
from sqlalchemy import or_ as sql_or, asc, desc
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.permissions import apply_firm_filter, require_firm_member
from app.models.case import Case
from app.models.client import Client
from app.models.document import Document, DocumentType
from app.models.draft import Draft
from app.models.notice import LegalNotice
from app.models.user import User
from app.services.document_service import DocumentService

router = APIRouter()
doc_service = DocumentService()


class NoticeCreate(BaseModel):
    direction: str = "received"
    subject: str
    notice_type: str = "General Legal Notice"
    reference_no: Optional[str] = None
    opponent_name: str
    opponent_advocate: Optional[str] = None
    opponent_address: Optional[str] = None
    notice_date: Optional[date] = None
    received_date: Optional[date] = None
    reply_deadline: Optional[date] = None
    replied_date: Optional[date] = None
    delivery_mode: str = "RPAD"
    tracking_number: Optional[str] = None
    status: Optional[str] = None
    summary: Optional[str] = None
    language: str = "en"
    client_id: Optional[str] = None
    case_id: Optional[str] = None
    document_id: Optional[str] = None
    reply_draft_id: Optional[str] = None


class NoticeUpdate(BaseModel):
    direction: Optional[str] = None
    subject: Optional[str] = None
    notice_type: Optional[str] = None
    reference_no: Optional[str] = None
    opponent_name: Optional[str] = None
    opponent_advocate: Optional[str] = None
    opponent_address: Optional[str] = None
    notice_date: Optional[date] = None
    received_date: Optional[date] = None
    reply_deadline: Optional[date] = None
    replied_date: Optional[date] = None
    delivery_mode: Optional[str] = None
    tracking_number: Optional[str] = None
    status: Optional[str] = None
    summary: Optional[str] = None
    language: Optional[str] = None
    client_id: Optional[str] = None
    case_id: Optional[str] = None
    document_id: Optional[str] = None
    reply_draft_id: Optional[str] = None


def _parse_uuid(value: Optional[str], label: str) -> Optional[uuid.UUID]:
    if not value:
        return None
    try:
        return uuid.UUID(str(value))
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid {label} UUID")


def _validate_firm_links(
    db: Session,
    current_user: User,
    client_id: Optional[str],
    case_id: Optional[str],
    document_id: Optional[str] = None,
    reply_draft_id: Optional[str] = None,
):
    resolved_case_id = _parse_uuid(case_id, "case_id")
    resolved_client_id = _parse_uuid(client_id, "client_id")
    resolved_doc_id = _parse_uuid(document_id, "document_id")
    resolved_draft_id = _parse_uuid(reply_draft_id, "reply_draft_id")

    if resolved_case_id:
        case_obj = (
            apply_firm_filter(db.query(Case), Case, current_user)
            .filter(Case.id == resolved_case_id, Case.is_deleted == False)
            .first()
        )
        if not case_obj:
            raise HTTPException(status_code=403, detail="Case not found or access denied")
        if not resolved_client_id and case_obj.client_id:
            resolved_client_id = case_obj.client_id

    if resolved_client_id:
        client_obj = (
            apply_firm_filter(db.query(Client), Client, current_user)
            .filter(Client.id == resolved_client_id)
            .first()
        )
        if not client_obj:
            raise HTTPException(status_code=403, detail="Client not found or access denied")

    if resolved_doc_id:
        doc_obj = db.query(Document).filter(Document.id == resolved_doc_id, Document.is_deleted == False).first()
        if not doc_obj:
            raise HTTPException(status_code=404, detail="Attached document not found")

    if resolved_draft_id:
        draft_obj = (
            apply_firm_filter(db.query(Draft), Draft, current_user)
            .filter(Draft.id == resolved_draft_id, Draft.is_deleted == False)
            .first()
        )
        if not draft_obj:
            raise HTTPException(status_code=403, detail="Reply draft not found or access denied")

    return resolved_client_id, resolved_case_id, resolved_doc_id, resolved_draft_id


def _serialize_notice(n: LegalNotice, include_full_text: bool = False) -> dict:
    today = date.today()
    is_overdue = (
        n.direction == "received"
        and n.status == "pending_reply"
        and n.reply_deadline is not None
        and n.reply_deadline < today
    )
    days_until_deadline = (n.reply_deadline - today).days if n.reply_deadline else None

    data = {
        "id": str(n.id),
        "firm_id": str(n.firm_id) if n.firm_id else None,
        "client_id": str(n.client_id) if n.client_id else None,
        "client_name": n.client.name if n.client else None,
        "client_phone": n.client.phone if n.client else None,
        "client_address": n.client.address if n.client else None,
        "case_id": str(n.case_id) if n.case_id else None,
        "case_no": n.case.case_no if n.case else None,
        "case_title": n.case.title if n.case else None,
        "document_id": str(n.document_id) if n.document_id else None,
        "document_name": n.document.name if n.document else None,
        "document_mime_type": n.document.mime_type if n.document else None,
        "reply_draft_id": str(n.reply_draft_id) if n.reply_draft_id else None,
        "reply_draft_title": n.reply_draft.title if n.reply_draft else None,
        "direction": n.direction,
        "subject": n.subject,
        "notice_type": n.notice_type,
        "reference_no": n.reference_no,
        "opponent_name": n.opponent_name,
        "opponent_advocate": n.opponent_advocate,
        "opponent_address": n.opponent_address,
        "notice_date": n.notice_date.isoformat() if n.notice_date else None,
        "received_date": n.received_date.isoformat() if n.received_date else None,
        "reply_deadline": n.reply_deadline.isoformat() if n.reply_deadline else None,
        "replied_date": n.replied_date.isoformat() if n.replied_date else None,
        "delivery_mode": n.delivery_mode,
        "tracking_number": n.tracking_number,
        "status": n.status,
        "is_overdue": is_overdue,
        "days_until_deadline": days_until_deadline,
        "summary": n.summary,
        "language": n.language,
        "created_at": n.created_at.isoformat() if n.created_at else None,
        "updated_at": n.updated_at.isoformat() if n.updated_at else None,
    }
    if include_full_text:
        data["document_ocr_text"] = n.document.ocr_text if n.document else None
        data["reply_draft_content"] = n.reply_draft.content if n.reply_draft else None
    return data


def _detect_language(text: str) -> str:
    if not text:
        return "en"
    gujarati_chars = len(re.findall(r"[\u0A80-\u0AFF]", text))
    if gujarati_chars >= 10:
        return "gu"
    devanagari_chars = len(re.findall(r"[\u0900-\u097F]", text))
    if devanagari_chars >= 10:
        marathi_markers = ("अशील", "माझे", "दिनांक", "यापुढे", "करण्यात", "आहेत", "सादर")
        if any(m in text for m in marathi_markers):
            return "mr"
        return "hi"
    return "en"


def _detect_notice_type(text: str) -> str:
    low = (text or "").lower()
    if any(k in low for k in ("138", "negotiable instruments", "cheque", "dishonour", "dishonor")):
        return "Cheque Bounce (u/s 138 NI Act)"
    if any(k in low for k in ("eviction", "tenancy", "lease", "vacate", "plot", "possession", "rera")):
        return "Property / Eviction"
    if any(k in low for k in ("gst", "cgst", "sgst", "income tax", "show cause", "assessment")):
        return "GST / Tax Notice"
    if any(k in low for k in ("consumer", "deficiency in service", "unfair trade")):
        return "Consumer Dispute"
    if any(k in low for k in ("divorce", "maintenance", "matrimonial", "custody", "hindu marriage")):
        return "Family / Matrimonial"
    if any(k in low for k in ("arbitration", "breach of contract", "agreement", "specific performance")):
        return "Arbitration / Contract"
    if any(k in low for k in ("defamation", "reputation", "499", "356 bns")):
        return "Defamation"
    if any(k in low for k in ("recovery", "outstanding", "dues", "invoice", "demand notice")):
        return "Legal Demand / Recovery"
    return "General Legal Notice"


def _extract_regex_metadata(text: str) -> dict:
    if not text:
        return {"notice_date": None, "reference_no": None}
    date_match = re.search(
        r"\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})\b",
        text,
        re.IGNORECASE,
    )
    ref_match = re.search(r"(?:(?:Ref\.?|Reference)\s*(?:No\.?)?|Notice\s*No\.?)\s*[:\-]?\s*([A-Za-z0-9/_-]{3,40})", text, re.IGNORECASE)
    return {
        "notice_date": date_match.group(1) if date_match else None,
        "reference_no": ref_match.group(1) if ref_match else None,
    }


@router.get("/")
async def list_notices(
    search: Optional[str] = None,
    direction: Optional[str] = None,
    status_filter: Optional[str] = None,
    status: Optional[str] = None,
    client_id: Optional[str] = None,
    case_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    effective_status = status or status_filter
    base_query = (
        apply_firm_filter(db.query(LegalNotice), LegalNotice, current_user)
        .filter(LegalNotice.is_deleted == False)
    )

    all_firm_notices = base_query.all()
    today = date.today()
    soon_cutoff = today + timedelta(days=7)

    summary = {
        "total": len(all_firm_notices),
        "pending_reply": sum(
            1 for n in all_firm_notices if n.direction == "received" and n.status == "pending_reply"
        ),
        "overdue": sum(
            1
            for n in all_firm_notices
            if n.direction == "received"
            and n.status == "pending_reply"
            and n.reply_deadline is not None
            and n.reply_deadline < today
        ),
        "due_soon": sum(
            1
            for n in all_firm_notices
            if n.direction == "received"
            and n.status == "pending_reply"
            and n.reply_deadline is not None
            and today <= n.reply_deadline <= soon_cutoff
        ),
        "replied": sum(1 for n in all_firm_notices if n.status == "replied"),
        "sent": sum(1 for n in all_firm_notices if n.direction == "sent" or n.status == "sent"),
    }

    query = base_query.options(
        joinedload(LegalNotice.client),
        joinedload(LegalNotice.case),
        joinedload(LegalNotice.document),
        joinedload(LegalNotice.reply_draft),
    )

    if direction and direction != "all":
        query = query.filter(LegalNotice.direction == direction)

    if effective_status and effective_status != "all":
        if effective_status == "overdue":
            query = query.filter(
                LegalNotice.direction == "received",
                LegalNotice.status == "pending_reply",
                LegalNotice.reply_deadline.isnot(None),
                LegalNotice.reply_deadline < today,
            )
        else:
            query = query.filter(LegalNotice.status == effective_status)

    if client_id:
        cid = _parse_uuid(client_id, "client_id")
        query = query.filter(LegalNotice.client_id == cid)

    if case_id:
        cid = _parse_uuid(case_id, "case_id")
        query = query.filter(LegalNotice.case_id == cid)

    if search and search.strip():
        pattern = f"%{search.strip()}%"
        query = query.filter(
            sql_or(
                LegalNotice.subject.ilike(pattern),
                LegalNotice.opponent_name.ilike(pattern),
                LegalNotice.opponent_advocate.ilike(pattern),
                LegalNotice.notice_type.ilike(pattern),
                LegalNotice.reference_no.ilike(pattern),
                LegalNotice.tracking_number.ilike(pattern),
                LegalNotice.summary.ilike(pattern),
            )
        )

    total = query.count()
    items = (
        query.order_by(asc(LegalNotice.reply_deadline).nullslast(), desc(LegalNotice.created_at))
        .offset(skip)
        .limit(limit)
        .all()
    )

    return {
        "total": total,
        "summary": summary,
        "notices": [_serialize_notice(n) for n in items],
    }


@router.get("/{notice_id}")
async def get_notice(
    notice_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    nid = _parse_uuid(notice_id, "notice_id")
    notice = (
        apply_firm_filter(db.query(LegalNotice), LegalNotice, current_user)
        .options(
            joinedload(LegalNotice.client),
            joinedload(LegalNotice.case),
            joinedload(LegalNotice.document),
            joinedload(LegalNotice.reply_draft),
        )
        .filter(LegalNotice.id == nid, LegalNotice.is_deleted == False)
        .first()
    )
    if not notice:
        raise HTTPException(status_code=404, detail="Legal notice not found")
    return _serialize_notice(notice, include_full_text=True)


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_notice(
    payload: NoticeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    resolved_client_id, resolved_case_id, resolved_doc_id, resolved_draft_id = _validate_firm_links(
        db,
        current_user,
        payload.client_id,
        payload.case_id,
        payload.document_id,
        payload.reply_draft_id,
    )

    direction = payload.direction if payload.direction in ("received", "sent") else "received"
    initial_status = payload.status or ("sent" if direction == "sent" else "pending_reply")

    notice = LegalNotice(
        firm_id=current_user.firm_id,
        created_by_id=current_user.id,
        client_id=resolved_client_id,
        case_id=resolved_case_id,
        document_id=resolved_doc_id,
        reply_draft_id=resolved_draft_id,
        direction=direction,
        subject=payload.subject.strip(),
        notice_type=(payload.notice_type or "General Legal Notice").strip(),
        reference_no=payload.reference_no.strip() if payload.reference_no else None,
        opponent_name=payload.opponent_name.strip(),
        opponent_advocate=payload.opponent_advocate.strip() if payload.opponent_advocate else None,
        opponent_address=payload.opponent_address.strip() if payload.opponent_address else None,
        notice_date=payload.notice_date,
        received_date=payload.received_date,
        reply_deadline=payload.reply_deadline,
        replied_date=payload.replied_date or (date.today() if initial_status == "replied" else None),
        delivery_mode=(payload.delivery_mode or "RPAD").strip(),
        tracking_number=payload.tracking_number.strip() if payload.tracking_number else None,
        status=initial_status,
        summary=payload.summary.strip() if payload.summary else None,
        language=payload.language or "en",
    )
    db.add(notice)
    db.commit()
    db.refresh(notice)
    return _serialize_notice(notice, include_full_text=True)


@router.put("/{notice_id}")
async def update_notice(
    notice_id: str,
    payload: NoticeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    nid = _parse_uuid(notice_id, "notice_id")
    notice = (
        apply_firm_filter(db.query(LegalNotice), LegalNotice, current_user)
        .filter(LegalNotice.id == nid, LegalNotice.is_deleted == False)
        .first()
    )
    if not notice:
        raise HTTPException(status_code=404, detail="Legal notice not found")

    updates = payload.model_dump(exclude_unset=True)

    if any(k in updates for k in ("client_id", "case_id", "document_id", "reply_draft_id")):
        c_id = updates.get("client_id", str(notice.client_id) if notice.client_id else None)
        cs_id = updates.get("case_id", str(notice.case_id) if notice.case_id else None)
        d_id = updates.get("document_id", str(notice.document_id) if notice.document_id else None)
        dr_id = updates.get("reply_draft_id", str(notice.reply_draft_id) if notice.reply_draft_id else None)
        resolved_client_id, resolved_case_id, resolved_doc_id, resolved_draft_id = _validate_firm_links(
            db, current_user, c_id, cs_id, d_id, dr_id
        )
        if "client_id" in updates or ("case_id" in updates and resolved_client_id and not notice.client_id):
            notice.client_id = resolved_client_id
        if "case_id" in updates:
            notice.case_id = resolved_case_id
        if "document_id" in updates:
            notice.document_id = resolved_doc_id
        if "reply_draft_id" in updates:
            notice.reply_draft_id = resolved_draft_id

    for field in (
        "direction",
        "subject",
        "notice_type",
        "reference_no",
        "opponent_name",
        "opponent_advocate",
        "opponent_address",
        "notice_date",
        "received_date",
        "reply_deadline",
        "replied_date",
        "delivery_mode",
        "tracking_number",
        "status",
        "summary",
        "language",
    ):
        if field in updates:
            val = updates[field]
            if isinstance(val, str):
                val = val.strip()
            setattr(notice, field, val)

    if updates.get("status") == "replied" and not notice.replied_date:
        notice.replied_date = date.today()

    db.commit()
    db.refresh(notice)
    return _serialize_notice(notice, include_full_text=True)


@router.delete("/{notice_id}")
async def delete_notice(
    notice_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    nid = _parse_uuid(notice_id, "notice_id")
    notice = (
        apply_firm_filter(db.query(LegalNotice), LegalNotice, current_user)
        .filter(LegalNotice.id == nid, LegalNotice.is_deleted == False)
        .first()
    )
    if not notice:
        raise HTTPException(status_code=404, detail="Legal notice not found")
    notice.is_deleted = True
    db.commit()
    return {"message": "Notice deleted"}


@router.post("/extract-upload", status_code=status.HTTP_201_CREATED)
async def upload_and_extract_notice(
    file: UploadFile = File(...),
    case_id: Optional[str] = Form(None),
    client_id: Optional[str] = Form(None),
    notice_id: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    resolved_client_id, resolved_case_id, _, _ = _validate_firm_links(
        db, current_user, client_id, case_id
    )

    file_content = await file.read()
    filename = file.filename or "notice_upload"
    content_type = file.content_type or "application/octet-stream"

    file_url, file_hash = await doc_service.upload_to_storage(file_content, filename, content_type)

    extracted_text: Optional[str] = None
    lower_name = filename.lower()
    if content_type.startswith("text/") or lower_name.endswith((".txt", ".md")):
        try:
            extracted_text = doc_service._sanitize_text(file_content.decode("utf-8", errors="ignore"))
        except Exception:
            extracted_text = None
    elif (
        content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        or lower_name.endswith(".docx")
    ):
        try:
            from docx import Document as DocxDocument

            docx_obj = DocxDocument(io.BytesIO(file_content))
            extracted_text = doc_service._sanitize_text(
                "\n".join(p.text for p in docx_obj.paragraphs if p.text.strip())
            )
        except Exception:
            extracted_text = None
    elif content_type in ("application/pdf", "image/jpeg", "image/png", "image/tiff") or lower_name.endswith(".pdf"):
        effective_mime = "application/pdf" if lower_name.endswith(".pdf") else content_type
        extracted_text = await doc_service.extract_text(file_content, effective_mime)

    detected_lang = _detect_language(extracted_text or "")
    detected_type = _detect_notice_type(extracted_text or "")
    regex_meta = _extract_regex_metadata(extracted_text or "")

    doc = Document(
        name=filename,
        original_filename=filename,
        file_path=file_url,
        file_size=len(file_content),
        mime_type=content_type,
        doc_type=DocumentType.NOTICE,
        case_id=resolved_case_id,
        client_id=resolved_client_id,
        uploaded_by_id=current_user.id,
        ocr_text=extracted_text,
        ocr_processed=bool(extracted_text),
        ocr_language=detected_lang,
        extracted_metadata={
            "notice_type": detected_type,
            "notice_date": regex_meta["notice_date"],
            "reference_no": regex_meta["reference_no"],
        },
        hash_sha256=file_hash,
    )
    db.add(doc)
    db.flush()

    if notice_id:
        nid = _parse_uuid(notice_id, "notice_id")
        notice = (
            apply_firm_filter(db.query(LegalNotice), LegalNotice, current_user)
            .filter(LegalNotice.id == nid, LegalNotice.is_deleted == False)
            .first()
        )
        if notice:
            notice.document_id = doc.id

    db.commit()
    db.refresh(doc)

    return {
        "document_id": str(doc.id),
        "filename": doc.name,
        "ocr_processed": bool(extracted_text),
        "extracted_text": extracted_text or "",
        "detected": {
            "notice_type": detected_type,
            "language": detected_lang,
            "notice_date": regex_meta["notice_date"],
            "reference_no": regex_meta["reference_no"],
        },
    }
