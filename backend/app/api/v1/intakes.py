from datetime import datetime
from typing import Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import or_ as sql_or
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.permissions import apply_firm_filter, require_firm_member
from app.models.case import Case
from app.models.client import Client
from app.models.intake import Intake, IntakeStatus
from app.models.user import User

router = APIRouter()


class IntakeBase(BaseModel):
    client_id: Optional[str] = None
    case_id: Optional[str] = None
    prospect_name: Optional[str] = None
    prospect_phone: Optional[str] = None
    narrative: Optional[str] = None
    facts: Optional[str] = None
    opponent_details: Optional[str] = None
    witness_details: Optional[str] = None
    previous_litigation: Optional[str] = None
    urgency_level: Optional[str] = "Normal"
    chronology: Optional[list] = None
    document_checklist: Optional[dict] = None
    applicable_sections: Optional[list] = None
    facts_list: Optional[list] = None
    assessment: Optional[dict] = None
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


def _parse_optional_uuid(val: Optional[str], label: str) -> Optional[uuid.UUID]:
    if not val or not str(val).strip():
        return None
    try:
        return uuid.UUID(str(val).strip())
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid {label} UUID")


def _validate_firm_client_case(
    db: Session,
    current_user: User,
    client_uuid: Optional[uuid.UUID],
    case_uuid: Optional[uuid.UUID],
):
    if client_uuid:
        client = (
            apply_firm_filter(db.query(Client), Client, current_user)
            .filter(Client.id == client_uuid)
            .first()
        )
        if not client:
            raise HTTPException(status_code=403, detail="Client not found or access denied")

    if case_uuid:
        case = (
            apply_firm_filter(db.query(Case), Case, current_user)
            .filter(Case.id == case_uuid, Case.is_deleted == False)
            .first()
        )
        if not case:
            raise HTTPException(status_code=403, detail="Case not found or access denied")


def serialize_intake(i: Intake) -> dict:
    status_val = i.status.value if isinstance(i.status, IntakeStatus) else i.status
    return {
        "id": str(i.id),
        "firm_id": str(i.firm_id) if i.firm_id else None,
        "client_id": str(i.client_id) if i.client_id else None,
        "client_name": i.client.name if i.client else None,
        "prospect_name": i.prospect_name,
        "prospect_phone": i.prospect_phone,
        "case_id": str(i.case_id) if i.case_id else None,
        "case_no": i.case.case_no if i.case else None,
        "case_title": i.case.title if i.case else None,
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
        "status": status_val,
        "date_of_acceptance": i.date_of_acceptance.isoformat()
        if i.date_of_acceptance
        else None,
        "fee_agreement": i.fee_agreement,
        "consent_received": bool(i.consent_received),
        "consent_details": i.consent_details,
        "created_at": i.created_at.isoformat() if i.created_at else None,
        "updated_at": i.updated_at.isoformat() if i.updated_at else None,
    }


