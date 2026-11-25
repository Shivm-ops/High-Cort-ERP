import datetime
import json
import secrets
import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import ROLES_WITH_TEAM_MGMT, require_firm_member
from app.core.security import get_password_hash
from app.models.case import Case
from app.models.case_advocate import CaseAdvocate, CaseTask, TaskStatus
from app.models.draft import Draft
from app.models.filing import Filing
from app.models.hearing import Hearing
from app.models.invoice import Invoice
from app.models.subscription import SubscriptionPlan, SubscriptionStatus, TenantSubscription
from app.models.user import User, UserRole

router = APIRouter()

ALLOWED_TEAM_ROLES = {
    "admin",
    "senior_advocate",
    "associate_advocate",
    "junior_advocate",
    "paralegal",
    "clerk",
}


class TeamMemberCreate(BaseModel):
    full_name: str
    email: str
    role: str = "associate_advocate"
    phone: Optional[str] = None
    bar_council_no: Optional[str] = None
    specializations: List[str] = []
    password: Optional[str] = None


class TeamMemberUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    phone: Optional[str] = None
    bar_council_no: Optional[str] = None
    specializations: Optional[List[str]] = None


def _role_value(u: User) -> str:
    val = getattr(u, "user_type", None)
    if hasattr(val, "value"):
        return str(val.value)
    return str(val or "associate_advocate")


def _parse_specializations(raw: Optional[str]) -> List[str]:
    if not raw:
        return []
    try:
        parsed = json.loads(raw)
        if isinstance(parsed, list):
            return [str(x).strip() for x in parsed if str(x).strip()]
    except Exception:
        pass
    return [part.strip() for part in str(raw).split(",") if part.strip()]


def _can_manage_team(current_user: User, db: Session) -> bool:
    if current_user.is_superadmin:
        return True
    if current_user.user_type in ROLES_WITH_TEAM_MGMT:
        return True
    # Allow firm owner / solo associate_advocate to manage team when no admin/senior exists in firm
    has_senior_or_admin = (
        db.query(User.id)
        .filter(
            User.firm_id == current_user.firm_id,
            User.is_active == True,
            User.user_type.in_(ROLES_WITH_TEAM_MGMT),
        )
        .first()
    )
    return has_senior_or_admin is None


def _get_firm_seat_limit(firm_id, db: Session) -> Optional[int]:
    if not firm_id:
        return None
    sub = (
        db.query(TenantSubscription)
        .filter(
            TenantSubscription.firm_id == firm_id,
            TenantSubscription.status == SubscriptionStatus.ACTIVE,
        )
        .first()
    )
    if not sub or not sub.plan_id:
        return None
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == sub.plan_id).first()
    return plan.max_users if plan and plan.max_users else None


def _get_advocate_case_ids(user_id, firm_case_ids: list, db: Session) -> list:
    if not firm_case_ids:
        return []
    sub_assigned = {
        row[0]
        for row in db.query(CaseAdvocate.case_id)
        .filter(
            CaseAdvocate.advocate_id == user_id,
            CaseAdvocate.is_active == True,
            CaseAdvocate.case_id.in_(firm_case_ids),
        )
        .all()
    }
    primary_assigned = {
        row[0]
        for row in db.query(Case.id)
        .filter(
            Case.id.in_(firm_case_ids),
            Case.primary_advocate_id == user_id,
        )
        .all()
    }
    return list(sub_assigned | primary_assigned)


def serialize_user_with_stats(user: User, db: Session, firm_case_ids: list) -> dict:
    """Compute per-user workload stats, scoped to firm cases only."""
    adv_case_ids = _get_advocate_case_ids(user.id, firm_case_ids, db)
    today = datetime.date.today()

    if adv_case_ids:
        active_cases_count = (
            db.query(Case)
            .filter(Case.id.in_(adv_case_ids), Case.status.in_(["active", "urgent"]))
            .count()
        )
        pending_cases_count = (
            db.query(Case)
            .filter(Case.id.in_(adv_case_ids), Case.status == "pending")
            .count()
        )
        today_hearings = (
            db.query(Hearing)
            .filter(Hearing.case_id.in_(adv_case_ids), Hearing.hearing_date == today)
            .count()
        )
        pending_filings = (
            db.query(Filing)
            .filter(
                Filing.case_id.in_(adv_case_ids),
                Filing.status.in_(["not_ready", "ready", "defect_raised"]),
            )
            .count()
        )
    else:
        active_cases_count = 0
        pending_cases_count = 0
        today_hearings = 0
        pending_filings = 0

    pending_drafts = (
        db.query(Draft)
        .filter(
            Draft.created_by_id == user.id,
            Draft.firm_id == user.firm_id,
            Draft.is_template == False,
            Draft.is_deleted == False,
        )
        .count()
    )

    if firm_case_ids:
        active_tasks = (
            db.query(CaseTask)
            .filter(
                CaseTask.assignee_id == user.id,
                CaseTask.case_id.in_(firm_case_ids),
                CaseTask.status.in_([TaskStatus.PENDING, TaskStatus.IN_PROGRESS]),
            )
            .count()
        )
    else:
        active_tasks = 0

    return {
        "id": str(user.id),
        "name": user.full_name,
        "email": user.email,
        "role": _role_value(user),
        "phone": user.phone,
        "barNo": user.bar_council_no,
        "activeCases": active_cases_count,
        "pendingCases": pending_cases_count,
        "todayHearings": today_hearings,
        "pendingDrafts": pending_drafts,
        "pendingFilings": pending_filings,
        "activeTasks": active_tasks,
        "workingStatus": "Available" if active_tasks == 0 else "Busy",
        "specializations": _parse_specializations(user.specializations),
    }


