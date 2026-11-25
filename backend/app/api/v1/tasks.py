from datetime import date, datetime
from typing import Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.api.v1.case_team import serialize_task
from app.core.database import get_db
from app.core.permissions import require_firm_member
from app.models.case import Case
from app.models.case_advocate import CaseTask, TaskStatus, TaskType
from app.models.user import User

router = APIRouter()

ALLOWED_PRIORITIES = {"low", "medium", "high"}


class FirmTaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    case_id: Optional[str] = None
    task_type: str = "other"
    priority: str = "medium"
    status: str = "pending"
    assignee_id: Optional[str] = None
    deadline: Optional[date] = None
    estimated_minutes: Optional[int] = 0
    notes: Optional[str] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    case_id: Optional[str] = None
    task_type: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    assignee_id: Optional[str] = None
    deadline: Optional[date] = None
    clear_deadline: Optional[bool] = None
    estimated_minutes: Optional[int] = None
    actual_minutes: Optional[int] = None
    notes: Optional[str] = None


def _firm_tasks_query(db: Session, current_user: User):
    q = (
        db.query(CaseTask)
        .options(
            joinedload(CaseTask.assignee),
            joinedload(CaseTask.assigned_by),
            joinedload(CaseTask.case),
        )
        .outerjoin(Case, CaseTask.case_id == Case.id)
        .filter(or_(CaseTask.case_id.is_(None), Case.is_deleted == False))
    )
    if not current_user.is_superadmin:
        q = q.filter(
            or_(
                CaseTask.firm_id == current_user.firm_id,
                Case.firm_id == current_user.firm_id,
            )
        )
    return q


def _serialize_board_task(t: CaseTask) -> dict:
    data = serialize_task(t)
    data["case_title"] = t.case.title if t.case else None
    data["case_no"] = t.case.case_no if t.case else None
    return data


def _get_firm_task_or_404(db: Session, task_uuid: uuid.UUID, current_user: User) -> CaseTask:
    task = _firm_tasks_query(db, current_user).filter(CaseTask.id == task_uuid).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


