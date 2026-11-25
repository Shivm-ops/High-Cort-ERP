"""
app/api/v1/property_check.py
============================
FastCase Property Legal Check, Court Case Search & Title Due Diligence API.
"""

import os
import uuid
import re
import hashlib
import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, Request
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.models.property_check import (
    PropertyCheckRequest,
    PropertyDocument,
    PropertyCheckResult,
    AdvocateTitleSearchOrder,
    CheckStatus,
    RiskCategory,
    AdvocateVerificationStatus,
)
from app.services.property.search_engine import UnifiedPropertySearchEngine
from app.services.property.report_generator import PropertyReportGenerator
from app.services.document_service import DocumentService

logger = logging.getLogger("property_check_api")
router = APIRouter()
doc_service = DocumentService()


# ── Schemas ────────────────────────────────────────────────────────────────────

class PropertySearchInitiateRequest(BaseModel):
    property_category: str = Field("agricultural_land", description="agricultural_land | residential_plot | na_plot | flat_apartment | commercial_property | industrial_property")
    state: str = "Maharashtra"
    district: str
    taluka: Optional[str] = ""
    village_city: Optional[str] = ""
    survey_number: Optional[str] = ""
    gat_number: Optional[str] = ""
    cts_number: Optional[str] = ""
    property_address: Optional[str] = ""
    current_owner_name: str
    previous_owner_names: Optional[List[str]] = []
    search_type: str = "detailed"


class AdvocateOpinionRequest(BaseModel):
    client_notes: Optional[str] = ""
    preferred_language: str = "mr"


# ── Helper to resolve current citizen or user if logged in ────────────────────

def get_optional_user(request: Request, db: Session) -> tuple[Optional[uuid.UUID], Optional[uuid.UUID]]:
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        try:
            from app.core.security import decode_token
            token = auth_header.split(" ")[1]
            token_data = decode_token(token)
            if token_data and "sub" in token_data:
                u = db.query(User).filter(User.id == uuid.UUID(token_data["sub"])).first()
                if u:
                    return u.id, u.firm_id
        except Exception:
            pass
    return None, None


ALLOWED_PROPERTY_DOC_EXTS = {".pdf", ".png", ".jpg", ".jpeg", ".tif", ".tiff"}


def _assert_property_check_access(
    req: PropertyCheckRequest,
    request: Request,
    db: Session,
) -> None:
    """Enforce ownership on property checks linked to a user or firm."""
    if req.user_id is None and req.firm_id is None:
        return
    user_id, firm_id = get_optional_user(request, db)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required for this property check")
    if req.user_id and str(req.user_id) == str(user_id):
        return
    if req.firm_id and firm_id and str(req.firm_id) == str(firm_id):
        return
    caller = db.query(User).filter(User.id == user_id).first()
    if caller and caller.is_superadmin:
        return
    raise HTTPException(status_code=403, detail="Access denied")


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/categories")
def get_property_categories():
    """List supported property categories and description for consumer UI."""
    return {
        "categories": [
            {
                "id": "agricultural_land",
                "name": "Agricultural Land (शेती जमीन)",
                "description": "7/12 Satbara, Khatedar verification, Ferfar mutations, and civil court dispute checks.",
                "primary_document": "7/12 Extract (Satbara Utara)"
            },
            {
                "id": "residential_plot",
                "name": "Residential Plot (निवासी प्लॉट)",
                "description": "Layout sanctions, NA orders, Survey/Gat records, and title chain verification.",
                "primary_document": "7/12 & NA Order"
            },
            {
                "id": "na_plot",
                "name": "NA Plot (अकृषक प्लॉट)",
                "description": "Non-Agricultural order, collector sanctions, demarcation, and title clearance.",
                "primary_document": "NA Order & Sanctioned Layout"
            },
            {
                "id": "flat_apartment",
                "name": "Flat / Apartment (फ्लॅट / सदनिका)",
                "description": "Index II search, registered agreement to sell, Society share certificates, and builder approvals.",
                "primary_document": "Registered Agreement & Index II"
            },
            {
                "id": "commercial_property",
                "name": "Commercial Property (व्यावसायिक जागा)",
                "description": "Commercial zoning, municipal property tax, commercial title chain, and bank encumbrance.",
                "primary_document": "Property Card & SRO Registration"
            },
            {
                "id": "industrial_property",
                "name": "Industrial Property (औद्योगिक भूखंड)",
                "description": "MIDC allotment, industrial NA, environmental clearances, and legal charge verification.",
                "primary_document": "MIDC Allotment / Order"
            },
        ]
    }