def _firm_case_ids(firm_id, db: Session) -> list:
    return [
        c.id
        for c in db.query(Case.id)
        .filter(Case.firm_id == firm_id, Case.is_deleted == False)
        .all()
    ]


@router.get("/")
async def get_team(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    """Return active team members who belong to the same firm."""
    team = (
        db.query(User)
        .filter(
            User.firm_id == current_user.firm_id,
            User.is_active == True,
        )
        .order_by(User.created_at.asc())
        .all()
    )

    firm_case_ids = _firm_case_ids(current_user.firm_id, db)

    return {
        "team": [serialize_user_with_stats(u, db, firm_case_ids) for u in team],
        "total": len(team),
        "seat_limit": _get_firm_seat_limit(current_user.firm_id, db),
        "can_manage_team": _can_manage_team(current_user, db),
    }


@router.post("/members", status_code=status.HTTP_201_CREATED)
async def create_team_member(
    payload: TeamMemberCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    if not _can_manage_team(current_user, db):
        raise HTTPException(
            status_code=403,
            detail="Only Admin or Senior Advocates can invite team members.",
        )

    role_norm = (payload.role or "associate_advocate").strip().lower()
    if role_norm not in ALLOWED_TEAM_ROLES:
        raise HTTPException(status_code=400, detail="Invalid team role specified.")

    seat_limit = _get_firm_seat_limit(current_user.firm_id, db)
    active_count = (
        db.query(User)
        .filter(User.firm_id == current_user.firm_id, User.is_active == True)
        .count()
    )
    if seat_limit is not None and active_count >= seat_limit:
        raise HTTPException(
            status_code=400,
            detail=f"Team seat limit ({seat_limit}) reached for your current plan.",
        )

    email_norm = payload.email.strip().lower()
    if not email_norm or "@" not in email_norm:
        raise HTTPException(status_code=400, detail="Please enter a valid email address.")
    if not payload.full_name.strip():
        raise HTTPException(status_code=400, detail="Full name is required.")

    if payload.password and payload.password.strip():
        if len(payload.password.strip()) < 6:
            raise HTTPException(
                status_code=400,
                detail="Temporary password must be at least 6 characters.",
            )
        raw_password = payload.password.strip()
    else:
        raw_password = f"Fc@{secrets.token_hex(4)}"

    spec_json = json.dumps(
        [s.strip() for s in (payload.specializations or []) if s and s.strip()]
    )

    existing = db.query(User).filter(User.email.ilike(email_norm)).first()
    if existing:
        if existing.is_active or str(existing.firm_id) != str(current_user.firm_id):
            raise HTTPException(
                status_code=400,
                detail="A user with this email already exists.",
            )
        # Reactivate inactive member within the same firm
        existing.full_name = payload.full_name.strip()
        existing.user_type = UserRole(role_norm)
        existing.phone = payload.phone.strip() if payload.phone else None
        existing.bar_council_no = (
            payload.bar_council_no.strip() if payload.bar_council_no else None
        )
        existing.specializations = spec_json
        existing.hashed_password = get_password_hash(raw_password)
        existing.is_active = True
        existing.is_verified = True
        member = existing
    else:
        member = User(
            email=email_norm,
            full_name=payload.full_name.strip(),
            hashed_password=get_password_hash(raw_password),
            user_type=UserRole(role_norm),
            phone=payload.phone.strip() if payload.phone else None,
            bar_council_no=payload.bar_council_no.strip()
            if payload.bar_council_no
            else None,
            specializations=spec_json,
            firm_id=current_user.firm_id,
            is_active=True,
            is_verified=True,
        )
        db.add(member)

    db.commit()
    db.refresh(member)

    firm_case_ids = _firm_case_ids(current_user.firm_id, db)
    return {
        "member": serialize_user_with_stats(member, db, firm_case_ids),
        "temporary_password": raw_password,
        "message": "Team member added successfully",
    }


@router.put("/{user_id}")
async def update_team_member(
    user_id: str,
    payload: TeamMemberUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    try:
        uid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID")

    target = (
        db.query(User)
        .filter(
            User.id == uid,
            User.firm_id == current_user.firm_id,
            User.is_active == True,
        )
        .first()
    )
    if not target:
        raise HTTPException(status_code=404, detail="Team member not found")

    is_self = str(target.id) == str(current_user.id)
    can_manage = _can_manage_team(current_user, db)

    if not is_self and not can_manage:
        raise HTTPException(
            status_code=403,
            detail="Only Admin or Senior Advocates can edit other team members.",
        )

    if payload.role is not None:
        role_norm = payload.role.strip().lower()
        if role_norm != _role_value(target) and not can_manage:
            raise HTTPException(
                status_code=403,
                detail="Only Admin or Senior Advocates can change member roles.",
            )
        if role_norm not in ALLOWED_TEAM_ROLES:
            raise HTTPException(status_code=400, detail="Invalid role specified.")
        target.user_type = UserRole(role_norm)

    if payload.full_name is not None and payload.full_name.strip():
        target.full_name = payload.full_name.strip()
    if payload.phone is not None:
        target.phone = payload.phone.strip() or None
    if payload.bar_council_no is not None:
        target.bar_council_no = payload.bar_council_no.strip() or None
    if payload.specializations is not None:
        target.specializations = json.dumps(
            [s.strip() for s in payload.specializations if s and s.strip()]
        )

    db.commit()
    db.refresh(target)

    firm_case_ids = _firm_case_ids(current_user.firm_id, db)
    return serialize_user_with_stats(target, db, firm_case_ids)


@router.delete("/{user_id}")
async def remove_team_member(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    if not _can_manage_team(current_user, db):
        raise HTTPException(
            status_code=403,
            detail="Only Admin or Senior Advocates can remove team members.",
        )

    try:
        uid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID")

    if str(uid) == str(current_user.id):
        raise HTTPException(
            status_code=400,
            detail="You cannot remove your own account.",
        )

    target = (
        db.query(User)
        .filter(
            User.id == uid,
            User.firm_id == current_user.firm_id,
            User.is_active == True,
        )
        .first()
    )
    if not target:
        raise HTTPException(status_code=404, detail="Team member not found")

    target.is_active = False
    db.commit()
    return {"message": "Team member removed", "id": str(target.id)}


@router.get("/{user_id}/stats")
async def get_user_stats(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    try:
        uid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID")

    user = (
        db.query(User)
        .filter(
            User.id == uid,
            User.firm_id == current_user.firm_id,
        )
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    firm_case_ids = _firm_case_ids(current_user.firm_id, db)
    adv_case_ids = _get_advocate_case_ids(user.id, firm_case_ids, db)

    if adv_case_ids:
        cases_assigned = len(adv_case_ids)
        cases_closed = (
            db.query(Case)
            .filter(Case.id.in_(adv_case_ids), Case.status == "closed")
            .count()
        )
        hearings_attended = (
            db.query(Hearing)
            .filter(Hearing.case_id.in_(adv_case_ids), Hearing.status == "completed")
            .count()
        )
    else:
        cases_assigned = 0
        cases_closed = 0
        hearings_attended = 0

    drafts_prepared = (
        db.query(Draft)
        .filter(
            Draft.created_by_id == user.id,
            Draft.firm_id == current_user.firm_id,
            Draft.is_deleted == False,
        )
        .count()
    )

    if firm_case_ids:
        client_ids = [
            c.client_id
            for c in db.query(Case.client_id)
            .filter(Case.id.in_(firm_case_ids), Case.client_id.isnot(None))
            .all()
        ]
        revenue = (
            db.query(func.sum(Invoice.amount_paid))
            .filter(
                Invoice.created_by_id == user.id,
                Invoice.client_id.in_(client_ids) if client_ids else False,
            )
            .scalar()
            or 0.0
        )
    else:
        revenue = 0.0

    return {
        "cases_assigned": cases_assigned,
        "cases_closed": cases_closed,
        "hearings_attended": hearings_attended,
        "drafts_prepared": drafts_prepared,
        "revenue_generated": float(revenue),
    }