def _validate_firm_case(db: Session, case_id_str: str, current_user: User) -> Case:
    try:
        case_uuid = uuid.UUID(case_id_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid case ID")
    q = db.query(Case).filter(Case.id == case_uuid, Case.is_deleted == False)
    if not current_user.is_superadmin:
        q = q.filter(Case.firm_id == current_user.firm_id)
    case = q.first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


def _validate_firm_user(db: Session, user_id_str: str, current_user: User) -> User:
    try:
        user_uuid = uuid.UUID(user_id_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid assignee ID")
    q = db.query(User).filter(User.id == user_uuid, User.is_active == True)
    if not current_user.is_superadmin:
        q = q.filter(User.firm_id == current_user.firm_id)
    user = q.first()
    if not user:
        raise HTTPException(status_code=404, detail="Assignee not found in firm")
    return user


@router.get("/upcoming")
async def get_upcoming_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    """Fetch upcoming firm-scoped tasks for dashboard and calendar widgets."""
    today = date.today()
    tasks = (
        _firm_tasks_query(db, current_user)
        .filter(CaseTask.deadline.isnot(None))
        .filter(CaseTask.deadline >= today)
        .filter(
            CaseTask.status.notin_(
                [TaskStatus.COMPLETED, TaskStatus.REVIEWED, TaskStatus.CANCELLED]
            )
        )
        .order_by(CaseTask.deadline.asc())
        .limit(10)
        .all()
    )
    return {"total": len(tasks), "tasks": [_serialize_board_task(t) for t in tasks]}


@router.get("/all")
async def get_all_tasks(
    scope: str = Query("mine", description="mine | assigned_by_me | firm"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    """Fetch firm-scoped tasks for the Kanban board."""
    q = _firm_tasks_query(db, current_user)

    if scope == "assigned_by_me":
        q = q.filter(CaseTask.assigned_by_id == current_user.id)
    elif scope == "firm":
        pass
    else:
        scope = "mine"
        q = q.filter(CaseTask.assignee_id == current_user.id)

    tasks = q.order_by(CaseTask.created_at.desc()).all()
    return {
        "tasks": [_serialize_board_task(t) for t in tasks],
        "total": len(tasks),
        "scope": scope,
    }


@router.post("/", status_code=201)
async def create_firm_task(
    data: FirmTaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    """Create a general/office or case-linked task within the firm."""
    title = (data.title or "").strip()
    if not title:
        raise HTTPException(status_code=400, detail="Task title cannot be empty")

    linked_case = None
    if data.case_id and data.case_id.strip():
        linked_case = _validate_firm_case(db, data.case_id.strip(), current_user)

    assignee_id = current_user.id
    if data.assignee_id and data.assignee_id.strip():
        assignee = _validate_firm_user(db, data.assignee_id.strip(), current_user)
        assignee_id = assignee.id

    try:
        task_type = TaskType(data.task_type)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid task type")

    try:
        task_status = TaskStatus(data.status)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid status")

    priority = (data.priority or "medium").lower()
    if priority not in ALLOWED_PRIORITIES:
        raise HTTPException(status_code=400, detail="Invalid priority")

    firm_id = linked_case.firm_id if linked_case and linked_case.firm_id else current_user.firm_id

    task = CaseTask(
        firm_id=firm_id,
        case_id=linked_case.id if linked_case else None,
        title=title,
        description=data.description.strip() if data.description else None,
        task_type=task_type,
        priority=priority,
        status=task_status,
        assignee_id=assignee_id,
        assigned_by_id=current_user.id,
        deadline=data.deadline,
        estimated_minutes=max(0, data.estimated_minutes or 0),
        notes=data.notes,
        completed_at=datetime.utcnow() if task_status == TaskStatus.COMPLETED else None,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    task = _get_firm_task_or_404(db, task.id, current_user)
    return _serialize_board_task(task)


@router.patch("/{task_id}")
async def update_task(
    task_id: str,
    update_data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    """Update task fields, status, assignment, or time log."""
    try:
        task_uuid = uuid.UUID(task_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid task ID")

    task = _get_firm_task_or_404(db, task_uuid, current_user)

    if update_data.title is not None:
        title = update_data.title.strip()
        if not title:
            raise HTTPException(status_code=400, detail="Task title cannot be empty")
        task.title = title

    if update_data.description is not None:
        task.description = update_data.description.strip() or None

    if update_data.case_id is not None:
        if update_data.case_id.strip() == "":
            task.case_id = None
        else:
            linked_case = _validate_firm_case(db, update_data.case_id.strip(), current_user)
            task.case_id = linked_case.id
            if linked_case.firm_id and not task.firm_id:
                task.firm_id = linked_case.firm_id

    if update_data.task_type is not None:
        try:
            task.task_type = TaskType(update_data.task_type)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid task type")

    if update_data.priority is not None:
        priority = update_data.priority.lower()
        if priority not in ALLOWED_PRIORITIES:
            raise HTTPException(status_code=400, detail="Invalid priority")
        task.priority = priority

    if update_data.status is not None:
        try:
            new_status = TaskStatus(update_data.status)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid status")
        task.status = new_status
        if new_status == TaskStatus.COMPLETED:
            task.completed_at = datetime.utcnow()
        elif new_status in (TaskStatus.PENDING, TaskStatus.IN_PROGRESS):
            task.completed_at = None

    if update_data.assignee_id is not None and update_data.assignee_id.strip():
        assignee = _validate_firm_user(db, update_data.assignee_id.strip(), current_user)
        task.assignee_id = assignee.id

    if update_data.clear_deadline:
        task.deadline = None
    elif update_data.deadline is not None:
        task.deadline = update_data.deadline

    if update_data.estimated_minutes is not None:
        task.estimated_minutes = max(0, update_data.estimated_minutes)

    if update_data.actual_minutes is not None:
        task.actual_minutes = max(0, update_data.actual_minutes)

    if update_data.notes is not None:
        task.notes = update_data.notes

    if not task.firm_id and current_user.firm_id:
        task.firm_id = current_user.firm_id

    db.commit()
    db.refresh(task)
    task = _get_firm_task_or_404(db, task.id, current_user)
    return {"status": "success", "task": _serialize_board_task(task)}


@router.delete("/{task_id}")
async def delete_task(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    """Delete a firm-scoped task (general or case-linked)."""
    try:
        task_uuid = uuid.UUID(task_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid task ID")

    task = _get_firm_task_or_404(db, task_uuid, current_user)
    db.delete(task)
    db.commit()
    return {"status": "deleted", "id": str(task_uuid)}
