from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from datetime import date

from app.core.database import get_db
from app.core.permissions import require_firm_member, apply_firm_filter
from app.models.user import User
from app.models.case import Case, CaseStatus
from app.models.case_advocate import CaseAdvocate, CaseTask, AdvocateRole, TaskStatus

router = APIRouter()


def _get_firm_case_ids(current_user: User, db: Session) -> list:
    return [c.id for c in apply_firm_filter(db.query(Case), Case, current_user).all()]


def _get_firm_user_ids(current_user: User, db: Session) -> list:
    return [
        u.id for u in db.query(User).filter(
            User.firm_id == current_user.firm_id,
            User.is_active == True
        ).all()
    ]


@router.get("/advocate-workload")
async def get_advocate_workload(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    """Report: Advocate-wise workload — scoped to current firm only."""
    firm_case_ids = _get_firm_case_ids(current_user, db)
    firm_user_ids = _get_firm_user_ids(current_user, db)

    assignments = (
        db.query(CaseAdvocate)
        .options(joinedload(CaseAdvocate.advocate))
        .filter(
            CaseAdvocate.is_active == True,
            CaseAdvocate.advocate_id.in_(firm_user_ids),
            CaseAdvocate.case_id.in_(firm_case_ids),
        )
        .all()
    )

    workload = {}
    for a in assignments:
        if not a.advocate:
            continue
        adv_id = str(a.advocate_id)
        if adv_id not in workload:
            workload[adv_id] = {
                "advocate_id": adv_id,
                "name": a.advocate.full_name,
                "role": a.advocate.role,
                "active_cases": 0,
                "senior_role": 0,
                "junior_role": 0,
                "tasks_pending": 0,
                "tasks_completed": 0,
            }
        workload[adv_id]["active_cases"] += 1
        if a.role == AdvocateRole.SENIOR:
            workload[adv_id]["senior_role"] += 1
        elif a.role == AdvocateRole.JUNIOR:
            workload[adv_id]["junior_role"] += 1

    tasks = db.query(CaseTask).filter(
        CaseTask.case_id.in_(firm_case_ids),
        CaseTask.assignee_id.in_(firm_user_ids),
    ).all()
    for t in tasks:
        if not t.assignee_id:
            continue
        adv_id = str(t.assignee_id)
        if adv_id in workload:
            if t.status in [TaskStatus.PENDING, TaskStatus.IN_PROGRESS]:
                workload[adv_id]["tasks_pending"] += 1
            elif t.status in [TaskStatus.COMPLETED, TaskStatus.REVIEWED]:
                workload[adv_id]["tasks_completed"] += 1

    return {"data": list(workload.values())}


@router.get("/transfers")
async def get_transfers(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    """Report: Transferred matters — scoped to current firm."""
    firm_case_ids = _get_firm_case_ids(current_user, db)
    firm_user_ids = _get_firm_user_ids(current_user, db)

    transfers = (
        db.query(CaseAdvocate)
        .options(joinedload(CaseAdvocate.advocate), joinedload(CaseAdvocate.case))
        .filter(
            CaseAdvocate.is_active == False,
            CaseAdvocate.end_date.is_not(None),
            CaseAdvocate.case_id.in_(firm_case_ids),
            CaseAdvocate.advocate_id.in_(firm_user_ids),
        )
        .order_by(CaseAdvocate.end_date.desc())
        .all()
    )

    data = [
        {
            "case_id": str(t.case_id),
            "case_no": t.case.case_no if t.case else "Unknown",
            "advocate_name": t.advocate.full_name if t.advocate else "Unknown",
            "start_date": t.start_date.isoformat() if t.start_date else None,
            "end_date": t.end_date.isoformat() if t.end_date else None,
            "transfer_reason": t.transfer_reason or "Unspecified",
            "notes": t.notes,
        }
        for t in transfers
    ]
    return {"data": data}


@router.get("/appeals")
async def get_appeals_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    """Report: Appeals pending/disposed — scoped to current firm."""
    firm_case_ids = _get_firm_case_ids(current_user, db)

    appeals = db.query(Case).filter(
        Case.id.in_(firm_case_ids),
        Case.parent_case_id.is_not(None),
    ).all()

    total_appeals = len(appeals)
    pending = sum(1 for c in appeals if c.status in [CaseStatus.ACTIVE, CaseStatus.PENDING, CaseStatus.URGENT])
    disposed = sum(1 for c in appeals if c.status in [CaseStatus.CLOSED, CaseStatus.DISPOSED])

    data = [
        {
            "case_id": str(c.id),
            "case_no": c.case_no,
            "parent_case_id": str(c.parent_case_id),
            "court": c.court,
            "appeal_type": c.appeal_type,
            "status": c.status,
        }
        for c in appeals
    ]

    return {
        "metrics": {
            "total_appeals": total_appeals,
            "pending": pending,
            "disposed": disposed,
        },
        "data": data,
    }
