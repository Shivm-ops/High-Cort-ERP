import html
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import apply_firm_filter, require_firm_member
from app.models.case import Case
from app.models.document import Document
from app.models.user import User

router = APIRouter()


def _assert_case_firm(case_id: uuid.UUID, current_user: User, db: Session) -> Case:
    """Resolve case and assert it belongs to the current firm."""
    case = (
        apply_firm_filter(db.query(Case), Case, current_user)
        .filter(Case.id == case_id, Case.is_deleted == False)
        .first()
    )
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


@router.get("/timeline/{case_id}")
async def get_evidence_timeline(
    case_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    """Returns chronological evidence timeline — scoped to current firm's case."""
    _assert_case_firm(case_id, current_user, db)

    docs = (
        db.query(Document)
        .filter(
            Document.case_id == case_id,
            Document.is_deleted == False,
            Document.is_evidence == True,
        )
        .order_by(Document.evidence_date.desc())
        .all()
    )

    timeline = []
    for d in docs:
        timeline.append(
            {
                "id": str(d.id),
                "name": d.name,
                "type": d.doc_type,
                "date": d.evidence_date.isoformat()
                if d.evidence_date
                else (d.created_at.isoformat() if d.created_at else ""),
                "exhibit": d.exhibit_number,
                "status": d.evidence_status,
                "uploaded_by": str(d.uploaded_by_id) if d.uploaded_by_id else None,
                "metadata": d.extracted_metadata,
            }
        )
    return {"timeline": timeline}


@router.get("/checklist/{case_id}")
async def get_required_documents_checklist(
    case_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    case = _assert_case_firm(case_id, current_user, db)

    checklist = [
        {"id": "id_proof", "name": "Identity Proof of Client", "required": True, "type": "identity_document"},
        {"id": "vakalatnama", "name": "Vakalatnama", "required": True, "type": "court_document"},
    ]

    practice_area = (case.practice_area or "").lower()

    if "consumer" in practice_area:
        checklist.extend(
            [
                {"id": "invoice", "name": "Invoice / Bill", "required": True, "type": "evidence_document"},
                {"id": "warranty", "name": "Warranty / Guarantee Card", "required": False, "type": "evidence_document"},
                {"id": "legal_notice", "name": "Legal Notice Sent", "required": True, "type": "notice"},
                {"id": "reply", "name": "Reply from Opposite Party", "required": False, "type": "reply"},
            ]
        )
    elif "mact" in practice_area or "motor accident" in practice_area:
        checklist.extend(
            [
                {"id": "fir", "name": "FIR Copy", "required": True, "type": "court_document"},
                {"id": "rc", "name": "RC Book", "required": True, "type": "evidence_document"},
                {"id": "insurance", "name": "Insurance Policy", "required": True, "type": "evidence_document"},
                {"id": "driving_licence", "name": "Driving Licence", "required": True, "type": "identity_document"},
                {"id": "medical", "name": "Medical Records / Post Mortem", "required": True, "type": "medical_record"},
            ]
        )
    elif "civil" in practice_area or "property" in practice_area:
        checklist.extend(
            [
                {"id": "property_docs", "name": "Property Documents / Title Deed", "required": True, "type": "property_record"},
                {"id": "legal_notice", "name": "Legal Notice", "required": True, "type": "notice"},
                {"id": "revenue_records", "name": "Revenue Records (7/12, Mutation)", "required": False, "type": "property_record"},
            ]
        )
    elif "criminal" in practice_area:
        checklist.extend(
            [
                {"id": "fir", "name": "Copy of FIR", "required": True, "type": "court_document"},
                {"id": "medical", "name": "Medical Records (if applicable)", "required": False, "type": "medical_record"},
            ]
        )
    else:
        checklist.extend(
            [
                {"id": "cause_of_action", "name": "Proof of Cause of Action", "required": True, "type": "evidence_document"}
            ]
        )

    case_docs = (
        db.query(Document)
        .filter(Document.case_id == case_id, Document.is_deleted == False)
        .all()
    )

    keyword_map = {
        "id_proof": ("aadhaar", "pan", "identity", "kyc", "passport", "voter"),
        "vakalatnama": ("vakalat", "vakalatnama"),
        "invoice": ("invoice", "bill", "receipt"),
        "warranty": ("warranty", "guarantee"),
        "legal_notice": ("notice",),
        "reply": ("reply", "rejoinder"),
        "fir": ("fir", "first information"),
        "rc": ("rc", "registration"),
        "insurance": ("insurance", "policy"),
        "driving_licence": ("licence", "license", "dl"),
        "medical": ("medical", "hospital", "post mortem", "injury", "discharge"),
        "property_docs": ("deed", "sale deed", "title", "agreement"),
        "revenue_records": ("7/12", "satbara", "mutation", "ferfar", "extract"),
        "cause_of_action": ("evidence", "proof", "exhibit", "agreement", "cheque"),
    }

    annotated = []
    for item in checklist:
        item_type = item["type"]
        keywords = keyword_map.get(item["id"], ())
        matched = []
        for d in case_docs:
            d_type = d.doc_type.value if hasattr(d.doc_type, "value") else str(d.doc_type or "")
            haystack = f"{d.name or ''} {d.description or ''}".lower()
            if any(kw in haystack for kw in keywords) or d_type == item_type:
                matched.append({"id": str(d.id), "name": d.name})

        annotated.append(
            {
                **item,
                "uploaded": len(matched) > 0,
                "matched_documents": matched,
            }
        )

    return {"checklist": annotated}


@router.post("/generate-package/{case_id}")
async def generate_filing_package(
    case_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    case = _assert_case_firm(case_id, current_user, db)

    docs = (
        db.query(Document)
        .filter(
            Document.case_id == case_id,
            Document.is_deleted == False,
            Document.is_evidence == True,
        )
        .order_by(Document.exhibit_number.asc().nullslast(), Document.created_at.asc())
        .all()
    )

    items = []
    rows_html = []
    for i, d in enumerate(docs):
        date_str = (
            d.evidence_date.strftime("%Y-%m-%d")
            if d.evidence_date
            else (d.created_at.strftime("%Y-%m-%d") if d.created_at else "-")
        )
        exhibit = d.exhibit_number or "-"
        doc_type = d.doc_type.value if hasattr(d.doc_type, "value") else str(d.doc_type or "other")
        ev_status = (
            d.evidence_status.value
            if hasattr(d.evidence_status, "value")
            else str(d.evidence_status or "uploaded")
        )
        items.append(
            {
                "s_no": i + 1,
                "id": str(d.id),
                "exhibit": exhibit,
                "name": d.name,
                "doc_type": doc_type,
                "status": ev_status,
                "date": date_str,
            }
        )
        rows_html.append(
            f"<tr><td>{i+1}</td><td>{html.escape(exhibit)}</td><td>{html.escape(d.name or '')}</td><td>{html.escape(ev_status)}</td><td>{html.escape(date_str)}</td></tr>"
        )

    index_html = (
        f"<h1>Evidence Index</h1>"
        f"<h2>{html.escape(case.case_no or '')} — {html.escape(case.title or '')}</h2>"
        f"<table border='1'><tr><th>S.No</th><th>Exhibit</th><th>Document Name</th><th>Status</th><th>Date</th></tr>"
        + "".join(rows_html)
        + "</table>"
    )

    return {
        "message": "Filing Package Generated successfully",
        "case_no": case.case_no,
        "case_title": case.title,
        "items": items,
        "index_html": index_html,
        "download_link": f"/api/v1/evidence/download-package/{case_id}",
    }
