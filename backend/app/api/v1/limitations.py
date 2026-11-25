from datetime import date, timedelta
from typing import Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.permissions import apply_firm_filter, require_firm_member
from app.models.case import Case, CaseStatus
from app.models.notice import LegalNotice
from app.models.user import User

router = APIRouter()


class SetCaseLimitationRequest(BaseModel):
    limitation_date: date
    incident_date: Optional[date] = None
    limitation_act: Optional[str] = None
    limitation_section: Optional[str] = None


def _classify_deadline(days_left: int) -> tuple[str, str]:
    if days_left < 0:
        return "overdue", "Critical"
    if days_left <= 7:
        return "critical", "Critical"
    if days_left <= 15:
        return "warning", "Warning"
    if days_left <= 30:
        return "upcoming", "Upcoming"
    return "safe", "Safe"


@router.get("/")
async def get_limitations_dashboard(
    court_filter: Optional[str] = None,
    source_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    today = date.today()
    effective_source = (source_filter or "all").lower()

    # 1. Active firm cases with limitation dates (strict firm isolation + excluding deleted & closed)
    all_case_rows = (
        apply_firm_filter(db.query(Case), Case, current_user)
        .options(joinedload(Case.client))
        .filter(
            Case.is_deleted == False,
            Case.status != CaseStatus.CLOSED,
            Case.limitation_date.isnot(None),
        )
        .all()
    )

    filtered_case_rows = all_case_rows
    if court_filter and court_filter != "All":
        cf = court_filter.lower()
        filtered_case_rows = [
            c for c in all_case_rows if c.court and cf in c.court.lower()
        ]

    # 2. Pending received firm legal notices with reply deadlines
    all_notice_rows = (
        apply_firm_filter(db.query(LegalNotice), LegalNotice, current_user)
        .options(joinedload(LegalNotice.client), joinedload(LegalNotice.case))
        .filter(
            LegalNotice.is_deleted == False,
            LegalNotice.direction == "received",
            LegalNotice.status == "pending_reply",
            LegalNotice.reply_deadline.isnot(None),
        )
        .all()
    )

    matters = []

    if effective_source in ("all", "case"):
        for c in filtered_case_rows:
            days_left = (c.limitation_date - today).days
            status_val, risk_val = _classify_deadline(days_left)
            matters.append(
                {
                    "id": str(c.id),
                    "source": "case",
                    "case_id": str(c.id),
                    "notice_id": None,
                    "case_no": c.case_no,
                    "title": c.title,
                    "court": c.court,
                    "client_name": c.client.name if c.client else None,
                    "limitation_date": c.limitation_date.isoformat(),
                    "incident_date": c.incident_date.isoformat()
                    if c.incident_date
                    else None,
                    "days_left": days_left,
                    "status": status_val,
                    "risk": risk_val,
                    "limitation_act": c.limitation_act or "Standard Limitation",
                    "limitation_section": c.limitation_section or "General",
                    "practice_area": c.practice_area,
                }
            )

    if effective_source in ("all", "notice") and (
        not court_filter or court_filter == "All"
    ):
        for n in all_notice_rows:
            days_left = (n.reply_deadline - today).days
            status_val, risk_val = _classify_deadline(days_left)
            source_start = n.received_date or n.notice_date
            matters.append(
                {
                    "id": f"notice-{n.id}",
                    "source": "notice",
                    "case_id": str(n.case_id) if n.case_id else None,
                    "notice_id": str(n.id),
                    "case_no": n.reference_no
                    or (n.case.case_no if n.case else "Pre-litigation"),
                    "title": n.subject,
                    "court": "Notice Reply",
                    "client_name": n.client.name if n.client else None,
                    "limitation_date": n.reply_deadline.isoformat(),
                    "incident_date": source_start.isoformat()
                    if source_start
                    else None,
                    "days_left": days_left,
                    "status": status_val,
                    "risk": risk_val,
                    "limitation_act": n.notice_type or "Legal Notice",
                    "limitation_section": f"Opponent: {n.opponent_name}",
                    "practice_area": "Notices & Replies",
                }
            )

    matters.sort(key=lambda x: x["days_left"])

    today_count = sum(1 for m in matters if m["days_left"] == 0)
    tomorrow_count = sum(1 for m in matters if m["days_left"] == 1)
    overdue_count = sum(1 for m in matters if m["days_left"] < 0)
    within_7_days_count = sum(1 for m in matters if 0 <= m["days_left"] <= 7)

    return {
        "widgets": {
            "today": today_count,
            "tomorrow": tomorrow_count,
            "overdue": overdue_count,
            "within_7_days": within_7_days_count,
            "case_count": len(all_case_rows),
            "notice_count": len(all_notice_rows),
        },
        "matters": matters,
    }


@router.put("/case/{case_id}")
async def set_case_limitation(
    case_id: str,
    payload: SetCaseLimitationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    try:
        cid = uuid.UUID(case_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid case ID")

    case = (
        apply_firm_filter(db.query(Case), Case, current_user)
        .filter(Case.id == cid, Case.is_deleted == False)
        .first()
    )
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    case.limitation_date = payload.limitation_date
    if payload.incident_date is not None:
        case.incident_date = payload.incident_date
    if payload.limitation_act is not None:
        case.limitation_act = payload.limitation_act.strip() or None
    if payload.limitation_section is not None:
        case.limitation_section = payload.limitation_section.strip() or None

    db.commit()
    db.refresh(case)

    return {
        "id": str(case.id),
        "case_no": case.case_no,
        "title": case.title,
        "limitation_date": case.limitation_date.isoformat()
        if case.limitation_date
        else None,
        "incident_date": case.incident_date.isoformat()
        if case.incident_date
        else None,
        "limitation_act": case.limitation_act,
        "limitation_section": case.limitation_section,
    }
