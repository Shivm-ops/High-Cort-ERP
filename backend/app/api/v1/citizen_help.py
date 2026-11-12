"""
app/api/v1/citizen_help.py
===========================
FastCase One-Click Citizen Legal Help & Grievance Assistance API:
- Multilingual Legal Knowledge Base (English, Marathi, Hindi)
- Free-text AI/Heuristic Problem Classification
- Professional Court/Department-Ready Legal Application Generator
- Verified Government Portals, Helplines & Evidence Checklists
- Persistent Storage & Pure A4 Print/PDF Views
"""

import uuid
import logging
import html as html_lib
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.citizen_help import CitizenGrievance, GrievanceStatus
from app.services.citizen_legal_kb import (
    LEGAL_CATEGORIES,
    classify_citizen_problem,
    generate_citizen_application,
)

logger = logging.getLogger("citizen_help_api")
router = APIRouter()


# ─── Pydantic Schemas ─────────────────────────────────────────────────────────

class ProblemClassifyRequest(BaseModel):
    query: str
    language: Optional[str] = "en"


class GenerateApplicationRequest(BaseModel):
    category_id: str
    language: str = "en"  # "en", "mr", "hi"
    applicant_name: str
    applicant_phone: Optional[str] = ""
    applicant_email: Optional[str] = ""
    applicant_address: Optional[str] = ""
    opposite_party: Optional[str] = ""
    opposite_party_address: Optional[str] = ""
    incident_date: Optional[str] = ""
    incident_place: Optional[str] = ""
    facts_summary: str
    relief_sought: Optional[str] = None


class SaveGrievanceRequest(BaseModel):
    category: str
    language: str = "en"
    applicant_name: str
    applicant_phone: Optional[str] = ""
    applicant_email: Optional[str] = ""
    applicant_address: Optional[str] = ""
    opposite_party: Optional[str] = ""
    opposite_party_address: Optional[str] = ""
    incident_date: Optional[str] = ""
    incident_place: Optional[str] = ""
    facts_summary: str
    relief_sought: Optional[str] = None
    target_authority: Optional[str] = None
    applicable_laws: Optional[List[Dict[str, Any]]] = []
    required_documents: Optional[List[str]] = []
    generated_application: str


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/categories")
def get_legal_categories(language: str = Query("en", pattern="^(en|mr|hi)$")):
    """
    Retrieve all 9 citizen legal help categories formatted in the requested language.
    """
    categories_list = []
    for cat_id, data in LEGAL_CATEGORIES.items():
        categories_list.append({
            "id": cat_id,
            "icon": data["icon"],
            "is_emergency": data.get("is_emergency", False),
            "emergency_hotline": data.get("emergency_hotline", ""),
            "limitation_period": data.get("limitation_period", {}).get(language, data.get("limitation_period", {}).get("en", "")),
            "name": data["names"].get(language, data["names"]["en"]),
            "tagline": data["taglines"].get(language, data["taglines"]["en"]),
            "target_authority": data["target_authority"].get(language, data["target_authority"]["en"]),
            "default_laws": data["default_laws"],
            "official_portals": data["official_portals"],
            "evidence_checklist": data["evidence_checklist"],
            "step_by_step": data["step_by_step"].get(language, data["step_by_step"]["en"]),
        })
    return {"categories": categories_list}


@router.post("/classify")
def classify_problem(payload: ProblemClassifyRequest):
    """
    Classify a free-text citizen grievance into the appropriate legal category
    with applicable statutory provisions, target authority, and immediate guidance.
    """
    result = classify_citizen_problem(payload.query)
    cat_data = result["category_data"]
    lang = payload.language if payload.language in ("en", "mr", "hi") else "en"

    return {
        "category_id": result["category_id"],
        "confidence": result["confidence"],
        "is_emergency": cat_data.get("is_emergency", False),
        "emergency_hotline": cat_data.get("emergency_hotline", ""),
        "limitation_period": cat_data.get("limitation_period", {}).get(lang, cat_data.get("limitation_period", {}).get("en", "")),
        "name": cat_data["names"].get(lang, cat_data["names"]["en"]),
        "tagline": cat_data["taglines"].get(lang, cat_data["taglines"]["en"]),
        "target_authority": cat_data["target_authority"].get(lang, cat_data["target_authority"]["en"]),
        "default_laws": cat_data["default_laws"],
        "official_portals": cat_data["official_portals"],
        "evidence_checklist": cat_data["evidence_checklist"],
        "step_by_step": cat_data["step_by_step"].get(lang, cat_data["step_by_step"]["en"]),
    }


