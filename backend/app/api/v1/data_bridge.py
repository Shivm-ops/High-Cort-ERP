"""
app/api/v1/data_bridge.py
=========================
Fastcase Data Bridge API:
- Local file & folder bulk import with auto-classification
- Legacy client & case migration wizard (CSV/XLSX preview, mapping, duplicate detection, execution)
- Case document ZIP export with audit manifest
- Structured CSV & practice backup downloads
- Complete tenant isolation and audit logging
"""

import io
import os
import re
import csv
import json
import uuid
import logging
from datetime import datetime, timezone, date
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, Request, Response, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_ as sql_or

from app.core.database import get_db
from app.core.config import settings
from app.core.security import get_current_user
from app.core.permissions import require_firm_member, apply_firm_filter, check_object_firm
from app.models.document import Document, DocumentType
from app.models.case import Case, CaseStatus, CaseStage, CasePriority
from app.models.client import Client, ClientType
from app.models.user import User
from app.models.audit_log import AuditLog
from app.models.draft import Draft, DraftCategory, DraftLanguage
from app.services.data_bridge_service import DataBridgeService, ALLOWED_EXTENSIONS, MAX_FILE_SIZE_BYTES
from app.services.audit_service import log_action, extract_ip, AuditAction
from app.services.ai_service import AIService
from app.api.v1.documents import _make_download_token

logger = logging.getLogger(__name__)

router = APIRouter()
bridge_service = DataBridgeService()


# ── Schemas ───────────────────────────────────────────────────────────────────

class MigrationPreviewRequest(BaseModel):
    sample_size: int = 15


class MigrationValidateRequest(BaseModel):
    entity_type: str = Field(..., description="client or case")
    rows: List[Dict[str, Any]]
    mapping: Dict[str, str]  # e.g. {"name": "Client Name", "phone": "Mobile"}


class MigrationExecuteRequest(BaseModel):
    entity_type: str = Field(..., description="client or case")
    rows: List[Dict[str, Any]]
    mapping: Dict[str, str]
    duplicate_strategy: str = Field("skip", description="skip | update | create_new")


# ── 1. Local File Import & Auto-Classification ────────────────────────────────

