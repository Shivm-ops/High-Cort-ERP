from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
import uuid

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.permissions import require_firm_member, check_object_firm, apply_firm_filter
from app.models.case import Case
from app.models.document import Document
from app.models.user import User

router = APIRouter()


def _assert_case_firm(case_id: uuid.UUID, current_user: User, db: Session) -> Case:
    """Resolve case and assert it belongs to the current firm."""
    case = apply_firm_filter(db.query(Case), Case, current_user).filter(
        Case.id == case_id
    ).first()
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

    docs = db.query(Document).filter(
        Document.case_id == case_id,
        Document.is_evidence == True
    ).order_by(Document.evidence_date.desc()).all()

    timeline = []
    for d in docs:
        timeline.append({
            "id": str(d.id),
            "name": d.name,
            "type": d.doc_type,
            "date": d.evidence_date.isoformat() if d.evidence_date else (d.created_at.isoformat() if d.created_at else ""),
            "exhibit": d.exhibit_number,
            "status": d.evidence_status,
            "uploaded_by": str(d.uploaded_by_id) if d.uploaded_by_id else None,
            "metadata": d.extracted_metadata
        })
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
        checklist.extend([
            {"id": "invoice", "name": "Invoice / Bill", "required": True, "type": "invoice"},
            {"id": "warranty", "name": "Warranty / Guarantee Card", "required": False, "type": "warranty"},
            {"id": "legal_notice", "name": "Legal Notice Sent", "required": True, "type": "legal_notice"},
            {"id": "reply", "name": "Reply from Opposite Party", "required": False, "type": "reply"}
        ])
    elif "mact" in practice_area or "motor accident" in practice_area:
        checklist.extend([
            {"id": "fir", "name": "FIR Copy", "required": True, "type": "fir"},
            {"id": "rc", "name": "RC Book", "required": True, "type": "rc"},
            {"id": "insurance", "name": "Insurance Policy", "required": True, "type": "insurance"},
            {"id": "driving_licence", "name": "Driving Licence", "required": True, "type": "driving_licence"},
            {"id": "medical", "name": "Medical Records / Post Mortem", "required": True, "type": "medical"}
        ])
    elif "civil" in practice_area or "property" in practice_area:
        checklist.extend([
            {"id": "property_docs", "name": "Property Documents / Title Deed", "required": True, "type": "title_deed"},
            {"id": "legal_notice", "name": "Legal Notice", "required": True, "type": "legal_notice"},
            {"id": "revenue_records", "name": "Revenue Records (7/12, Mutation)", "required": False, "type": "revenue_records"}
        ])
    elif "criminal" in practice_area:
        checklist.extend([
            {"id": "fir", "name": "Copy of FIR", "required": True, "type": "court_document"},
            {"id": "medical", "name": "Medical Records (if applicable)", "required": False, "type": "medical_record"}
        ])
    else:
        checklist.extend([
            {"id": "cause_of_action", "name": "Proof of Cause of Action", "required": True, "type": "evidence_document"}
        ])

    return {"checklist": checklist}


@router.post("/generate-package/{case_id}")
async def generate_filing_package(
    case_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    case = _assert_case_firm(case_id, current_user, db)

    docs = db.query(Document).filter(
        Document.case_id == case_id,
        Document.is_evidence == True
    ).order_by(Document.exhibit_number).all()

    index_html = f"<h1>Evidence Index</h1><h2>{case.title}</h2><table border='1'><tr><th>S.No</th><th>Exhibit</th><th>Document Name</th><th>Date</th></tr>"
    for i, d in enumerate(docs):
        date_str = d.evidence_date.strftime("%Y-%m-%d") if d.evidence_date else "-"
        exhibit = d.exhibit_number or "-"
        index_html += f"<tr><td>{i+1}</td><td>{exhibit}</td><td>{d.name}</td><td>{date_str}</td></tr>"
    index_html += "</table>"

    return {
        "message": "Filing Package Generated successfully",
        "index_html": index_html,
        "download_link": f"/api/v1/evidence/download-package/{case_id}"
    }