@router.post("/generate-application")
def generate_application(payload: GenerateApplicationRequest):
    """
    Generate a formal, court/department-ready complaint application
    in the requested language (English, Marathi, or Hindi).
    """
    cat = LEGAL_CATEGORIES.get(payload.category_id, LEGAL_CATEGORIES["police_fir"])
    lang = payload.language if payload.language in ("en", "mr", "hi") else "en"

    doc_text = generate_citizen_application(
        category_id=payload.category_id,
        language=lang,
        applicant_name=payload.applicant_name,
        applicant_phone=payload.applicant_phone or "",
        applicant_address=payload.applicant_address or "",
        opposite_party=payload.opposite_party or "",
        opposite_party_address=payload.opposite_party_address or "",
        incident_date=payload.incident_date or "",
        incident_place=payload.incident_place or "",
        facts_summary=payload.facts_summary,
        relief_sought=payload.relief_sought,
    )

    return {
        "application_text": doc_text,
        "category_id": payload.category_id,
        "language": lang,
        "is_emergency": cat.get("is_emergency", False),
        "emergency_hotline": cat.get("emergency_hotline", ""),
        "limitation_period": cat.get("limitation_period", {}).get(lang, cat.get("limitation_period", {}).get("en", "")),
        "category_name": cat["names"].get(lang, cat["names"]["en"]),
        "target_authority": cat["target_authority"].get(lang, cat["target_authority"]["en"]),
        "applicable_laws": cat["default_laws"],
        "official_portals": cat["official_portals"],
        "evidence_checklist": cat["evidence_checklist"],
        "step_by_step": cat["step_by_step"].get(lang, cat["step_by_step"]["en"]),
    }


@router.post("/save")
def save_citizen_application(
    payload: SaveGrievanceRequest,
    db: Session = Depends(get_db),
    request: Request = None,
):
    """
    Save the citizen's generated application to the database.
    Works for both logged-in advocates and anonymous citizens.
    """
    # Optional authentication
    auth_header = request.headers.get("Authorization") if request else None
    user_id = None
    firm_id = None

    if auth_header and auth_header.startswith("Bearer "):
        try:
            from app.core.security import decode_token
            token = auth_header.split(" ")[1]
            token_data = decode_token(token)
            if token_data and "sub" in token_data:
                u = db.query(User).filter(User.id == uuid.UUID(token_data["sub"])).first()
                if u:
                    user_id = u.id
                    firm_id = u.firm_id
        except Exception:
            pass

    grievance = CitizenGrievance(
        user_id=user_id,
        firm_id=firm_id,
        category=payload.category,
        language=payload.language,
        applicant_name=payload.applicant_name,
        applicant_phone=payload.applicant_phone,
        applicant_email=payload.applicant_email,
        applicant_address=payload.applicant_address,
        opposite_party=payload.opposite_party,
        opposite_party_address=payload.opposite_party_address,
        incident_date=payload.incident_date,
        incident_place=payload.incident_place,
        facts_summary=payload.facts_summary,
        relief_sought=payload.relief_sought,
        target_authority=payload.target_authority,
        applicable_laws=payload.applicable_laws or [],
        required_documents=payload.required_documents or [],
        generated_application=payload.generated_application,
        status=GrievanceStatus.GENERATED,
    )
    db.add(grievance)
    db.commit()
    db.refresh(grievance)

    return {
        "success": True,
        "id": str(grievance.id),
        "message": "Grievance application saved successfully.",
        "created_at": grievance.created_at.isoformat(),
    }


