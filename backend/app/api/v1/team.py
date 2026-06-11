from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import datetime

from app.core.database import get_db
from app.core.permissions import require_firm_member, ROLES_ADMIN
from app.models.user import User, UserRole
from app.models.case_advocate import CaseAdvocate, CaseTask, TaskStatus
from app.models.case import Case
from app.models.hearing import Hearing
from app.models.draft import Draft
from app.models.filing import Filing
from app.models.invoice import Invoice

router = APIRouter()


def serialize_user_with_stats(user: User, db: Session, firm_case_ids: list) -> dict:
    """Compute per-user workload stats, scoped to firm cases only."""
    active_cases_count = db.query(CaseAdvocate).join(Case).filter(
        CaseAdvocate.advocate_id == user.id,
        CaseAdvocate.is_active == True,
        Case.id.in_(firm_case_ids),
        Case.status.in_(["active", "urgent"])
    ).count()

    pending_cases_count = db.query(CaseAdvocate).join(Case).filter(
        CaseAdvocate.advocate_id == user.id,
        CaseAdvocate.is_active == True,
        Case.id.in_(firm_case_ids),
        Case.status == "pending"
    ).count()

    today = datetime.date.today()
    today_hearings = db.query(Hearing).join(Case).join(CaseAdvocate).filter(
        CaseAdvocate.advocate_id == user.id,
        CaseAdvocate.is_active == True,
        Case.id.in_(firm_case_ids),
        Hearing.hearing_date == today
    ).count()

    pending_drafts = db.query(Draft).filter(
        Draft.created_by_id == user.id,
        Draft.firm_id == user.firm_id,
        Draft.is_template == False
    ).count()

    pending_filings = db.query(Filing).join(Case).join(CaseAdvocate).filter(
        CaseAdvocate.advocate_id == user.id,
        CaseAdvocate.is_active == True,
        Case.id.in_(firm_case_ids),
        Filing.status.in_(["not_ready", "ready", "defect_raised"])
    ).count()

    active_tasks = db.query(CaseTask).filter(
        CaseTask.assignee_id == user.id,
        CaseTask.case_id.in_(firm_case_ids),
        CaseTask.status.in_([TaskStatus.PENDING, TaskStatus.IN_PROGRESS])
    ).count()

    return {
        "id": str(user.id),
        "name": user.full_name,
        "email": user.email,
        "role": user.role,
        "phone": user.phone,
        "barNo": user.bar_council_no,
        "activeCases": active_cases_count,
        "pendingCases": pending_cases_count,
        "todayHearings": today_hearings,
        "pendingDrafts": pending_drafts,
        "pendingFilings": pending_filings,
        "activeTasks": active_tasks,
        "workingStatus": "Available" if active_tasks == 0 else "Busy",
        "specializations": [],
    }


@router.get("/")
async def get_team(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    """Return only team members who belong to the same firm."""
    # ── Tenant isolation ──────────────────────────────────────────────────────
    team = db.query(User).filter(
        User.firm_id == current_user.firm_id,
        User.is_active == True,
    ).all()

    firm_case_ids = [
        c.id for c in db.query(Case.id).filter(Case.firm_id == current_user.firm_id).all()
    ]

    return {
        "team": [serialize_user_with_stats(u, db, firm_case_ids) for u in team],
        "total": len(team),
    }


@router.get("/{user_id}/stats")
async def get_user_stats(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    # ── Verify target user belongs to the same firm ───────────────────────────
    user = db.query(User).filter(
        User.id == user_id,
        User.firm_id == current_user.firm_id,
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    firm_case_ids = [
        c.id for c in db.query(Case.id).filter(Case.firm_id == current_user.firm_id).all()
    ]

    cases_assigned = db.query(CaseAdvocate).filter(
        CaseAdvocate.advocate_id == user_id,
        CaseAdvocate.case_id.in_(firm_case_ids),
    ).count()

    cases_closed = db.query(CaseAdvocate).join(Case).filter(
        CaseAdvocate.advocate_id == user_id,
        CaseAdvocate.case_id.in_(firm_case_ids),
        Case.status == "closed"
    ).count()

    hearings_attended = db.query(Hearing).join(Case).join(CaseAdvocate).filter(
        CaseAdvocate.advocate_id == user_id,
        Case.id.in_(firm_case_ids),
        Hearing.status == "completed"
    ).count()

    drafts_prepared = db.query(Draft).filter(
        Draft.created_by_id == user_id,
        Draft.firm_id == current_user.firm_id,
    ).count()

    revenue = db.query(func.sum(Invoice.amount_paid)).filter(
        Invoice.created_by_id == user_id,
        Invoice.client_id.in_(
            [c.id for c in db.query(Case.client_id).filter(Case.id.in_(firm_case_ids)).all()]
        )
    ).scalar() or 0.0

    return {
        "cases_assigned": cases_assigned,
        "cases_closed": cases_closed,
        "hearings_attended": hearings_attended,
        "drafts_prepared": drafts_prepared,
        "revenue_generated": float(revenue),
    }
