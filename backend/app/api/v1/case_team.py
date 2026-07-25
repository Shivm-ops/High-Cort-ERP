"""
Case Team API — advocate assignment, task management, appeal hierarchy, timeline.
All routes are additive; existing case endpoints are unchanged.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import Optional, List
from pydantic import BaseModel
import uuid
from datetime import date, datetime

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.case import Case
from app.models.case_advocate import CaseAdvocate, CaseTask, AdvocateRole, TaskType, TaskStatus
from app.models.document import Document
from app.models.draft import Draft
from app.models.hearing import Hearing

router = APIRouter()


# ── Serializers ───────────────────────────────────────────────────────────────

def serialize_user_brief(u: User) -> dict:
    if not u:
        return {}
    return {"id": str(u.id), "full_name": u.full_name, "email": u.email, "role": u.role, "phone": u.phone}


def serialize_advocate(a: CaseAdvocate) -> dict:
    return {
        "id": str(a.id),
        "case_id": str(a.case_id),
        "advocate_id": str(a.advocate_id),
        "advocate": serialize_user_brief(a.advocate),
        "assigned_by": serialize_user_brief(a.assigned_by) if a.assigned_by else None,
        "role": a.role,
        "start_date": a.start_date.isoformat() if a.start_date else None,
        "end_date": a.end_date.isoformat() if a.end_date else None,
        "is_active": a.is_active,
        "transfer_reason": a.transfer_reason,
        "notes": a.notes,
        "created_at": a.created_at.isoformat() if a.created_at else None,
    }


def serialize_task(t: CaseTask) -> dict:
    return {
        "id": str(t.id),
        "case_id": str(t.case_id),
        "title": t.title,
        "description": t.description,
        "task_type": t.task_type,
        "status": t.status,
        "priority": t.priority,
        "assignee_id": str(t.assignee_id) if t.assignee_id else None,
        "assignee": serialize_user_brief(t.assignee) if t.assignee else None,
        "assigned_by": serialize_user_brief(t.assigned_by) if t.assigned_by else None,
        "deadline": t.deadline.isoformat() if t.deadline else None,
        "completed_at": t.completed_at.isoformat() if t.completed_at else None,
        "notes": t.notes,
        "created_at": t.created_at.isoformat() if t.created_at else None,
        "updated_at": t.updated_at.isoformat() if t.updated_at else None,
    }


def serialize_case_brief(c: Case) -> dict:
    return {
        "id": str(c.id),
        "case_no": c.case_no,
        "title": c.title,
        "court": c.court,
        "status": c.status,
        "stage": c.stage,
        "appeal_type": c.appeal_type,
        "appeal_level": c.appeal_level or 0,
        "forum": c.forum,
        "next_hearing_date": c.next_hearing_date.isoformat() if c.next_hearing_date else None,
    }


# ── Pydantic request models ───────────────────────────────────────────────────

class AdvocateAssign(BaseModel):
    advocate_id: str
    role: str = "junior"
    notes: Optional[str] = None


class AdvocateRemove(BaseModel):
    transfer_reason: Optional[str] = None
    notes: Optional[str] = None


class TaskCreate(BaseModel):
    title: str
    task_type: str = "other"
    description: Optional[str] = None
    assignee_id: Optional[str] = None
    priority: Optional[str] = "medium"
    deadline: Optional[date] = None
    notes: Optional[str] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    task_type: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assignee_id: Optional[str] = None
    deadline: Optional[date] = None
    notes: Optional[str] = None


class AppealCreate(BaseModel):
    case_no: str
    title: str
    court: str
    forum: Optional[str] = None
    appeal_type: str = "appeal"          # appeal/revision/writ/slp/execution
    judge: Optional[str] = None
    practice_area: Optional[str] = None  # defaults to parent's
    description: Optional[str] = None
    filing_date: Optional[date] = None


# ── Advocate Team Endpoints ───────────────────────────────────────────────────

@router.get("/{case_id}/team")
async def get_team(
    case_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    advocates = (
        db.query(CaseAdvocate)
        .options(joinedload(CaseAdvocate.advocate), joinedload(CaseAdvocate.assigned_by))
        .filter(CaseAdvocate.case_id == case_id)
        .order_by(CaseAdvocate.start_date)
        .all()
    )
    active = [a for a in advocates if a.is_active]
    history = [a for a in advocates if not a.is_active]
    return {
        "active": [serialize_advocate(a) for a in active],
        "history": [serialize_advocate(a) for a in history],
    }


@router.post("/{case_id}/team", status_code=201)
async def assign_advocate(
    case_id: uuid.UUID,
    data: AdvocateAssign,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Check if advocate is already active on this case
    existing = db.query(CaseAdvocate).filter(
        CaseAdvocate.case_id == case_id,
        CaseAdvocate.advocate_id == data.advocate_id,
        CaseAdvocate.is_active == True,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Advocate is already assigned to this case")

    try:
        role = AdvocateRole(data.role)
    except ValueError:
        role = AdvocateRole.JUNIOR

    ca = CaseAdvocate(
        case_id=case_id,
        advocate_id=data.advocate_id,
        assigned_by_id=str(current_user.id),
        role=role,
        notes=data.notes,
        start_date=date.today(),
        is_active=True,
    )
    db.add(ca)

    # Also update Case.primary_advocate_id if this is a senior
    if role == AdvocateRole.SENIOR:
        case = db.query(Case).filter(Case.id == case_id).first()
        if case:
            case.primary_advocate_id = data.advocate_id

    db.commit()
    db.refresh(ca)
    # reload with joins
    ca = db.query(CaseAdvocate).options(
        joinedload(CaseAdvocate.advocate), joinedload(CaseAdvocate.assigned_by)
    ).filter(CaseAdvocate.id == ca.id).first()
    return serialize_advocate(ca)


@router.delete("/{case_id}/team/{advocate_id}", status_code=200)
async def remove_advocate(
    case_id: uuid.UUID,
    advocate_id: str,
    data: AdvocateRemove,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ca = db.query(CaseAdvocate).filter(
        CaseAdvocate.case_id == case_id,
        CaseAdvocate.advocate_id == advocate_id,
        CaseAdvocate.is_active == True,
    ).first()
    if not ca:
        raise HTTPException(status_code=404, detail="Active assignment not found")

    ca.is_active = False
    ca.end_date = date.today()
    ca.transfer_reason = data.transfer_reason
    if data.notes:
        ca.notes = (ca.notes or "") + f"\n[Removed {date.today()}] {data.notes}"
    db.commit()
    return {"message": "Advocate removed and history preserved"}


@router.put("/{case_id}/team/{advocate_id}/role")
async def update_role(
    case_id: uuid.UUID,
    advocate_id: str,
    role: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ca = db.query(CaseAdvocate).filter(
        CaseAdvocate.case_id == case_id,
        CaseAdvocate.advocate_id == advocate_id,
        CaseAdvocate.is_active == True,
    ).first()
    if not ca:
        raise HTTPException(status_code=404, detail="Active assignment not found")
    try:
        ca.role = AdvocateRole(role)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid role")
    db.commit()
    return {"message": "Role updated"}


# ── Task Endpoints ────────────────────────────────────────────────────────────

@router.get("/{case_id}/tasks")
async def get_tasks(
    case_id: uuid.UUID,
    status: Optional[str] = None,
    assignee_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = (
        db.query(CaseTask)
        .options(joinedload(CaseTask.assignee), joinedload(CaseTask.assigned_by))
        .filter(CaseTask.case_id == case_id)
    )
    if status:
        try:
            q = q.filter(CaseTask.status == TaskStatus(status))
        except ValueError:
            pass
    if assignee_id:
        q = q.filter(CaseTask.assignee_id == assignee_id)
    tasks = q.order_by(CaseTask.created_at.desc()).all()
    return {"total": len(tasks), "tasks": [serialize_task(t) for t in tasks]}


@router.post("/{case_id}/tasks", status_code=201)
async def create_task(
    case_id: uuid.UUID,
    data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        task_type = TaskType(data.task_type)
    except ValueError:
        task_type = TaskType.OTHER

    try:
        assignee_uuid = uuid.UUID(data.assignee_id) if data.assignee_id else current_user.id
    except (ValueError, AttributeError):
        assignee_uuid = current_user.id

    task = CaseTask(
        case_id=case_id,
        title=data.title,
        description=data.description,
        task_type=task_type,
        priority=data.priority or "medium",
        assignee_id=assignee_uuid,
        assigned_by_id=current_user.id,
        deadline=data.deadline,
        notes=data.notes,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    task = db.query(CaseTask).options(
        joinedload(CaseTask.assignee), joinedload(CaseTask.assigned_by)
    ).filter(CaseTask.id == task.id).first()
    return serialize_task(task)


@router.put("/{case_id}/tasks/{task_id}")
async def update_task(
    case_id: uuid.UUID,
    task_id: uuid.UUID,
    data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = db.query(CaseTask).filter(CaseTask.id == task_id, CaseTask.case_id == case_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    updates = data.model_dump(exclude_none=True)
    if "status" in updates:
        try:
            updates["status"] = TaskStatus(updates["status"])
            if updates["status"] == TaskStatus.COMPLETED:
                task.completed_at = datetime.utcnow()
            elif updates["status"] == TaskStatus.REVIEWED:
                task.reviewed_at = datetime.utcnow()
        except ValueError:
            del updates["status"]
    if "task_type" in updates:
        try:
            updates["task_type"] = TaskType(updates["task_type"])
        except ValueError:
            del updates["task_type"]

    for field, val in updates.items():
        setattr(task, field, val)
    db.commit()
    db.refresh(task)
    task = db.query(CaseTask).options(
        joinedload(CaseTask.assignee), joinedload(CaseTask.assigned_by)
    ).filter(CaseTask.id == task.id).first()
    return serialize_task(task)


@router.delete("/{case_id}/tasks/{task_id}", status_code=204)
async def delete_task(
    case_id: uuid.UUID,
    task_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = db.query(CaseTask).filter(CaseTask.id == task_id, CaseTask.case_id == case_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()


# ── Appeal Hierarchy Endpoints ────────────────────────────────────────────────

@router.post("/{case_id}/appeal", status_code=201)
async def create_appeal(
    case_id: uuid.UUID,
    data: AppealCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new appeal/higher-forum case linked to the parent case."""
    parent = db.query(Case).filter(Case.id == case_id).first()
    if not parent:
        raise HTTPException(status_code=404, detail="Parent case not found")

    appeal = Case(
        case_no=data.case_no,
        title=data.title,
        court=data.court,
        forum=data.forum,
        client_id=parent.client_id,               # inherit client
        petitioner=parent.petitioner,
        respondent=parent.respondent,
        opposing_counsel=parent.opposing_counsel,
        practice_area=data.practice_area or parent.practice_area,
        case_type=parent.case_type,
        acts_involved=parent.acts_involved or [],
        sections_involved=parent.sections_involved or [],
        description=data.description,
        primary_advocate_id=parent.primary_advocate_id,
        parent_case_id=case_id,
        appeal_type=data.appeal_type,
        appeal_level=(parent.appeal_level or 0) + 1,
        filing_date=data.filing_date,
        judge=data.judge,
    )
    db.add(appeal)

    # Mark parent as appealed
    parent.status = "appealed"

    db.commit()
    db.refresh(appeal)

    # --- Deep Data Inheritance (Clone Parent Records) ---
    # 1. Documents
    for doc in parent.documents:
        new_doc = Document(
            client_id=doc.client_id,
            case_id=appeal.id,
            name=f"[Inherited] {doc.name}",
            doc_type=doc.doc_type,
            file_path=doc.file_path,
            file_size=doc.file_size,
            mime_type=doc.mime_type,
            uploaded_by_id=doc.uploaded_by_id,
            description=doc.description,
            tags=doc.tags,
            extracted_text=doc.extracted_text,
            extracted_metadata=doc.extracted_metadata
        )
        db.add(new_doc)
        
    # 2. Drafts
    for draft in parent.drafts:
        new_draft = Draft(
            title=draft.title,
            content=draft.content,
            category=draft.category,
            language=draft.language,
            case_id=appeal.id,
            client_id=draft.client_id,
            created_by_id=draft.created_by_id,
            tags=draft.tags,
            is_template=False,
            ai_generated=draft.ai_generated,
            version=draft.version,
            parent_id=draft.id,
            word_count=draft.word_count
        )
        db.add(new_draft)

    # 3. Hearings (Past Judgments)
    for hearing in parent.hearings:
        if hearing.order_passed:
            new_hearing = Hearing(
                case_id=appeal.id,
                hearing_date=hearing.hearing_date,
                hearing_time=hearing.hearing_time,
                court=hearing.court,
                courtroom=hearing.courtroom,
                judge=hearing.judge,
                purpose="Lower Court Record",
                status="completed",
                order_passed=hearing.order_passed,
                notes=f"Inherited from Lower Court ({parent.case_no})",
            )
            db.add(new_hearing)

    db.commit()

    return {
        "id": str(appeal.id),
        "case_no": appeal.case_no,
        "title": appeal.title,
        "appeal_level": appeal.appeal_level,
        "appeal_type": appeal.appeal_type,
        "parent_case_id": str(appeal.parent_case_id),
        "message": "Appeal case created and linked to parent",
    }


@router.get("/{case_id}/family")
async def get_family(
    case_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the full litigation family tree for a case."""
    # Walk up to find the root
    def get_root(cid: str, visited=None):
        if visited is None:
            visited = set()
        if cid in visited:
            return cid
        visited.add(cid)
        c = db.query(Case).filter(Case.id == cid).first()
        if c and c.parent_case_id:
            return get_root(str(c.parent_case_id), visited)
        return cid

    root_id = get_root(case_id)

    # Build tree recursively
    def build_node(cid: str, depth=0) -> dict:
        c = db.query(Case).filter(Case.id == cid).first()
        if not c:
            return {}
        children = db.query(Case).filter(Case.parent_case_id == cid).all()
        return {
            **serialize_case_brief(c),
            "depth": depth,
            "is_current": str(c.id) == case_id,
            "children": [build_node(str(ch.id), depth + 1) for ch in children],
        }

    tree = build_node(root_id)
    return {"root_id": root_id, "tree": tree}



