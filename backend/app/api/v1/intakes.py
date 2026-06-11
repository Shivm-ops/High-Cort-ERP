from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import Optional, List
from pydantic import BaseModel
import uuid
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.intake import Intake, IntakeStatus
from app.models.user import User
from app.models.client import Client

router = APIRouter()

# Schemas
class IntakeBase(BaseModel):
    client_id: Optional[uuid.UUID] = None
    narrative: Optional[str] = None
    facts: Optional[str] = None
    opponent_details: Optional[str] = None
    witness_details: Optional[str] = None
    previous_litigation: Optional[str] = None
    urgency_level: Optional[str] = "Normal"
    chronology: Optional[list] = []
    document_checklist: Optional[dict] = {}
    applicable_sections: Optional[list] = []
    facts_list: Optional[list] = []
    assessment: Optional[dict] = {}
    relief_sought: Optional[str] = None
    strengths: Optional[str] = None
    weaknesses: Optional[str] = None
    risks: Optional[str] = None
    limitation_issues: Optional[str] = None
    jurisdiction_issues: Optional[str] = None
    additional_docs_required: Optional[str] = None
    status: Optional[str] = "under_review"
    fee_agreement: Optional[str] = None
    consent_received: Optional[bool] = False
    consent_details: Optional[str] = None

class IntakeCreate(IntakeBase):
    pass

class IntakeUpdate(IntakeBase):
    pass

def serialize_intake(i: Intake) -> dict:
    data = {
        "id": str(i.id),
        "client_id": str(i.client_id) if i.client_id else None,
        "client_name": i.client.name if i.client else None,
        "case_id": str(i.case_id) if i.case_id else None,
        "narrative": i.narrative,
        "facts": i.facts,
        "opponent_details": i.opponent_details,
        "witness_details": i.witness_details,
        "previous_litigation": i.previous_litigation,
        "urgency_level": i.urgency_level,
        "chronology": i.chronology or [],
        "document_checklist": i.document_checklist or {},
        "applicable_sections": i.applicable_sections or [],
        "facts_list": i.facts_list or [],
        "assessment": i.assessment or {},
        "relief_sought": i.relief_sought,
        "strengths": i.strengths,
        "weaknesses": i.weaknesses,
        "risks": i.risks,
        "limitation_issues": i.limitation_issues,
        "jurisdiction_issues": i.jurisdiction_issues,
        "additional_docs_required": i.additional_docs_required,
        "status": i.status.value if isinstance(i.status, IntakeStatus) else i.status,
        "date_of_acceptance": i.date_of_acceptance.isoformat() if i.date_of_acceptance else None,
        "fee_agreement": i.fee_agreement,
        "consent_received": i.consent_received,
        "consent_details": i.consent_details,
        "created_at": i.created_at.isoformat() if i.created_at else None,
        "updated_at": i.updated_at.isoformat() if i.updated_at else None,
    }
    return data

@router.get("/")
async def list_intakes(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Intake).options(joinedload(Intake.client)).order_by(Intake.created_at.desc())
    total = query.count()
    intakes = query.offset(skip).limit(limit).all()
    return {"total": total, "intakes": [serialize_intake(i) for i in intakes]}

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_intake(
    data: IntakeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    intake = Intake(**data.model_dump(exclude_unset=True))
    db.add(intake)
    db.commit()
    db.refresh(intake)
    
    # Reload with client
    intake = db.query(Intake).options(joinedload(Intake.client)).filter(Intake.id == intake.id).first()
    return serialize_intake(intake)

@router.get("/{intake_id}")
async def get_intake(
    intake_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    intake = db.query(Intake).options(joinedload(Intake.client)).filter(Intake.id == intake_id).first()
    if not intake:
        raise HTTPException(status_code=404, detail="Intake not found")
    return serialize_intake(intake)

@router.put("/{intake_id}")
async def update_intake(
    intake_id: uuid.UUID,
    data: IntakeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    intake = db.query(Intake).filter(Intake.id == intake_id).first()
    if not intake:
        raise HTTPException(status_code=404, detail="Intake not found")
        
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(intake, field, value)
        
    if intake.status == "accepted" and not intake.date_of_acceptance:
        intake.date_of_acceptance = datetime.utcnow()
        
    intake.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(intake)
    
    intake = db.query(Intake).options(joinedload(Intake.client)).filter(Intake.id == intake_id).first()
    return serialize_intake(intake)