@router.post("/upload-file", status_code=status.HTTP_201_CREATED)
async def upload_bridge_file(
    request: Request,
    file: UploadFile = File(...),
    case_id: Optional[str] = Form(None),
    client_id: Optional[str] = Form(None),
    doc_type: Optional[str] = Form(None),
    relative_path: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    auto_classify: bool = Form(True),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    """
    Import a file from a local computer or folder with validation,
    SHA-256 integrity hashing, auto-classification, and case/client linking.
    """
    ip = extract_ip(request)
    raw_content = await file.read()
    file_size = len(raw_content)

    # 1. Validate metadata & deep content
    is_valid, err_msg = bridge_service.validate_file_metadata(file.filename, file_size)
    if not is_valid:
        raise HTTPException(status_code=400, detail=err_msg)

    content_valid, content_err = bridge_service.validate_file_content(raw_content, file.filename)
    if not content_valid:
        raise HTTPException(status_code=400, detail=content_err)

    # 2. Check case and client permissions
    resolved_case = None
    if case_id:
        try:
            cid = uuid.UUID(case_id)
            resolved_case = apply_firm_filter(db.query(Case), Case, current_user).filter(Case.id == cid).first()
            if not resolved_case:
                raise HTTPException(status_code=403, detail="Selected case not found or access denied")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid case ID format")

    resolved_client = None
    if client_id:
        try:
            clid = uuid.UUID(client_id)
            resolved_client = apply_firm_filter(db.query(Client), Client, current_user).filter(Client.id == clid).first()
            if not resolved_client:
                raise HTTPException(status_code=403, detail="Selected client not found or access denied")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid client ID format")

    if resolved_case and resolved_client:
        if resolved_case.client_id and str(resolved_case.client_id) != str(resolved_client.id):
            raise HTTPException(status_code=400, detail="The selected case does not belong to the selected client.")
    elif resolved_case and not resolved_client:
        resolved_client = resolved_case.client

    # 3. Store file securely
    clean_name = bridge_service.sanitize_filename(file.filename)
    mime_type = file.content_type or "application/octet-stream"
    file_url, file_hash = await bridge_service.doc_service.upload_to_storage(raw_content, clean_name, mime_type)

    # 4. Extract OCR / text for PDF and images
    ocr_text = None
    ext = bridge_service.get_extension(clean_name)
    if ext in ("pdf", "jpg", "jpeg", "png", "tiff"):
        try:
            ocr_text = await bridge_service.doc_service.extract_text(raw_content, mime_type)
        except Exception as e:
            logger.warning(f"OCR text extraction failed: {e}")

    # 5. Smart classification & hint extraction if requested
    classified_type = doc_type or "other"
    classification_conf = 1.0 if doc_type and doc_type != "other" else 0.4
    hints = {}
    if auto_classify and (not doc_type or doc_type == "other"):
        classified_type, classification_conf = bridge_service.classify_document(clean_name, ocr_text[:1000] if ocr_text else None)
        firm_cases = apply_firm_filter(db.query(Case), Case, current_user).filter(Case.is_deleted == False).limit(200).all()
        firm_clients = apply_firm_filter(db.query(Client), Client, current_user).filter(Client.is_deleted == False).limit(200).all()
        hints = bridge_service.extract_case_and_client_hints(clean_name, ocr_text[:500] if ocr_text else None, firm_cases, firm_clients)
        # Note: Do NOT silently attach uncertain documents if user didn't specify case/client.
        # Return suggestions in hints for user review and confirmation.

    # 6. Save Document
    doc = Document(
        name=clean_name,
        original_filename=file.filename,
        file_path=file_url,
        file_size=file_size,
        mime_type=mime_type,
        doc_type=classified_type,
        case_id=resolved_case.id if resolved_case else None,
        client_id=resolved_client.id if resolved_client else None,
        uploaded_by_id=current_user.id,
        description=description or (f"Imported via Data Bridge ({relative_path})" if relative_path else "Imported via Data Bridge"),
        ocr_text=ocr_text,
        ocr_processed=ocr_text is not None,
        extracted_metadata={
            "source": "data_bridge_local_import",
            "relative_path": relative_path or "",
            "classification_confidence": classification_conf,
            "detected_case_no": hints.get("matched_case_no"),
        },
        hash_sha256=file_hash,
    )
    db.add(doc)
    db.flush()

    # 7. Audit log
    log_action(
        db,
        "DATA_BRIDGE_FILE_IMPORT",
        "DOCUMENT",
        str(doc.id),
        user=current_user,
        ip=ip,
        details={
            "filename": clean_name,
            "size": file_size,
            "sha256": file_hash,
            "doc_type": classified_type,
            "case_id": str(doc.case_id) if doc.case_id else None,
            "client_id": str(doc.client_id) if doc.client_id else None,
            "relative_path": relative_path,
        }
    )
    db.commit()
    db.refresh(doc)

    token = _make_download_token(str(doc.id), str(current_user.id))
    preview_url = f"/api/v1/documents/{doc.id}/stream?disposition=inline&token={token}"
    download_url = f"/api/v1/documents/{doc.id}/stream?disposition=attachment&token={token}"

    return {
        "id": str(doc.id),
        "name": doc.name,
        "original_filename": doc.original_filename,
        "doc_type": doc.doc_type,
        "file_size": doc.file_size,
        "mime_type": doc.mime_type,
        "case_id": str(doc.case_id) if doc.case_id else None,
        "case_title": doc.case.title if doc.case else None,
        "case_no": doc.case.case_no if doc.case else None,
        "client_id": str(doc.client_id) if doc.client_id else None,
        "client_name": doc.client.name if doc.client else None,
        "hash_sha256": doc.hash_sha256,
        "ocr_processed": doc.ocr_processed,
        "classification_confidence": classification_conf,
        "hints": hints,
        "preview_url": preview_url,
        "download_url": download_url,
        "token": token,
        "created_at": doc.created_at.isoformat() if doc.created_at else None,
    }


@router.post("/analyze-file")
async def analyze_bridge_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    """
    Perform pre-upload classification and client/case discovery on a file without saving.
    """
    raw_content = await file.read()
    file_size = len(raw_content)
    is_valid, err_msg = bridge_service.validate_file_metadata(file.filename, file_size)
    if not is_valid:
        raise HTTPException(status_code=400, detail=err_msg)

    content_valid, content_err = bridge_service.validate_file_content(raw_content, file.filename)
    if not content_valid:
        raise HTTPException(status_code=400, detail=content_err)

    clean_name = bridge_service.sanitize_filename(file.filename)
    mime_type = file.content_type or "application/octet-stream"

    # Fast text sample
    sample_text = None
    ext = bridge_service.get_extension(clean_name)
    if ext == "txt":
        try:
            sample_text = raw_content[:2000].decode("utf-8", errors="ignore")
        except Exception:
            pass
    elif ext == "pdf":
        try:
            sample_text = await bridge_service.doc_service.extract_text(raw_content[:200000], mime_type)
        except Exception:
            pass

    doc_type, conf = bridge_service.classify_document(clean_name, sample_text)
    firm_cases = apply_firm_filter(db.query(Case), Case, current_user).filter(Case.is_deleted == False).limit(200).all()
    firm_clients = apply_firm_filter(db.query(Client), Client, current_user).filter(Client.is_deleted == False).limit(200).all()
    hints = bridge_service.extract_case_and_client_hints(clean_name, sample_text, firm_cases, firm_clients)

    return {
        "filename": clean_name,
        "file_size": file_size,
        "suggested_doc_type": doc_type,
        "confidence": conf,
        "has_sample_text": bool(sample_text),
        "hints": hints,
    }


# ── 2. Legacy Client & Case Migration Wizard ──────────────────────────────────

@router.post("/migrate/preview")
async def preview_migration_file(
    file: UploadFile = File(...),
    current_user: User = Depends(require_firm_member),
):
    """
    Step 1: Upload source CSV or XLSX. Returns detected columns, sample rows, and suggested field mappings.
    """
    content = await file.read()
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="Migration file exceeds 50 MB limit")

    try:
        headers, rows = bridge_service.parse_migration_file(content, file.filename)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not headers or not rows:
        raise HTTPException(status_code=400, detail="The file is empty or contains no readable data rows.")

    # Infer likely entity type (client or case) from headers
    headers_lower = [h.lower() for h in headers]
    case_score = sum(1 for h in headers_lower if any(k in h for k in ["case", "court", "judge", "cnr", "petitioner", "respondent"]))
    client_score = sum(1 for h in headers_lower if any(k in h for k in ["client", "phone", "email", "pan", "aadhaar", "address"]))
    suggested_entity = "case" if case_score > client_score else "client"

    # Pre-map headers to Fastcase fields
    field_suggestions: Dict[str, str] = {}
    if suggested_entity == "client":
        fastcase_fields = {
            "name": ["name", "client name", "full name", "client", "customer"],
            "phone": ["phone", "mobile", "contact", "cell", "phone number", "tel"],
            "email": ["email", "e-mail", "mail", "email address"],
            "type": ["type", "client type", "category"],
            "address": ["address", "street", "residence"],
            "city": ["city", "town", "district"],
            "state": ["state", "province"],
            "pincode": ["pincode", "pin", "postal code", "zip"],
            "pan": ["pan", "pan number", "pan no"],
            "company_name": ["company", "company name", "firm", "organization"],
            "notes": ["notes", "remarks", "comments", "description"],
        }
    else:
        fastcase_fields = {
            "case_no": ["case no", "case number", "caseno", "matter no", "petition no", "file no"],
            "title": ["title", "case title", "matter title", "subject", "matter"],
            "court": ["court", "court name", "forum", "tribunal"],
            "practice_area": ["practice area", "category", "area", "type", "law"],
            "judge": ["judge", "bench", "coram"],
            "petitioner": ["petitioner", "plaintiff", "appellant", "complainant"],
            "respondent": ["respondent", "defendant", "opposite party"],
            "opposing_counsel": ["opposing counsel", "opposite lawyer", "advocate"],
            "client_name": ["client", "client name", "party"],
            "filing_date": ["filing date", "filed date", "date of filing"],
            "next_hearing_date": ["hearing date", "next hearing", "next date"],
            "status": ["status", "stage", "case status"],
        }

    for target_key, aliases in fastcase_fields.items():
        for header in headers:
            h_clean = header.strip().lower()
            if h_clean in aliases or any(alias in h_clean for alias in aliases):
                field_suggestions[target_key] = header
                break

    return {
        "filename": file.filename,
        "total_rows": len(rows),
        "headers": headers,
        "preview_rows": rows[:15],
        "suggested_entity": suggested_entity,
        "suggested_mapping": field_suggestions,
    }


