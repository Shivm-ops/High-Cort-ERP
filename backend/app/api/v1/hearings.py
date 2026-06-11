from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from typing import Optional
from pydantic import BaseModel
import uuid
from datetime import date, time, datetime

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.permissions import (
    require_firm_member, check_object_firm, apply_firm_filter,
)
from app.models.hearing import Hearing, HearingStatus
from app.models.case import Case
from app.models.client import Client
from app.models.user import User
from app.services.whatsapp import WhatsAppService

router = APIRouter()


def serialize_hearing(h: Hearing) -> dict:
    return {
        "id": str(h.id),
        "case_id": str(h.case_id),
        "case_no": h.case.case_no if h.case else None,
        "case_title": h.case.title if h.case else None,
        "client_name": h.case.client.name if h.case and h.case.client else None,
        "client_mobile": h.case.client.phone if h.case and h.case.client else None,
        "hearing_date": h.hearing_date.isoformat(),
        "hearing_time": str(h.hearing_time) if h.hearing_time else None,
        "court": h.court,
        "courtroom": h.courtroom,
        "judge": h.judge,
        "purpose": h.purpose,
        "status": h.status,
        "notes": h.notes,
        "next_date": h.next_date.isoformat() if h.next_date else None,
        "next_purpose": h.next_purpose,
        "order_passed": h.order_passed,
        "attended_by": h.attended_by,
        "readiness_status": h.readiness_status,
        "preparation_checklist": h.preparation_checklist,
        "created_at": h.created_at.isoformat() if h.created_at else None,
    }


class HearingCreate(BaseModel):
    case_id: uuid.UUID
    hearing_date: date
    hearing_time: Optional[str] = None
    court: Optional[str] = None
    courtroom: Optional[str] = None
    judge: Optional[str] = None
    purpose: Optional[str] = None
    notes: Optional[str] = None
    attended_by: Optional[str] = None


class HearingUpdate(BaseModel):
    hearing_date: Optional[date] = None
    hearing_time: Optional[str] = None
    court: Optional[str] = None
    courtroom: Optional[str] = None
    judge: Optional[str] = None
    purpose: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    order_passed: Optional[str] = None
    next_date: Optional[date] = None
    next_purpose: Optional[str] = None
    attended_by: Optional[str] = None
    readiness_status: Optional[str] = None
    preparation_checklist: Optional[dict] = None


def _get_firm_case_ids(current_user: User, db: Session):
    """Return list of case IDs that belong to the current firm."""
    return [
        c.id for c in apply_firm_filter(db.query(Case), Case, current_user).all()
    ]


@router.get("/")
async def list_hearings(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    case_id: Optional[uuid.UUID] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    # ── Tenant isolation: scope hearings through firm cases ───────────────────
    firm_case_ids = _get_firm_case_ids(current_user, db)
    query = db.query(Hearing).options(
        joinedload(Hearing.case).joinedload(Case.client)
    ).filter(Hearing.case_id.in_(firm_case_ids))

    if date_from:
        query = query.filter(Hearing.hearing_date >= date_from)
    if date_to:
        query = query.filter(Hearing.hearing_date <= date_to)
    if case_id:
        query = query.filter(Hearing.case_id == case_id)
    if status:
        query = query.filter(Hearing.status == status)

    total = query.count()
    hearings = query.order_by(Hearing.hearing_date).offset(skip).limit(limit).all()
    return {"total": total, "hearings": [serialize_hearing(h) for h in hearings]}


@router.get("/today")
async def today_hearings(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    today = date.today()
    firm_case_ids = _get_firm_case_ids(current_user, db)
    hearings = (
        db.query(Hearing)
        .options(joinedload(Hearing.case).joinedload(Case.client))
        .filter(Hearing.case_id.in_(firm_case_ids), Hearing.hearing_date == today)
        .order_by(Hearing.hearing_time)
        .all()
    )
    return {"date": today.isoformat(), "count": len(hearings), "hearings": [serialize_hearing(h) for h in hearings]}


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_hearing(
    data: HearingCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    # ── Verify case belongs to current firm ───────────────────────────────────
    case = apply_firm_filter(db.query(Case), Case, current_user).filter(
        Case.id == data.case_id
    ).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    payload = data.model_dump()
    if payload.get("hearing_time"):
        from datetime import time as t
        parts = payload["hearing_time"].split(":")
        payload["hearing_time"] = t(int(parts[0]), int(parts[1]))
    hearing = Hearing(**payload)
    db.add(hearing)
    if not case.next_hearing_date or data.hearing_date > case.next_hearing_date:
        case.next_hearing_date = data.hearing_date
    db.commit()
    db.refresh(hearing)
    hearing = (
        db.query(Hearing)
        .options(joinedload(Hearing.case).joinedload(Case.client))
        .filter(Hearing.id == hearing.id)
        .first()
    )

    # Trigger WhatsApp notification if client has a phone number
    if case.client and case.client.phone:
        background_tasks.add_task(
            WhatsAppService.send_hearing_reminder,
            phone_number=case.client.phone,
            client_name=case.client.name,
            case_title=case.title,
            hearing_date=hearing.hearing_date.isoformat(),
            court=hearing.court or "Court"
        )

    return serialize_hearing(hearing)


@router.get("/{hearing_id}")
async def get_hearing(
    hearing_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    hearing = (
        db.query(Hearing)
        .options(joinedload(Hearing.case).joinedload(Case.client))
        .filter(Hearing.id == hearing_id)
        .first()
    )
    if not hearing:
        raise HTTPException(status_code=404, detail="Hearing not found")
    # ── Object-level security via case firm ───────────────────────────────────
    check_object_firm(hearing.case, current_user)
    return serialize_hearing(hearing)


@router.put("/{hearing_id}")
async def update_hearing(
    hearing_id: str,
    data: HearingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    hearing = db.query(Hearing).filter(Hearing.id == hearing_id).first()
    if not hearing:
        raise HTTPException(status_code=404, detail="Hearing not found")
    case = db.query(Case).filter(Case.id == hearing.case_id).first()
    if case:
        check_object_firm(case, current_user)

    payload = data.model_dump(exclude_unset=True)
    if "hearing_time" in payload and payload["hearing_time"]:
        from datetime import time as t
        parts = payload["hearing_time"].split(":")
        payload["hearing_time"] = t(int(parts[0]), int(parts[1]))
    for field, value in payload.items():
        setattr(hearing, field, value)
    hearing.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(hearing)
    hearing = (
        db.query(Hearing)
        .options(joinedload(Hearing.case).joinedload(Case.client))
        .filter(Hearing.id == hearing.id)
        .first()
    )
    return serialize_hearing(hearing)


@router.delete("/{hearing_id}")
async def delete_hearing(
    hearing_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    hearing = db.query(Hearing).filter(Hearing.id == hearing_id).first()
    if not hearing:
        raise HTTPException(status_code=404, detail="Hearing not found")
    case = db.query(Case).filter(Case.id == hearing.case_id).first()
    if case:
        check_object_firm(case, current_user)
    db.delete(hearing)
    db.commit()
    return {"message": "Hearing deleted"}
