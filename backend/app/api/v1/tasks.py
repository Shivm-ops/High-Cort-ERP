from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import Optional
from datetime import date
import uuid

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.case_advocate import CaseTask, TaskStatus
from app.api.v1.case_team import serialize_task
from pydantic import BaseModel
import uuid

router = APIRouter()

class TaskUpdate(BaseModel):
    status: Optional[str] = None
    estimated_minutes: Optional[int] = None
    actual_minutes: Optional[int] = None

@router.get("/upcoming")
async def get_upcoming_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch tasks with upcoming deadlines for the dashboard widget."""
    today = date.today()
    tasks = (
        db.query(CaseTask)
        .options(joinedload(CaseTask.assignee), joinedload(CaseTask.assigned_by), joinedload(CaseTask.case))
        .filter(CaseTask.deadline != None)
        .filter(CaseTask.deadline >= today)
        .filter(CaseTask.status != TaskStatus.COMPLETED)
        .order_by(CaseTask.deadline.asc())
        .limit(10)
        .all()
    )
    
    # Custom serializer to include case info which is needed for the dashboard
    def serialize_dashboard_task(t: CaseTask) -> dict:
        data = serialize_task(t)
        if t.case:
            data["case_title"] = t.case.title
            data["case_no"] = t.case.case_no
        return data

    return {"total": len(tasks), "tasks": [serialize_dashboard_task(t) for t in tasks]}

@router.get("/all")
async def get_all_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch all tasks for the Kanban board."""
    tasks = (
        db.query(CaseTask)
        .options(joinedload(CaseTask.assignee), joinedload(CaseTask.assigned_by), joinedload(CaseTask.case))
        .filter(CaseTask.assignee_id == current_user.id)
        .order_by(CaseTask.created_at.desc())
        .all()
    )
    
    def serialize_dashboard_task(t: CaseTask) -> dict:
        data = serialize_task(t)
        data["estimated_minutes"] = getattr(t, "estimated_minutes", 0)
        data["actual_minutes"] = getattr(t, "actual_minutes", 0)
        if t.case:
            data["case_title"] = t.case.title
            data["case_no"] = t.case.case_no
        return data

    return {"tasks": [serialize_dashboard_task(t) for t in tasks]}

@router.patch("/{task_id}")
async def update_task(
    task_id: str,
    update_data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update task status or time log."""
    try:
        task_uuid = uuid.UUID(task_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid task ID")
        
    task = db.query(CaseTask).filter(CaseTask.id == task_uuid).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if update_data.status is not None:
        try:
            task.status = TaskStatus(update_data.status)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid status")

    if update_data.estimated_minutes is not None:
        task.estimated_minutes = update_data.estimated_minutes
        
    if update_data.actual_minutes is not None:
        task.actual_minutes = update_data.actual_minutes

    db.commit()
    db.refresh(task)
    return {"status": "success"}