@router.post("/search")
async def initiate_property_search(
    payload: PropertySearchInitiateRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Execute unified property legal check, court case search,
    and title due diligence across authorized records.
    """
    user_id, firm_id = get_optional_user(request, db)

    # 1. Create Request Record
    check_req = PropertyCheckRequest(
        user_id=user_id,
        firm_id=firm_id,
        property_category=payload.property_category,
        state=payload.state or "Maharashtra",
        district=payload.district.strip(),
        taluka=payload.taluka.strip() if payload.taluka else "",
        village_city=payload.village_city.strip() if payload.village_city else "",
        survey_number=payload.survey_number.strip() if payload.survey_number else None,
        gat_number=payload.gat_number.strip() if payload.gat_number else None,
        cts_number=payload.cts_number.strip() if payload.cts_number else None,
        property_address=payload.property_address.strip() if payload.property_address else "",
        current_owner_name=payload.current_owner_name.strip(),
        previous_owner_names=payload.previous_owner_names or [],
        search_type=payload.search_type,
        status=CheckStatus.PENDING,
    )
    db.add(check_req)
    db.commit()
    db.refresh(check_req)

    # 2. Run Search Engine
    engine = UnifiedPropertySearchEngine(db)
    result = await engine.execute_check(check_req.id)

    return {
        "check_id": str(check_req.id),
        "status": check_req.status.value,
        "risk_category": result.risk_category.value,
        "risk_score": result.risk_score,
        "summary_verdict": result.summary_verdict,
        "sources_checked": result.sources_checked,
        "source_status": result.source_status,
        "discrepancies": result.identified_inconsistencies,
        "court_cases": result.court_cases_findings,
        "land_records": result.land_records_findings,
        "chain_of_title": result.chain_of_title_observations,
        "missing_documents": result.missing_documents,
        "recommended_next_steps": result.recommended_next_steps,
        "report_url": f"/api/v1/property-check/{check_req.id}/report",
    }


@router.post("/{check_id}/upload-document")
async def upload_property_document(
    check_id: uuid.UUID,
    request: Request,
    file: UploadFile = File(...),
    document_type: str = Form("other"),
    db: Session = Depends(get_db),
):
    """
    Upload property documents (7/12, Sale Deed, Index II) with OCR extraction
    to match against official records.
    """
    req = db.query(PropertyCheckRequest).filter(PropertyCheckRequest.id == check_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Property check record not found.")
    _assert_property_check_access(req, request, db)

    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_PROPERTY_DOC_EXTS:
        raise HTTPException(
            status_code=400,
            detail="Unsupported document type. Allowed: PDF, PNG, JPG, JPEG, TIF, TIFF.",
        )

    raw_content = await file.read()
    if len(raw_content) > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Document exceeds 20MB maximum limit.")

    file_hash = hashlib.sha256(raw_content).hexdigest()

    # Save to storage
    file_url, _ = await doc_service.upload_to_storage(
        raw_content, file.filename or "property_doc.pdf", file.content_type or "application/pdf"
    )

    # OCR text extraction
    ocr_text = await doc_service.extract_text(raw_content, file.content_type or "application/pdf")

    # Regex extraction of Marathi/English land keywords
    extracted_metadata = {}
    if ocr_text:
        surveys = re.findall(r"(?:सर्वे|सर्व्हे|गट|Gat|Survey)\s*(?:क्र\.?|No\.?|नं\.?)?\s*([0-9\/\-\_]+)", ocr_text, re.IGNORECASE)
        dates = re.findall(r"\b(\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{2,4})\b", ocr_text)
        extracted_metadata = {
            "identified_survey_numbers": list(set(surveys[:5])),
            "identified_dates": list(set(dates[:5])),
            "ocr_word_count": len(ocr_text.split()),
        }

    prop_doc = PropertyDocument(
        property_check_id=check_id,
        document_type=document_type,
        original_filename=file.filename or "uploaded_document",
        file_url=file_url,
        file_hash=file_hash,
        file_size_bytes=len(raw_content),
        ocr_extracted_text=ocr_text,
        extracted_metadata=extracted_metadata,
    )
    db.add(prop_doc)
    db.commit()

    # Rerun risk engine assessment with the new document attached
    engine = UnifiedPropertySearchEngine(db)
    result = await engine.execute_check(check_id)

    return {
        "message": "Document uploaded and analyzed successfully.",
        "document_id": str(prop_doc.id),
        "file_hash": file_hash,
        "extracted_metadata": extracted_metadata,
        "updated_risk_score": result.risk_score,
    }


@router.get("/{check_id}")
def get_property_check_details(check_id: uuid.UUID, request: Request, db: Session = Depends(get_db)):
    """Retrieve full property check results, court cases, discrepancies, and document history."""
    req = db.query(PropertyCheckRequest).filter(PropertyCheckRequest.id == check_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Property check record not found.")
    _assert_property_check_access(req, request, db)

    res = req.result
    docs = req.documents

    return {
        "check_id": str(req.id),
        "property_category": req.property_category,
        "district": req.district,
        "taluka": req.taluka,
        "village_city": req.village_city,
        "survey_number": req.survey_number,
        "gat_number": req.gat_number,
        "cts_number": req.cts_number,
        "current_owner_name": req.current_owner_name,
        "status": req.status.value,
        "created_at": req.created_at.isoformat(),
        "result": {
            "risk_category": res.risk_category.value if res else "pending",
            "risk_score": res.risk_score if res else 0.0,
            "summary_verdict": res.summary_verdict if res else "",
            "sources_checked": res.sources_checked if res else [],
            "source_status": res.source_status if res else {},
            "discrepancies": res.identified_inconsistencies if res else [],
            "court_cases": res.court_cases_findings if res else [],
            "land_records": res.land_records_findings if res else {},
            "chain_of_title": res.chain_of_title_observations if res else [],
            "missing_documents": res.missing_documents if res else [],
            "recommended_next_steps": res.recommended_next_steps if res else [],
            "report_url": f"/api/v1/property-check/{req.id}/report",
        } if res else None,
        "uploaded_documents": [
            {
                "id": str(d.id),
                "type": d.document_type,
                "filename": d.original_filename,
                "file_hash": d.file_hash,
                "extracted_metadata": d.extracted_metadata,
                "created_at": d.created_at.isoformat(),
            }
            for d in docs
        ],
    }


@router.get("/{check_id}/report", response_class=HTMLResponse)
def get_printable_report(check_id: uuid.UUID, request: Request, db: Session = Depends(get_db)):
    """Render publication-grade A4 HTML report for browser printing or saving as PDF."""
    req = db.query(PropertyCheckRequest).filter(PropertyCheckRequest.id == check_id).first()
    if not req or not req.result:
        raise HTTPException(status_code=404, detail="Property check report not found.")
    _assert_property_check_access(req, request, db)

    res = req.result
    params = {
        "property_category": req.property_category,
        "district": req.district,
        "taluka": req.taluka,
        "village_city": req.village_city,
        "survey_number": req.survey_number,
        "gat_number": req.gat_number,
        "cts_number": req.cts_number,
        "current_owner_name": req.current_owner_name,
    }

    assessment_result = {
        "risk_category": res.risk_category.value,
        "risk_score": res.risk_score,
        "summary_verdict": res.summary_verdict,
        "discrepancies": res.identified_inconsistencies,
        "missing_documents": res.missing_documents,
        "verification_limitations": res.verification_limitations,
        "recommended_next_steps": res.recommended_next_steps,
    }

    html = PropertyReportGenerator.generate_html_report(
        property_request=params,
        assessment_result=assessment_result,
        land_records=res.land_records_findings or {},
        court_cases=res.court_cases_findings or [],
        registration_data=res.registration_findings or {},
        mortgage_data=res.mortgage_charge_findings or {},
        sources_status=res.source_status or {},
        report_id=str(req.id),
    )
    return HTMLResponse(content=html, status_code=200)


@router.post("/{check_id}/request-advocate-opinion")
def request_advocate_verification(
    check_id: uuid.UUID,
    payload: AdvocateOpinionRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Assign the preliminary property check to a qualified advocate firm
    for comprehensive 30-year physical title verification and signed Title Opinion.
    """
    req = db.query(PropertyCheckRequest).filter(PropertyCheckRequest.id == check_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Property check record not found.")
    _assert_property_check_access(req, request, db)

    user_id, firm_id = get_optional_user(request, db)

    order = AdvocateTitleSearchOrder(
        property_check_id=check_id,
        citizen_user_id=user_id,
        assigned_firm_id=firm_id,
        status=AdvocateVerificationStatus.REQUESTED,
        client_notes=payload.client_notes,
        fee_amount=1500.0,  # Standard configured preliminary fee
        payment_status="pending",
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    return {
        "message": "Advocate verification request submitted successfully.",
        "order_id": str(order.id),
        "status": order.status.value,
        "fee_amount": order.fee_amount,
    }
