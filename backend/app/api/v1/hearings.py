from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from typing import Optional
from pydantic import BaseModel
import uuid
from datetime import date, time, datetime, timedelta

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
from app.services.email_service import send_court_hearing_email

router = APIRouter()


def serialize_hearing(h: Hearing) -> dict:
    return {
        "id": str(h.id),
        "case_id": str(h.case_id),
        "case_no": h.case.case_no if h.case else None,
        "case_title": h.case.title if h.case else None,
        "client_name": h.case.client.name if h.case and h.case.client else None,
        "client_mobile": h.case.client.phone if h.case and h.case.client else None,
        "client_email": h.case.client.email if h.case and h.case.client else None,
        "hearing_date": h.hearing_date.isoformat(),
        "hearing_time": str(h.hearing_time) if h.hearing_time else None,
        "court": h.court,
        "courtroom": h.courtroom,
        "judge": h.judge,
        "purpose": h.purpose,
        "status": h.status,
        "notes": h.notes,
        "reminder_sent": bool(h.reminder_sent),
        "next_date": h.next_date.isoformat() if h.next_date else None,
        "next_purpose": h.next_purpose,
        "order_passed": h.order_passed,
        "attended_by": h.attended_by,
        "readiness_status": h.readiness_status,
        "preparation_checklist": h.preparation_checklist,
        "created_at": h.created_at.isoformat() if h.created_at else None,
    }


def _dispatch_hearing_notifications(
    hearing: Hearing,
    case: Case,
    current_user: User,
    background_tasks: BackgroundTasks,
    notice_type: str = "scheduled",
):
    """Dispatch automated email and WhatsApp notifications to client for court date."""
    # 1. Email notification to Client
    if case.client and case.client.email:
        firm_name = "Fastcase Chambers"
        if hasattr(case, "firm") and case.firm and hasattr(case.firm, "name"):
            firm_name = case.firm.name

        background_tasks.add_task(
            send_court_hearing_email,
            to_email=case.client.email,
            client_name=case.client.name or "Valued Client",
            case_title=case.title or "Legal Matter",
            case_no=case.case_no or "N/A",
            hearing_date=hearing.hearing_date.isoformat(),
            hearing_time=str(hearing.hearing_time) if hearing.hearing_time else None,
            court=hearing.court or case.court or "Hon'ble Court",
            courtroom=hearing.courtroom,
            judge=hearing.judge,
            purpose=hearing.purpose,
            notes=hearing.notes,
            advocate_name=getattr(current_user, "full_name", None) or getattr(current_user, "email", "Advocate"),
            firm_name=firm_name,
            advocate_phone=getattr(current_user, "phone", None),
            advocate_email=getattr(current_user, "email", None),
            notice_type=notice_type,
        )

    # 2. WhatsApp notification if phone exists
    if case.client and case.client.phone:
        background_tasks.add_task(
            WhatsAppService.send_hearing_reminder,
            phone_number=case.client.phone,
            client_name=case.client.name or "Client",
            case_title=case.title or "Legal Matter",
            hearing_date=hearing.hearing_date.isoformat(),
            court=hearing.court or case.court or "Court",
        )



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

    # Trigger Email & WhatsApp notifications
    if hearing.case:
        _dispatch_hearing_notifications(
            hearing=hearing,
            case=hearing.case,
            current_user=current_user,
            background_tasks=background_tasks,
            notice_type="scheduled",
        )

    return serialize_hearing(hearing)


@router.post("/send-upcoming-reminders")
async def send_upcoming_reminders(
    days_ahead: int = 1,
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    """
    Scan upcoming hearings for tomorrow (or days_ahead) and send automated
    reminder emails to clients who haven't received a reminder yet.
    """
    target_date = date.today() + timedelta(days=days_ahead)
    firm_case_ids = _get_firm_case_ids(current_user, db)

    upcoming_hearings = (
        db.query(Hearing)
        .options(joinedload(Hearing.case).joinedload(Case.client))
        .filter(
            Hearing.case_id.in_(firm_case_ids),
            Hearing.hearing_date == target_date,
            Hearing.status == HearingStatus.SCHEDULED,
            Hearing.reminder_sent == False,
        )
        .all()
    )

    dispatched = 0
    for h in upcoming_hearings:
        if h.case and h.case.client and h.case.client.email:
            _dispatch_hearing_notifications(
                hearing=h,
                case=h.case,
                current_user=current_user,
                background_tasks=background_tasks,
                notice_type="reminder",
            )
            h.reminder_sent = True
            dispatched += 1

    db.commit()
    return {
        "success": True,
        "target_date": target_date.isoformat(),
        "dispatched_count": dispatched,
        "message": f"Sent {dispatched} court date reminder email(s) for {target_date.isoformat()}",
    }


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


@router.post("/{hearing_id}/notify-client")
async def notify_client_hearing_date(
    hearing_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    """
    Send court date notification email to the client on demand.
    Ideal when the client doesn't know their court date and needs an immediate notice.
    """
    hearing = (
        db.query(Hearing)
        .options(joinedload(Hearing.case).joinedload(Case.client))
        .filter(Hearing.id == hearing_id)
        .first()
    )
    if not hearing:
        raise HTTPException(status_code=404, detail="Hearing not found")
    check_object_firm(hearing.case, current_user)

    client = hearing.case.client if hearing.case else None
    if not client:
        raise HTTPException(status_code=400, detail="No client linked to this case.")
    if not client.email:
        raise HTTPException(
            status_code=400,
            detail=f"Client '{client.name}' does not have an email address configured. Please add an email address in Client Management.",
        )

    _dispatch_hearing_notifications(
        hearing=hearing,
        case=hearing.case,
        current_user=current_user,
        background_tasks=background_tasks,
        notice_type="scheduled",
    )
    hearing.reminder_sent = True
    db.commit()

    return {
        "success": True,
        "message": f"Court hearing date notification email dispatched to {client.name} ({client.email})",
        "client_name": client.name,
        "client_email": client.email,
        "hearing_date": hearing.hearing_date.isoformat(),
    }


@router.put("/{hearing_id}")
async def update_hearing(
    hearing_id: str,
    data: HearingUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    hearing = db.query(Hearing).filter(Hearing.id == hearing_id).first()
    if not hearing:
        raise HTTPException(status_code=404, detail="Hearing not found")
    case = db.query(Case).options(joinedload(Case.client)).filter(Case.id == hearing.case_id).first()
    if case:
        check_object_firm(case, current_user)

    old_hearing_date = hearing.hearing_date
    payload = data.model_dump(exclude_unset=True)
    if "hearing_time" in payload and payload["hearing_time"]:
        from datetime import time as t
        parts = payload["hearing_time"].split(":")
        payload["hearing_time"] = t(int(parts[0]), int(parts[1]))
    for field, value in payload.items():
        setattr(hearing, field, value)

    date_changed = (data.hearing_date is not None and data.hearing_date != old_hearing_date)
    if date_changed:
        hearing.reminder_sent = False

    hearing.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(hearing)
    hearing = (
        db.query(Hearing)
        .options(joinedload(Hearing.case).joinedload(Case.client))
        .filter(Hearing.id == hearing.id)
        .first()
    )

    if date_changed and hearing.case:
        _dispatch_hearing_notifications(
            hearing=hearing,
            case=hearing.case,
            current_user=current_user,
            background_tasks=background_tasks,
            notice_type="rescheduled",
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