@router.post("/migrate/validate")
async def validate_migration_data(
    payload: MigrationValidateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    """
    Step 2: Validate mapped data, check required fields, and detect duplicates against existing firm records.
    """
    entity = payload.entity_type
    rows = payload.rows
    mapping = payload.mapping

    if entity not in ("client", "case"):
        raise HTTPException(status_code=400, detail="Entity type must be 'client' or 'case'")

    valid_rows = []
    invalid_rows = []
    duplicates = []

    # Pre-fetch existing firm records for fast duplicate matching
    if entity == "client":
        existing_clients = apply_firm_filter(db.query(Client), Client, current_user).filter(Client.is_deleted == False).all()
        existing_phones = {cl.phone.replace(" ", "").replace("-", ""): cl for cl in existing_clients if cl.phone}
        existing_emails = {cl.email.lower().strip(): cl for cl in existing_clients if cl.email}
        existing_names = {cl.name.lower().strip(): cl for cl in existing_clients if cl.name}

        for idx, row in enumerate(rows, start=1):
            name_val = row.get(mapping.get("name", "")) or ""
            phone_val = row.get(mapping.get("phone", "")) or ""
            email_val = row.get(mapping.get("email", "")) or ""

            # Check requirements
            errs = []
            if not name_val.strip():
                errs.append("Missing required field: Name")
            if not phone_val.strip():
                errs.append("Missing required field: Phone")

            if errs:
                invalid_rows.append({"row_number": idx, "row": row, "errors": errs})
                continue

            # Check duplicates
            clean_phone = phone_val.replace(" ", "").replace("-", "")
            match = existing_phones.get(clean_phone) or (existing_emails.get(email_val.lower().strip()) if email_val else None)
            if match:
                duplicates.append({
                    "row_number": idx,
                    "row": row,
                    "matched_existing_id": str(match.id),
                    "matched_existing_name": match.name,
                    "matched_reason": f"Matches existing client by {'phone' if clean_phone in existing_phones else 'email'}",
                })
            else:
                valid_rows.append({"row_number": idx, "row": row})

    else:  # Case
        existing_cases = apply_firm_filter(db.query(Case), Case, current_user).filter(Case.is_deleted == False).all()
        existing_case_nos = {c.case_no.lower().strip(): c for c in existing_cases if c.case_no}

        for idx, row in enumerate(rows, start=1):
            case_no = row.get(mapping.get("case_no", "")) or ""
            title = row.get(mapping.get("title", "")) or ""
            court = row.get(mapping.get("court", "")) or ""
            practice_area = row.get(mapping.get("practice_area", "")) or ""

            errs = []
            if not case_no.strip():
                errs.append("Missing required field: Case No")
            if not title.strip():
                errs.append("Missing required field: Title")
            if not court.strip():
                errs.append("Missing required field: Court")

            if errs:
                invalid_rows.append({"row_number": idx, "row": row, "errors": errs})
                continue

            # Check duplicate by case_no
            clean_cno = case_no.lower().strip()
            match = existing_case_nos.get(clean_cno)
            if match:
                duplicates.append({
                    "row_number": idx,
                    "row": row,
                    "matched_existing_id": str(match.id),
                    "matched_existing_title": match.title,
                    "matched_reason": f"Case number '{case_no}' already exists in firm",
                })
            else:
                valid_rows.append({"row_number": idx, "row": row})

    return {
        "total_evaluated": len(rows),
        "valid_count": len(valid_rows),
        "invalid_count": len(invalid_rows),
        "duplicate_count": len(duplicates),
        "invalid_records": invalid_rows[:50],
        "duplicate_records": duplicates[:50],
    }


@router.post("/migrate/execute")
async def execute_migration(
    payload: MigrationExecuteRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    """
    Step 3: Execute migration inside database transaction with tenant isolation.
    """
    ip = extract_ip(request)
    entity = payload.entity_type
    rows = payload.rows
    mapping = payload.mapping
    strategy = payload.duplicate_strategy.lower()  # skip | update | create_new

    if len(rows) > 5000:
        raise HTTPException(
            status_code=400,
            detail="Migration batch size exceeds the 5,000 record safety limit. Please partition large datasets into smaller files."
        )

    imported_count = 0
    updated_count = 0
    skipped_count = 0
    error_list = []

    firm_id = current_user.firm_id

    try:
        if entity == "client":
            existing_clients = apply_firm_filter(db.query(Client), Client, current_user).filter(Client.is_deleted == False).all()
            existing_phones = {cl.phone.replace(" ", "").replace("-", ""): cl for cl in existing_clients if cl.phone}
            existing_emails = {cl.email.lower().strip(): cl for cl in existing_clients if cl.email}

            for idx, row in enumerate(rows, start=1):
                name = (row.get(mapping.get("name", "")) or "").strip()
                phone = (row.get(mapping.get("phone", "")) or "").strip()
                email = (row.get(mapping.get("email", "")) or "").strip() or None

                if not name or not phone:
                    error_list.append(f"Row {idx}: Name and Phone are required")
                    continue

                clean_phone = phone.replace(" ", "").replace("-", "")
                existing_match = existing_phones.get(clean_phone) or (existing_emails.get(email.lower()) if email else None)

                if existing_match:
                    if strategy == "skip":
                        skipped_count += 1
                        continue
                    elif strategy == "update":
                        # Update fields
                        if email: existing_match.email = email
                        if mapping.get("address"): existing_match.address = row.get(mapping["address"])
                        if mapping.get("city"): existing_match.city = row.get(mapping["city"])
                        if mapping.get("state"): existing_match.state = row.get(mapping["state"])
                        if mapping.get("pincode"): existing_match.pincode = row.get(mapping["pincode"])
                        if mapping.get("pan"): existing_match.pan = row.get(mapping["pan"])
                        if mapping.get("company_name"): existing_match.company_name = row.get(mapping["company_name"])
                        if mapping.get("notes"): existing_match.notes = row.get(mapping["notes"])
                        updated_count += 1
                        continue
                    # Else create_new continues below

                # Create new Client
                new_client = Client(
                    name=name,
                    phone=phone,
                    email=email,
                    type=ClientType.CORPORATE if (row.get(mapping.get("company_name", "")) or (row.get(mapping.get("type", "")) or "").lower() == "corporate") else ClientType.INDIVIDUAL,
                    address=row.get(mapping.get("address", "")) or None,
                    city=row.get(mapping.get("city", "")) or None,
                    state=row.get(mapping.get("state", "")) or None,
                    pincode=row.get(mapping.get("pincode", "")) or None,
                    pan=row.get(mapping.get("pan", "")) or None,
                    company_name=row.get(mapping.get("company_name", "")) or None,
                    notes=row.get(mapping.get("notes", "")) or "Imported via Fastcase Data Bridge",
                    firm_id=firm_id,
                    created_by_id=current_user.id,
                )
                db.add(new_client)
                imported_count += 1

        else:  # Case migration
            existing_cases = apply_firm_filter(db.query(Case), Case, current_user).filter(Case.is_deleted == False).all()
            existing_case_nos = {c.case_no.lower().strip(): c for c in existing_cases if c.case_no}

            # Pre-fetch firm clients for linking
            firm_clients = apply_firm_filter(db.query(Client), Client, current_user).filter(Client.is_deleted == False).all()
            client_by_name = {cl.name.lower().strip(): cl for cl in firm_clients if cl.name}
            client_by_id = {str(cl.id): cl for cl in firm_clients}

            for idx, row in enumerate(rows, start=1):
                case_no = (row.get(mapping.get("case_no", "")) or "").strip()
                title = (row.get(mapping.get("title", "")) or "").strip()
                court = (row.get(mapping.get("court", "")) or "").strip() or "District Court"
                practice_area = (row.get(mapping.get("practice_area", "")) or "").strip() or "Civil"

                if not case_no or not title:
                    error_list.append(f"Row {idx}: Case No and Title are required")
                    continue

                clean_cno = case_no.lower().strip()
                existing_match = existing_case_nos.get(clean_cno)

                if existing_match:
                    if strategy == "skip":
                        skipped_count += 1
                        continue
                    elif strategy == "update":
                        existing_match.title = title
                        existing_match.court = court
                        if mapping.get("judge"): existing_match.judge = row.get(mapping["judge"])
                        if mapping.get("petitioner"): existing_match.petitioner = row.get(mapping["petitioner"])
                        if mapping.get("respondent"): existing_match.respondent = row.get(mapping["respondent"])
                        updated_count += 1
                        continue

                # ── Robust, Explicit Client Association (No Silent Fallback) ──
                raw_client_id = (row.get(mapping.get("client_id", "")) or "").strip()
                raw_client_name = (row.get(mapping.get("client_name", "")) or "").strip()

                client_target = None

                # 1. Check explicit client_id with strict firm isolation
                if raw_client_id:
                    try:
                        parsed_cid = uuid.UUID(raw_client_id)
                        matched_cl = client_by_id.get(str(parsed_cid))
                        if not matched_cl:
                            matched_cl = apply_firm_filter(db.query(Client), Client, current_user).filter(Client.id == parsed_cid).first()
                        if matched_cl:
                            client_target = matched_cl
                        else:
                            error_list.append(f"Row {idx} ('{case_no}'): Client ID '{raw_client_id}' does not exist in your firm. Case rejected to prevent cross-firm leakage.")
                            continue
                    except ValueError:
                        error_list.append(f"Row {idx} ('{case_no}'): Invalid Client ID format '{raw_client_id}'.")
                        continue

                # 2. Check client_name in firm
                if not client_target and raw_client_name:
                    norm_name = raw_client_name.lower().strip()
                    if norm_name in client_by_name:
                        client_target = client_by_name[norm_name]
                    else:
                        # Auto-create the specifically named client for this firm so relationship is preserved accurately
                        new_cl = Client(
                            name=raw_client_name,
                            phone=current_user.phone or "0000000000",
                            notes=f"Auto-created from case migration for matter {case_no}",
                            firm_id=firm_id,
                            created_by_id=current_user.id,
                        )
                        db.add(new_cl)
                        db.flush()
                        client_target = new_cl
                        client_by_name[norm_name] = new_cl
                        client_by_id[str(new_cl.id)] = new_cl

                # 3. If neither client_id nor client_name could be resolved:
                # Do NOT silently associate with an unrelated client! Reject row explicitly.
                if not client_target:
                    error_list.append(f"Row {idx} ('{case_no}'): Unresolvable client relationship. Every case must specify an identifiable Client Name or Client ID. Row rejected.")
                    continue

                # Parse optional dates
                def parse_date(val):
                    if not val: return None
                    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%d/%m/%y"):
                        try:
                            return datetime.strptime(val.strip(), fmt).date()
                        except Exception:
                            continue
                    return None

                filing_d = parse_date(row.get(mapping.get("filing_date", "")))
                hearing_d = parse_date(row.get(mapping.get("next_hearing_date", "")))

                new_case = Case(
                    case_no=case_no,
                    title=title,
                    court=court,
                    practice_area=practice_area,
                    client_id=client_target.id,
                    judge=row.get(mapping.get("judge", "")) or None,
                    petitioner=row.get(mapping.get("petitioner", "")) or None,
                    respondent=row.get(mapping.get("respondent", "")) or None,
                    opposing_counsel=row.get(mapping.get("opposing_counsel", "")) or None,
                    filing_date=filing_d,
                    next_hearing_date=hearing_d,
                    firm_id=firm_id,
                    created_by_id=current_user.id,
                    primary_advocate_id=current_user.id,
                )
                db.add(new_case)
                imported_count += 1

        db.commit()

        # Audit log
        log_action(
            db,
            "DATA_BRIDGE_MIGRATION",
            entity.upper(),
            str(firm_id),
            user=current_user,
            ip=ip,
            details={
                "entity_type": entity,
                "strategy": strategy,
                "imported": imported_count,
                "updated": updated_count,
                "skipped": skipped_count,
                "errors_count": len(error_list),
            }
        )

        return {
            "success": True,
            "entity_type": entity,
            "imported": imported_count,
            "updated": updated_count,
            "skipped": skipped_count,
            "errors": error_list[:50],
        }

    except Exception as e:
        db.rollback()
        logger.error(f"Migration execution failed: {e}")
        raise HTTPException(status_code=500, detail=f"Migration failed: {str(e)}")


# ── 3. Case Document Export & Practice Backup ─────────────────────────────────

@router.get("/export/case/{case_id}")
async def export_case_documents(
    case_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    """
    Package all documents belonging to a selected case into a ZIP archive with MANIFEST.json and MANIFEST.csv.
    """
    ip = extract_ip(request)
    try:
        cid = uuid.UUID(case_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid case ID format")

    case = apply_firm_filter(db.query(Case), Case, current_user).filter(Case.id == cid).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found or access denied")

    docs = db.query(Document).filter(
        Document.case_id == cid,
        Document.is_deleted == False
    ).all()

    zip_bytes, zip_filename = bridge_service.create_case_documents_zip(case, docs)

    log_action(
        db,
        "DATA_BRIDGE_EXPORT",
        "CASE_DOCUMENTS",
        str(case.id),
        user=current_user,
        ip=ip,
        details={"case_no": case.case_no, "document_count": len(docs), "archive_size": len(zip_bytes)}
    )

    return StreamingResponse(
        io.BytesIO(zip_bytes),
        media_type="application/zip",
        headers={
            "Content-Disposition": f'attachment; filename="{zip_filename}"',
            "X-Document-Count": str(len(docs)),
        }
    )


@router.get("/export/clients")
async def export_clients_csv(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    """
    Export all clients of the firm to a CSV file with formula-injection defenses.
    """
    clients = apply_firm_filter(db.query(Client), Client, current_user).filter(Client.is_deleted == False).order_by(Client.name).all()

    out = io.StringIO()
    cw = csv.writer(out)
    cw.writerow([
        "Name", "Type", "Phone", "Alternate Phone", "Email", "Address",
        "City", "State", "Pincode", "PAN", "GSTIN", "Occupation",
        "Company Name", "Contact Person", "Notes", "Created At"
    ])
    for cl in clients:
        cw.writerow([
            bridge_service.sanitize_csv_cell(cl.name),
            cl.type,
            bridge_service.sanitize_csv_cell(cl.phone),
            bridge_service.sanitize_csv_cell(cl.alternate_phone),
            bridge_service.sanitize_csv_cell(cl.email),
            bridge_service.sanitize_csv_cell(cl.address),
            bridge_service.sanitize_csv_cell(cl.city),
            bridge_service.sanitize_csv_cell(cl.state),
            bridge_service.sanitize_csv_cell(cl.pincode),
            bridge_service.sanitize_csv_cell(cl.pan),
            bridge_service.sanitize_csv_cell(cl.gstin),
            bridge_service.sanitize_csv_cell(cl.occupation),
            bridge_service.sanitize_csv_cell(cl.company_name),
            bridge_service.sanitize_csv_cell(cl.contact_person),
            bridge_service.sanitize_csv_cell(cl.notes),
            cl.created_at.isoformat() if cl.created_at else "",
        ])

    csv_data = out.getvalue()
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d")
    filename = f"Fastcase_Clients_{timestamp}.csv"

    return StreamingResponse(
        io.BytesIO(csv_data.encode("utf-8-sig")),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


@router.get("/export/cases")
async def export_cases_csv(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    """
    Export all cases of the firm to a CSV file with formula-injection defenses.
    """
    cases = apply_firm_filter(db.query(Case), Case, current_user).filter(Case.is_deleted == False).order_by(Case.created_at.desc()).all()

    out = io.StringIO()
    cw = csv.writer(out)
    cw.writerow([
        "Case No", "Title", "Court", "Bench", "Judge", "Court Complex", "Court State",
        "CNR", "Client Name", "Petitioner", "Respondent", "Opposing Counsel",
        "Practice Area", "Case Type", "Status", "Stage", "Priority", "Filing Date",
        "Next Hearing Date", "Fees Agreed", "Fees Received", "Created At"
    ])
    for cs in cases:
        cw.writerow([
            bridge_service.sanitize_csv_cell(cs.case_no),
            bridge_service.sanitize_csv_cell(cs.title),
            bridge_service.sanitize_csv_cell(cs.court),
            bridge_service.sanitize_csv_cell(cs.bench),
            bridge_service.sanitize_csv_cell(cs.judge),
            bridge_service.sanitize_csv_cell(cs.court_complex),
            bridge_service.sanitize_csv_cell(cs.court_state),
            bridge_service.sanitize_csv_cell(cs.ecourts_cnr),
            bridge_service.sanitize_csv_cell(cs.client.name if cs.client else ""),
            bridge_service.sanitize_csv_cell(cs.petitioner),
            bridge_service.sanitize_csv_cell(cs.respondent),
            bridge_service.sanitize_csv_cell(cs.opposing_counsel),
            bridge_service.sanitize_csv_cell(cs.practice_area),
            bridge_service.sanitize_csv_cell(cs.case_type),
            cs.status.value if hasattr(cs.status, "value") else str(cs.status),
            cs.stage.value if hasattr(cs.stage, "value") else str(cs.stage),
            cs.priority.value if hasattr(cs.priority, "value") else str(cs.priority),
            cs.filing_date.isoformat() if cs.filing_date else "",
            cs.next_hearing_date.isoformat() if cs.next_hearing_date else "",
            cs.fees_agreed or 0.0,
            cs.fees_received or 0.0,
            cs.created_at.isoformat() if cs.created_at else "",
        ])

    csv_data = out.getvalue()
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d")
    filename = f"Fastcase_Cases_{timestamp}.csv"

    return StreamingResponse(
        io.BytesIO(csv_data.encode("utf-8-sig")),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


@router.get("/export/practice-backup")
async def export_practice_backup(
    request: Request,
    passphrase: Optional[str] = Query(None, description="Optional AES-256-GCM encryption passphrase"),
    include_documents: bool = Query(True, description="Bundle raw document binary files up to safety quota"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    """
    Generate and stream a full firm practice backup ZIP containing clients, cases,
    document manifests, raw document files (up to 150 MB quota), and optional AES-256-GCM encryption.
    """
    ip = extract_ip(request)
    zip_bytes, zip_filename, meta = bridge_service.create_practice_backup_zip(
        current_user,
        db,
        passphrase=passphrase,
        include_document_files=include_documents,
    )

    is_enc = bool(passphrase and passphrase.strip())
    media_t = "application/octet-stream" if is_enc else "application/zip"

    log_action(
        db,
        "DATA_BRIDGE_EXPORT",
        "PRACTICE_BACKUP",
        str(current_user.firm_id),
        user=current_user,
        ip=ip,
        details={
            "archive_size": len(zip_bytes),
            "is_encrypted": is_enc,
            "completeness": meta.get("backup_completeness"),
            "doc_files_bundled": meta.get("counts", {}).get("document_files_bundled", 0),
        }
    )

    return StreamingResponse(
        io.BytesIO(zip_bytes),
        media_type=media_t,
        headers={
            "Content-Disposition": f'attachment; filename="{zip_filename}"',
            "X-Fastcase-Encrypted": "true" if is_enc else "false",
            "X-Fastcase-Completeness": str(meta.get("backup_completeness")),
        }
    )


# ── 4. Practice Restore (Disaster Recovery) ───────────────────────────────────

@router.post("/restore/validate")
async def validate_practice_restore(
    file: UploadFile = File(...),
    passphrase: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    """
    Step 1 of Disaster Recovery: Validate a practice backup archive without modifying data.
    Returns entity counts, duplicate analysis, and archive completeness.
    """
    content = await file.read()
    if len(content) > 200 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Restore archive exceeds 200 MB limit.")

    try:
        report = bridge_service.validate_restore_archive(content, current_user, db, passphrase=passphrase)
        return report
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Restore validation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Archive validation failed: {str(e)}")


@router.post("/restore/execute")
async def execute_practice_restore(
    request: Request,
    file: UploadFile = File(...),
    passphrase: Optional[str] = Form(None),
    conflict_strategy: str = Form("skip"),  # skip | update
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    """
    Step 2 of Disaster Recovery: Transactionally restore clients and cases from a verified archive.
    """
    ip = extract_ip(request)
    content = await file.read()
    if len(content) > 200 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Restore archive exceeds 200 MB limit.")

    try:
        result = bridge_service.execute_restore_archive(
            content,
            current_user,
            db,
            passphrase=passphrase,
            conflict_strategy=conflict_strategy,
        )

        log_action(
            db,
            "DATA_BRIDGE_RESTORE",
            "PRACTICE_BACKUP",
            str(current_user.firm_id),
            user=current_user,
            ip=ip,
            details=result,
        )

        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Restore execution failed: {e}")
        raise HTTPException(status_code=500, detail=f"Restore failed: {str(e)}")


# ── 4. Migration & Import History ─────────────────────────────────────────────

@router.get("/history")
async def get_bridge_history(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    """
    Retrieve audit history of Data Bridge operations (imports, migrations, and exports) for this firm.
    """
    firm_id = current_user.firm_id
    logs = db.query(AuditLog).filter(
        AuditLog.firm_id == firm_id,
        AuditLog.action.like("DATA_BRIDGE_%")
    ).order_by(AuditLog.created_at.desc()).limit(limit).all()

    return {
        "history": [
            {
                "id": str(log.id),
                "action": log.action,
                "resource_type": log.resource_type,
                "resource_id": log.resource_id,
                "created_at": log.created_at.isoformat() if log.created_at else None,
                "details": json.loads(log.details) if (log.details and log.details.startswith("{")) else log.details,
                "status": log.status,
            }
            for log in logs
        ]
    }


# ── 5. Client Document Library ───────────────────────────────────────────────

@router.get("/client-documents")
async def list_client_documents(
    client_id: Optional[str] = Query(None),
    case_id: Optional[str] = Query(None),
    doc_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    unassigned_only: bool = Query(False),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    """
    List client documents with case linking, client details, preview URLs, and search/filters.
    Strict tenant isolation enforced.
    """
    firm_cases = {c.id: c for c in apply_firm_filter(db.query(Case), Case, current_user).all()}
    firm_clients = {cl.id: cl for cl in apply_firm_filter(db.query(Client), Client, current_user).all()}

    query = db.query(Document).options(
        joinedload(Document.case),
        joinedload(Document.client)
    )

    if unassigned_only:
        query = query.filter(
            Document.client_id.is_(None),
            Document.case_id.is_(None),
            Document.uploaded_by_id == current_user.id
        )
    else:
        query = query.filter(
            sql_or(
                Document.client_id.in_(list(firm_clients.keys())),
                Document.case_id.in_(list(firm_cases.keys())),
                Document.uploaded_by_id == current_user.id,
            )
        )

    if client_id:
        try:
            clid = uuid.UUID(client_id)
            if clid not in firm_clients:
                raise HTTPException(status_code=403, detail="Client not found or access denied")
            query = query.filter(Document.client_id == clid)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid client ID")

    if case_id:
        try:
            cid = uuid.UUID(case_id)
            if cid not in firm_cases:
                raise HTTPException(status_code=403, detail="Case not found or access denied")
            query = query.filter(Document.case_id == cid)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid case ID")

    if doc_type and doc_type != "all":
        query = query.filter(Document.doc_type == doc_type)

    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        query = query.filter(
            sql_or(
                Document.name.ilike(term),
                Document.original_filename.ilike(term),
                Document.description.ilike(term),
            )
        )

    total = query.count()
    docs = query.order_by(Document.created_at.desc()).offset(skip).limit(limit).all()

    items = []
    for d in docs:
        token = _make_download_token(str(d.id), str(current_user.id))
        items.append({
            "id": str(d.id),
            "name": d.name,
            "original_filename": d.original_filename,
            "doc_type": d.doc_type,
            "file_size": d.file_size,
            "mime_type": d.mime_type,
            "description": d.description,
            "case_id": str(d.case_id) if d.case_id else None,
            "case_title": d.case.title if d.case else None,
            "case_no": d.case.case_no if d.case else None,
            "client_id": str(d.client_id) if d.client_id else None,
            "client_name": d.client.name if d.client else None,
            "client_phone": d.client.phone if d.client else None,
            "preview_url": f"/api/v1/documents/{d.id}/stream?token={token}&disposition=inline",
            "download_url": f"/api/v1/documents/{d.id}/stream?token={token}&disposition=attachment",
            "token": token,
            "ocr_processed": d.ocr_processed,
            "hash_sha256": d.hash_sha256,
            "created_at": d.created_at.isoformat() if d.created_at else None,
        })

    return {
        "total": total,
        "documents": items,
    }


# ── 6. Client-Wise Export ────────────────────────────────────────────────────

@router.get("/export/client-documents")
async def export_client_documents(
    client_id: str = Query(...),
    case_id: Optional[str] = Query(None),
    doc_ids: Optional[List[str]] = Query(None),
    request: Request = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    """
    Export all or selected documents for a specific client into a structured ZIP archive
    with folder categories (KYC, Cases, General) and JSON/CSV manifests.
    Strict tenant isolation is verified.
    """
    ip = extract_ip(request)
    try:
        clid = uuid.UUID(client_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid client ID")

    client = apply_firm_filter(db.query(Client), Client, current_user).filter(Client.id == clid).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found or access denied")

    query = db.query(Document).options(
        joinedload(Document.case),
        joinedload(Document.client)
    ).filter(Document.client_id == clid)

    if case_id:
        try:
            cid = uuid.UUID(case_id)
            query = query.filter(Document.case_id == cid)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid case ID")

    if doc_ids:
        try:
            parsed_ids = [uuid.UUID(did) for did in doc_ids if did]
            if parsed_ids:
                query = query.filter(Document.id.in_(parsed_ids))
        except ValueError:
            pass

    docs = query.order_by(Document.created_at.desc()).all()
    if not docs:
        raise HTTPException(status_code=404, detail="No documents found for this client matching the criteria")

    zip_bytes, zip_filename, summary = bridge_service.export_client_documents_zip(
        client=client,
        docs=docs,
        current_user=current_user,
        db=db,
        case_id=case_id,
    )

    log_action(
        db,
        "DATA_BRIDGE_CLIENT_EXPORT",
        "CLIENT",
        str(client.id),
        user=current_user,
        ip=ip,
        details={
            "client_name": client.name,
            "documents_count": len(docs),
            "zip_filename": zip_filename,
            "total_bytes": len(zip_bytes),
        }
    )
    db.commit()

    return StreamingResponse(
        io.BytesIO(zip_bytes),
        media_type="application/zip",
        headers={
            "Content-Disposition": f'attachment; filename="{zip_filename}"',
            "X-Export-Document-Count": str(len(docs)),
        }
    )


# ── 7. AI Drafting and Document Improvement ──────────────────────────────────

class AIDraftImproveRequest(BaseModel):
    doc_id: Optional[str] = None
    text: Optional[str] = None
    operation: str = Field(..., description="improve_grammar | make_professional | restructure | summarize | prepare_draft | revise_with_instructions | compare_draft | generate_first_draft")
    instructions: Optional[str] = None
    facts: Optional[str] = None
    save_as_draft: bool = False
    draft_title: Optional[str] = None
    category: Optional[str] = "other"
    language: Optional[str] = "en"
    client_id: Optional[str] = None
    case_id: Optional[str] = None


@router.post("/ai-draft-improve")
async def ai_draft_improve(
    payload: AIDraftImproveRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    """
    AI Drafting and Document Improvement workflow:
    - Extracts text from imported document (preserving original)
    - Performs requested operation with strict legal standards (no hallucinated facts/citations)
    - Returns proposed draft in a separate editable workspace for user review
    - Fails clearly with 503 if AI service is not configured (no mock success)
    - If user approves (save_as_draft=True), saves to Drafts table without overwriting the original document
    """
    ip = extract_ip(request)
    doc = None
    source_text = payload.text or ""

    if payload.doc_id:
        try:
            did = uuid.UUID(payload.doc_id)
            doc = db.query(Document).filter(Document.id == did).first()
            if not doc:
                raise HTTPException(status_code=404, detail="Document not found")
            check_object_firm(doc.case or doc.client, current_user) if (doc.case or doc.client) else None
            if not source_text:
                if doc.ocr_text and doc.ocr_text.strip():
                    source_text = doc.ocr_text.strip()
                else:
                    from app.services.data_bridge_service import bridge_service_extract_text
                    raw_bytes = bridge_service.read_document_bytes(doc)
                    if raw_bytes:
                        source_text = bridge_service_extract_text(raw_bytes, doc.name, doc.mime_type)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid document ID")

    if not source_text and not payload.instructions and not payload.facts:
        raise HTTPException(status_code=400, detail="No document text or facts/instructions provided for AI drafting.")

    # Check AI availability
    ai_service = AIService()
    client = ai_service._get_client()
    if not client:
        raise HTTPException(
            status_code=503,
            detail="AI Service is not configured. Please configure an OpenAI API key in firm settings or system environment (OPENAI_API_KEY) to enable AI document drafting and improvement."
        )

    system_prompt = (
        "You are Fastcase AI, an expert Indian legal assistant and senior advocate.\n"
        "When improving, drafting, or analyzing legal documents:\n"
        "1. Retain all names, party identities, dates, case numbers, statutory sections, financial amounts, and factual assertions accurately.\n"
        "2. Do not invent facts, citations, court names, or legal provisions.\n"
        "3. If information is missing or ambiguous, flag it clearly with [FLAG: missing detail] for the advocate's review.\n"
        "4. Follow standard Indian court drafting conventions (high court/district court/tribunal).\n"
        "5. Output clean, well-formatted markdown without conversational chatter."
    )

    op_prompts = {
        "improve_grammar": "Review and improve the grammar, sentence structure, punctuation, and clarity of the following legal document while preserving all legal terminology and meaning exactly:\n\n",
        "make_professional": "Refine the tone of the following document to make it authoritative, formal, and strictly adhering to Indian legal drafting standards:\n\n",
        "restructure": "Reorganize the following document into standard legal structure with clear headings, numbered paragraphs, distinct facts, grounds, and prayer:\n\n",
        "summarize": "Provide a comprehensive legal summary of the following document, outlining: (1) Parties & Court, (2) Core Facts, (3) Relevant Dates & Amounts, (4) Statutory Provisions Cited, (5) Relief/Prayer Sought, and (6) Key Issues:\n\n",
        "prepare_draft": "Based on the provided document and facts, draft a formal legal pleading/document ready for court submission:\n\n",
        "revise_with_instructions": f"Revise the following document strictly incorporating the advocate's specific instructions:\nInstructions: {payload.instructions or 'Ensure professional legal standard.'}\n\nDocument:\n",
        "generate_first_draft": f"Generate a comprehensive initial legal draft using the following provided facts and instructions:\nInstructions: {payload.instructions or ''}\nFacts: {payload.facts or ''}\n\n",
        "compare_draft": "Provide a structured clause-by-clause comparison between the original document and proposed revisions, detailing key changes, legal implications, and recommendations:\n\n",
    }

    prompt_prefix = op_prompts.get(payload.operation, "Improve and draft the following legal document:\n\n")
    user_prompt = prompt_prefix + (source_text or payload.facts or payload.instructions or "")

    try:
        response = await client.chat.completions.create(
            model=settings.OPENAI_MODEL or "gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt[:12000]}
            ],
            temperature=0.2,
            max_tokens=3000,
        )
        proposed_draft = response.choices[0].message.content
    except Exception as e:
        logger.error(f"OpenAI API execution error: {e}")
        raise HTTPException(status_code=502, detail=f"AI service provider error: {str(e)}")

    # Handle explicit save as draft
    saved_draft_id = None
    if payload.save_as_draft:
        cat_enum = DraftCategory.OTHER
        if payload.category:
            try:
                cat_enum = DraftCategory(payload.category.lower())
            except Exception:
                pass

        target_case_id = None
        if payload.case_id:
            try: target_case_id = uuid.UUID(payload.case_id)
            except Exception: pass
        elif doc and doc.case_id:
            target_case_id = doc.case_id

        target_client_id = None
        if payload.client_id:
            try: target_client_id = uuid.UUID(payload.client_id)
            except Exception: pass
        elif doc and doc.client_id:
            target_client_id = doc.client_id

        new_draft = Draft(
            title=payload.draft_title or f"AI Draft - {doc.name if doc else 'Document'}",
            content=proposed_draft,
            category=cat_enum,
            case_id=target_case_id,
            client_id=target_client_id,
            created_by_id=current_user.id,
            ai_generated=True,
            ai_prompt=f"{payload.operation}: {payload.instructions or ''}",
            word_count=len(proposed_draft.split()),
        )
        db.add(new_draft)
        db.commit()
        db.refresh(new_draft)
        saved_draft_id = str(new_draft.id)

    log_action(
        db,
        "DATA_BRIDGE_AI_DRAFT",
        "DOCUMENT",
        str(doc.id) if doc else (saved_draft_id or "adhoc"),
        user=current_user,
        ip=ip,
        details={
            "operation": payload.operation,
            "document_id": str(doc.id) if doc else None,
            "saved_as_draft": payload.save_as_draft,
            "saved_draft_id": saved_draft_id,
        }
    )
    db.commit()

    return {
        "operation": payload.operation,
        "original_text": source_text,
        "proposed_draft": proposed_draft,
        "word_count": len(proposed_draft.split()),
        "saved_as_draft": payload.save_as_draft,
        "draft_id": saved_draft_id,
        "document_id": str(doc.id) if doc else None,
    }