@router.get("/history")
def get_user_grievances(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List previously created citizen legal applications for the current chamber/user.
    Strictly isolates citizen users (firm_id is None) to their own applications.
    """
    if current_user.firm_id:
        filter_condition = (CitizenGrievance.firm_id == current_user.firm_id) | (CitizenGrievance.user_id == current_user.id)
    else:
        filter_condition = (CitizenGrievance.user_id == current_user.id)

    records = db.query(CitizenGrievance).filter(filter_condition).order_by(CitizenGrievance.created_at.desc()).limit(50).all()

    return [
        {
            "id": str(r.id),
            "category": r.category,
            "language": r.language,
            "applicant_name": r.applicant_name,
            "applicant_phone": r.applicant_phone,
            "opposite_party": r.opposite_party,
            "incident_date": r.incident_date,
            "target_authority": r.target_authority,
            "facts_summary": r.facts_summary,
            "generated_application": r.generated_application,
            "created_at": r.created_at.isoformat(),
            "status": r.status.value if hasattr(r.status, "value") else str(r.status),
        }
        for r in records
    ]


@router.get("/applications/{grievance_id}/print-view", response_class=HTMLResponse)
def get_clean_print_view(
    grievance_id: uuid.UUID,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Render a clean, office-ready A4 document view configured specifically
    for direct browser printing or saving as PDF without web headers/navbars.
    Enforces firm-level data isolation if the application belongs to an advocate firm.
    """
    grievance = db.query(CitizenGrievance).filter(CitizenGrievance.id == grievance_id).first()
    if not grievance:
        raise HTTPException(status_code=404, detail="Application record not found.")

    # Multi-tenant security check: If grievance is tied to a specific firm, verify tenant access
    if grievance.firm_id is not None:
        auth_header = request.headers.get("Authorization")
        user_firm_id = None
        if auth_header and auth_header.startswith("Bearer "):
            try:
                from app.core.security import decode_token
                token = auth_header.split(" ")[1]
                token_data = decode_token(token)
                if token_data and "sub" in token_data:
                    u = db.query(User).filter(User.id == uuid.UUID(token_data["sub"])).first()
                    if u:
                        user_firm_id = u.firm_id
            except Exception:
                pass
        if user_firm_id != grievance.firm_id:
            raise HTTPException(status_code=403, detail="Unauthorized access to this firm's confidential grievance record.")

    doc_text = html_lib.escape(grievance.generated_application or "No content available.")
    applicant_name = html_lib.escape(grievance.applicant_name or "Applicant")
    opposite_party = html_lib.escape(grievance.opposite_party or "Opposite Party")

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Citizen Legal Application - {applicant_name} vs {opposite_party}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Tiro+Devanagari+Marathi:ital@0;1&family=Mukta:wght@400;600;700&family=Noto+Serif+Devanagari:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        @page {{
            size: A4;
            margin: 20mm 20mm 20mm 25mm;
        }}
        * {{
            box-sizing: border-box;
        }}
        body {{
            background: #f1f5f9;
            margin: 0;
            padding: 30px 10px;
            font-family: 'Mukta', 'Noto Serif Devanagari', 'Times New Roman', serif;
            color: #111827;
            line-height: 1.6;
        }}
        .print-container {{
            max-width: 820px;
            margin: 0 auto;
            background: #ffffff;
            padding: 40px 50px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            border: 1px solid #e2e8f0;
        }}
        .no-print-bar {{
            max-width: 820px;
            margin: 0 auto 20px auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #0D3B2E;
            color: #ffffff;
            padding: 12px 20px;
            border-radius: 8px;
        }}
        .print-btn {{
            background: #10b981;
            color: #ffffff;
            border: none;
            padding: 8px 20px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
        }}
        .print-content {{
            white-space: pre-wrap;
            font-size: 15px;
            line-height: 1.65;
            text-align: justify;
        }}
        @media print {{
            body {{
                background: #ffffff;
                padding: 0;
            }}
            .no-print-bar {{
                display: none;
            }}
            .print-container {{
                box-shadow: none;
                border: none;
                padding: 0;
                max-width: 100%;
            }}
            .print-content {{
                font-size: 14pt;
                line-height: 1.6;
            }}
        }}
    </style>
</head>
<body>
    <div class="no-print-bar">
        <div>
            <strong>⚖️ FastCase Citizen Legal Help</strong> &bull; Print Preview
        </div>
        <div>
            <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
        </div>
    </div>

    <div class="print-container">
        <div class="print-content">{doc_text}</div>
    </div>
</body>
</html>"""
    return HTMLResponse(content=html)