@router.get("/")
async def list_intakes(
    status_filter: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    base_query = (
        apply_firm_filter(db.query(Intake), Intake, current_user)
        .filter(Intake.is_deleted == False)
    )
    all_firm_intakes = base_query.all()

    summary = {
        "total": len(all_firm_intakes),
        "under_review": sum(
            1
            for it in all_firm_intakes
            if (it.status.value if isinstance(it.status, IntakeStatus) else it.status)
            == "under_review"
        ),
        "awaiting_documents": sum(
            1
            for it in all_firm_intakes
            if (it.status.value if isinstance(it.status, IntakeStatus) else it.status)
            == "awaiting_documents"
        ),
        "accepted": sum(
            1
            for it in all_firm_intakes
            if (it.status.value if isinstance(it.status, IntakeStatus) else it.status)
            == "accepted"
        ),
        "rejected": sum(
            1
            for it in all_firm_intakes
            if (it.status.value if isinstance(it.status, IntakeStatus) else it.status)
            == "rejected"
        ),
    }

    query = (
        apply_firm_filter(db.query(Intake), Intake, current_user)
        .options(joinedload(Intake.client), joinedload(Intake.case))
        .filter(Intake.is_deleted == False)
    )

    effective_status = status or status_filter
    if effective_status and effective_status != "all":
        try:
            query = query.filter(Intake.status == IntakeStatus(effective_status))
        except ValueError:
            pass

    if search and search.strip():
        pat = f"%{search.strip()}%"
        matching_client_ids = [
            c.id
            for c in apply_firm_filter(db.query(Client), Client, current_user)
            .filter(sql_or(Client.name.ilike(pat), Client.phone.ilike(pat)))
            .all()
        ]
        conds = [
            Intake.prospect_name.ilike(pat),
            Intake.prospect_phone.ilike(pat),
            Intake.narrative.ilike(pat),
            Intake.opponent_details.ilike(pat),
        ]
        if matching_client_ids:
            conds.append(Intake.client_id.in_(matching_client_ids))
        query = query.filter(sql_or(*conds))

    total = query.count()
    intakes = query.order_by(Intake.created_at.desc()).offset(skip).limit(limit).all()
    return {
        "total": total,
        "summary": summary,
        "intakes": [serialize_intake(i) for i in intakes],
    }


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_intake(
    data: IntakeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    payload = data.model_dump(exclude_unset=True)
    client_uuid = _parse_optional_uuid(payload.pop("client_id", None), "client_id")
    case_uuid = _parse_optional_uuid(payload.pop("case_id", None), "case_id")
    _validate_firm_client_case(db, current_user, client_uuid, case_uuid)

    if "status" in payload and payload["status"]:
        try:
            payload["status"] = IntakeStatus(payload["status"])
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid intake status")

    intake = Intake(
        firm_id=current_user.firm_id,
        created_by_id=current_user.id,
        client_id=client_uuid,
        case_id=case_uuid,
        **payload,
    )
    db.add(intake)
    db.commit()
    db.refresh(intake)

    intake = (
        db.query(Intake)
        .options(joinedload(Intake.client), joinedload(Intake.case))
        .filter(Intake.id == intake.id)
        .first()
    )
    return serialize_intake(intake)


@router.get("/{intake_id}")
async def get_intake(
    intake_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    intake = (
        apply_firm_filter(db.query(Intake), Intake, current_user)
        .options(joinedload(Intake.client), joinedload(Intake.case))
        .filter(Intake.id == intake_id, Intake.is_deleted == False)
        .first()
    )
    if not intake:
        raise HTTPException(status_code=404, detail="Intake not found")
    return serialize_intake(intake)


@router.put("/{intake_id}")
async def update_intake(
    intake_id: uuid.UUID,
    data: IntakeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    intake = (
        apply_firm_filter(db.query(Intake), Intake, current_user)
        .filter(Intake.id == intake_id, Intake.is_deleted == False)
        .first()
    )
    if not intake:
        raise HTTPException(status_code=404, detail="Intake not found")

    updates = data.model_dump(exclude_unset=True)

    if "client_id" in updates:
        client_uuid = _parse_optional_uuid(updates.pop("client_id"), "client_id")
        _validate_firm_client_case(db, current_user, client_uuid, None)
        intake.client_id = client_uuid

    if "case_id" in updates:
        case_uuid = _parse_optional_uuid(updates.pop("case_id"), "case_id")
        _validate_firm_client_case(db, current_user, None, case_uuid)
        intake.case_id = case_uuid

    if "status" in updates and updates["status"] is not None:
        try:
            updates["status"] = IntakeStatus(updates["status"])
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid intake status")

    for field, value in updates.items():
        if hasattr(intake, field):
            setattr(intake, field, value)

    if intake.status == IntakeStatus.ACCEPTED and not intake.date_of_acceptance:
        intake.date_of_acceptance = datetime.utcnow()

    intake.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(intake)

    intake = (
        db.query(Intake)
        .options(joinedload(Intake.client), joinedload(Intake.case))
        .filter(Intake.id == intake_id)
        .first()
    )
    return serialize_intake(intake)


@router.delete("/{intake_id}")
async def delete_intake(
    intake_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    intake = (
        apply_firm_filter(db.query(Intake), Intake, current_user)
        .filter(Intake.id == intake_id, Intake.is_deleted == False)
        .first()
    )
    if not intake:
        raise HTTPException(status_code=404, detail="Intake not found")

    intake.is_deleted = True
    intake.updated_at = datetime.utcnow()
    db.commit()
    return {"message": "Intake deleted", "id": str(intake.id)}
