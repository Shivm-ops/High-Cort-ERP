from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from typing import Optional
from pydantic import BaseModel
from datetime import date, datetime, timedelta
import uuid

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.permissions import (
    require_firm_member, require_roles, check_object_firm, apply_firm_filter,
    get_user_firm_id, ROLES_ADMIN, ROLES_ADVOCATES
)
from app.models.case import Case, CaseStatus, CaseStage, CasePriority
from app.models.case_advocate import CaseAdvocate, CaseTask
from app.models.order import CourtOrder
from app.models.client import Client
from app.models.user import User, UserRole
from app.services.audit_service import log_action, extract_ip, AuditAction
from app.services.ecourts import ECourtsSyncService

router = APIRouter()


def serialize_case(c: Case, include_relations: bool = False) -> dict:
    data = {
        "id": str(c.id),
        "case_no": c.case_no,
        "title": c.title,
        "description": c.description,
        "court": c.court,
        "bench": c.bench,
        "judge": c.judge,
        "court_complex": c.court_complex,
        "court_state": c.court_state,
        "client_id": str(c.client_id),
        "client_name": c.client.name if c.client else None,
        "client_phone": c.client.phone if c.client else None,
        "petitioner": c.petitioner,
        "respondent": c.respondent,
        "opposing_counsel": c.opposing_counsel,
        "practice_area": c.practice_area,
        "case_type": c.case_type,
        "acts_involved": c.acts_involved or [],
        "sections_involved": c.sections_involved or [],
        "case_laws": c.case_laws or [],
        "arguments": c.arguments or [],
        "tags": c.tags or [],
        "status": c.status,
        "stage": c.stage,
        "priority": c.priority,
        "filing_date": c.filing_date.isoformat() if c.filing_date else None,
        "disposal_date": c.disposal_date.isoformat() if c.disposal_date else None,
        "limitation_date": c.limitation_date.isoformat() if c.limitation_date else None,
        "limitation_act": c.limitation_act,
        "limitation_section": c.limitation_section,
        "incident_date": c.incident_date.isoformat() if c.incident_date else None,
        "next_hearing_date": c.next_hearing_date.isoformat() if c.next_hearing_date else None,
        "fees_agreed": c.fees_agreed,
        "fees_received": c.fees_received,
        "parent_case_id": str(c.parent_case_id) if c.parent_case_id else None,
        "appeal_type": c.appeal_type,
        "appeal_level": c.appeal_level or 0,
        "forum": c.forum,
        "firm_id": str(c.firm_id) if c.firm_id else None,
        "ecourts_cnr": c.ecourts_cnr,
        "last_sync_date": c.last_sync_date.isoformat() if c.last_sync_date else None,
        "created_at": c.created_at.isoformat() if c.created_at else None,
        "updated_at": c.updated_at.isoformat() if c.updated_at else None,
    }
    if include_relations:
        data["hearings"] = [
            {
                "id": str(h.id),
                "hearing_date": h.hearing_date.isoformat(),
                "hearing_time": str(h.hearing_time) if h.hearing_time else None,
                "court": h.court,
                "courtroom": h.courtroom,
                "judge": h.judge,
                "purpose": h.purpose,
                "status": h.status,
                "notes": h.notes,
                "next_date": h.next_date.isoformat() if h.next_date else None,
                "order_passed": h.order_passed,
                "attended_by": h.attended_by,
            }
            for h in sorted(c.hearings, key=lambda h: h.hearing_date, reverse=True)
        ]
        data["documents"] = [
            {
                "id": str(d.id),
                "name": d.name,
                "doc_type": d.doc_type,
                "file_size": d.file_size,
                "mime_type": d.mime_type,
                "created_at": d.created_at.isoformat() if d.created_at else None,
            }
            for d in c.documents
        ]
        data["drafts"] = [
            {
                "id": str(d.id),
                "title": d.title,
                "category": d.category,
                "language": d.language,
                "ai_generated": d.ai_generated,
                "created_at": d.created_at.isoformat() if d.created_at else None,
            }
            for d in c.drafts
        ]
        data["invoices"] = [
            {
                "id": str(i.id),
                "invoice_no": i.invoice_no,
                "total": i.total,
                "amount_paid": i.amount_paid,
                "balance_due": i.balance_due,
                "status": i.status,
                "due_date": i.due_date.isoformat() if i.due_date else None,
            }
            for i in c.invoices
        ]
        data["filings"] = [
            {
                "id": str(f.id),
                "title": f.title,
                "filing_type": f.filing_type,
                "status": f.status,
                "filing_date": f.filing_date.isoformat() if f.filing_date else None,
                "court_fee": f.court_fee or 0,
                "stamp_duty": f.stamp_duty or 0,
                "estamp_reference": f.estamp_reference,
                "checklist": f.checklist or [],
            }
            for f in (c.filings or [])
        ]
        data["notes"] = [
            {
                "id": str(n.id),
                "content": n.content,
                "note_type": n.note_type,
                "is_pinned": n.is_pinned,
                "created_at": n.created_at.isoformat() if n.created_at else None,
            }
            for n in (c.notes or [])
        ]
        data["parties"] = [
            {
                "id": str(p.id),
                "name": p.name,
                "party_type": p.party_type,
                "advocate_name": p.advocate_name,
                "mobile": p.mobile,
                "email": p.email,
                "address": p.address,
            }
            for p in getattr(c, "parties", [])
        ]
        data["orders"] = [
            {
                "id": str(o.id),
                "hearing_id": str(o.hearing_id) if o.hearing_id else None,
                "order_type": o.order_type,
                "order_date": o.order_date.isoformat() if o.order_date else None,
                "summary": o.summary,
                "compliance_required": o.compliance_required,
                "compliance_due_date": o.compliance_due_date.isoformat() if o.compliance_due_date else None,
                "compliance_status": o.compliance_status,
                "next_action": o.next_action,
            }
            for o in getattr(c, "orders", [])
        ]
    return data


class CaseCreate(BaseModel):
    case_no: str
    title: str
    court: str
    client_id: uuid.UUID
    practice_area: str
    status: str = "active"
    stage: str = "filing"
    priority: str = "medium"
    filing_date: Optional[date] = None
    incident_date: Optional[date] = None
    limitation_date: Optional[date] = None
    judge: Optional[str] = None
    bench: Optional[str] = None
    court_complex: Optional[str] = None
    court_state: Optional[str] = None
    case_type: Optional[str] = None
    petitioner: Optional[str] = None
    respondent: Optional[str] = None
    opposing_counsel: Optional[str] = None
    description: Optional[str] = None
    fees_agreed: float = 0.0
    ecourts_cnr: Optional[str] = None
    acts_involved: list = []
    sections_involved: list = []
    case_laws: list = []
    arguments: list = []
    tags: list = []


class CaseUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None
    stage: Optional[str] = None
    priority: Optional[str] = None
    judge: Optional[str] = None
    bench: Optional[str] = None
    court: Optional[str] = None
    next_hearing_date: Optional[date] = None
    incident_date: Optional[date] = None
    limitation_date: Optional[date] = None
    limitation_act: Optional[str] = None
    limitation_section: Optional[str] = None
    disposal_date: Optional[date] = None
    description: Optional[str] = None
    fees_agreed: Optional[float] = None
    fees_received: Optional[float] = None
    opposing_counsel: Optional[str] = None
    ecourts_cnr: Optional[str] = None
    acts_involved: Optional[list] = None
    sections_involved: Optional[list] = None
    case_laws: Optional[list] = None
    arguments: Optional[list] = None
    tags: Optional[list] = None


@router.get("/stats/summary")
async def case_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    # ── Tenant isolation ──────────────────────────────────────────────────────
    base_q = apply_firm_filter(db.query(Case), Case, current_user).filter(Case.is_deleted == False)
    total = base_q.count()
    active = base_q.filter(Case.status == CaseStatus.ACTIVE).count()
    urgent = base_q.filter(Case.status == CaseStatus.URGENT).count()
    pending = base_q.filter(Case.status == CaseStatus.PENDING).count()
    from datetime import date as dt
    from sqlalchemy import and_
    upcoming_hearings = base_q.filter(
        and_(Case.next_hearing_date >= dt.today(), Case.status == CaseStatus.ACTIVE)
    ).count()
    return {
        "total": total,
        "active": active,
        "urgent": urgent,
        "pending": pending,
        "upcoming_hearings": upcoming_hearings,
    }


@router.get("/")
async def list_cases(
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = None,
    stage: Optional[str] = None,
    practice_area: Optional[str] = None,
    search: Optional[str] = None,
    client_id: Optional[uuid.UUID] = None,
    court: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    # ── Tenant isolation ──────────────────────────────────────────────────────
    query = apply_firm_filter(
        db.query(Case).join(Client, Case.client_id == Client.id, isouter=True),
        Case,
        current_user,
    ).filter(Case.is_deleted == False)
    if status:
        query = query.filter(Case.status == status)
    if stage:
        query = query.filter(Case.stage == stage)
    if practice_area:
        query = query.filter(Case.practice_area == practice_area)
    if client_id:
        query = query.filter(Case.client_id == client_id)
    if court:
        query = query.filter(Case.court == court)
    if search:
        query = query.filter(
            or_(
                Case.title.ilike(f"%{search}%"),
                Case.case_no.ilike(f"%{search}%"),
                Client.name.ilike(f"%{search}%"),
            )
        )
    total = query.count()
    cases = query.options(joinedload(Case.client)).order_by(Case.created_at.desc()).offset(skip).limit(limit).all()
    return {"total": total, "cases": [serialize_case(c) for c in cases]}


def auto_calculate_limitation(data: CaseCreate) -> tuple:
    if data.limitation_date:
        return data.limitation_date, None, None
    start_date = data.incident_date or date.today()
    case_type = (data.case_type or "").lower()
    practice_area = (data.practice_area or "").lower()
    if "consumer" in practice_area:
        return start_date + timedelta(days=730), "Consumer Protection Act", "Section 69"
    elif "mact" in practice_area or "accident" in practice_area:
        return start_date + timedelta(days=180), "Motor Vehicles Act", "Section 166(3)"
    elif "ni act" in practice_area or "138" in case_type:
        return start_date + timedelta(days=30), "Negotiable Instruments Act", "Section 138"
    elif "appeal" in case_type and "criminal" in practice_area:
        return start_date + timedelta(days=60), "Limitation Act", "Article 115"
    elif "appeal" in case_type and "civil" in practice_area:
        return start_date + timedelta(days=90), "Limitation Act", "Article 116"
    elif "writ" in case_type:
        return start_date + timedelta(days=90), "Constitution of India", "Article 226"
    elif "sarfaesi" in practice_area:
        return start_date + timedelta(days=45), "SARFAESI Act", "Section 17"
    elif "family" in practice_area:
        return start_date + timedelta(days=90), "Family Courts Act", "Section 19"
    return None, None, None


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_case(
    data: CaseCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    # ── Validate client belongs to same firm ──────────────────────────────────
    client = (
        apply_firm_filter(db.query(Client), Client, current_user)
        .filter(Client.id == data.client_id)
        .first()
    )
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    lim_date, lim_act, lim_sec = auto_calculate_limitation(data)
    case_data = data.model_dump()
    if not data.limitation_date and lim_date:
        case_data["limitation_date"] = lim_date
        case_data["limitation_act"] = lim_act
        case_data["limitation_section"] = lim_sec

    case = Case(
        **case_data,
        primary_advocate_id=current_user.id,
        firm_id=get_user_firm_id(current_user),
        created_by_id=current_user.id,
        updated_by_id=current_user.id,
    )
    db.add(case)
    db.flush()
    log_action(db, AuditAction.CASE_CREATE, "CASE", str(case.id),
               user=current_user, ip=extract_ip(request),
               details={"case_no": case.case_no, "title": case.title})
    db.commit()
    db.refresh(case)
    return serialize_case(case)


@router.get("/{case_id}")
async def get_case(
    case_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    case = (
        db.query(Case)
        .options(
            joinedload(Case.client),
            joinedload(Case.hearings),
            joinedload(Case.documents),
            joinedload(Case.drafts),
            joinedload(Case.invoices),
            joinedload(Case.filings),
            joinedload(Case.notes),
            joinedload(Case.parties),
            joinedload(Case.orders)
        )
        .filter(Case.id == case_id)
        .filter(Case.is_deleted == False)
        .first()
    )
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    # ── Object-level security ─────────────────────────────────────────────────
    check_object_firm(case, current_user)
    return serialize_case(case, include_relations=True)


@router.put("/{case_id}")
async def update_case(
    case_id: uuid.UUID,
    data: CaseUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    case = db.query(Case).filter(Case.id == case_id, Case.is_deleted == False).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    check_object_firm(case, current_user)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(case, field, value)
    case.updated_at = datetime.utcnow()
    case.updated_by_id = current_user.id
    log_action(db, AuditAction.CASE_UPDATE, "CASE", str(case_id),
               user=current_user, ip=extract_ip(request),
               details=data.model_dump(exclude_unset=True))
    db.commit()
    db.refresh(case)
    return serialize_case(case)


@router.delete("/{case_id}")
async def delete_case(
    case_id: uuid.UUID,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*ROLES_ADVOCATES)),
):
    case = db.query(Case).filter(Case.id == case_id, Case.is_deleted == False).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    check_object_firm(case, current_user)
    case.is_deleted = True
    case.updated_at = datetime.utcnow()
    case.updated_by_id = current_user.id
    log_action(db, AuditAction.CASE_CLOSE, "CASE", str(case_id),
               user=current_user, ip=extract_ip(request),
               details={"case_no": case.case_no, "title": case.title})
    db.commit()
    return {"message": "Case closed successfully"}


@router.post("/{case_id}/ecourts-sync")
async def sync_with_ecourts(
    case_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    case = db.query(Case).filter(Case.id == case_id, Case.is_deleted == False).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    check_object_firm(case, current_user)
    
    if not case.ecourts_cnr:
        raise HTTPException(status_code=400, detail="Cannot sync: No CNR number provided for this case.")

    # Call mock e-Courts service
    sync_data = await ECourtsSyncService.sync_case(case.ecourts_cnr)
    
    # Update case with fetched data
    case.status = sync_data["status"]
    if sync_data["next_hearing_date"]:
        case.next_hearing_date = datetime.fromisoformat(sync_data["next_hearing_date"]).date()
    case.last_sync_date = datetime.utcnow()
    case.updated_at = datetime.utcnow()
    
    db.commit()
    return serialize_case(case)


@router.get("/{case_id}/timeline")
async def get_case_timeline(
    case_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    case = db.query(Case).options(
        joinedload(Case.hearings),
        joinedload(Case.documents),
        joinedload(Case.invoices),
        joinedload(Case.filings),
        joinedload(Case.orders),
        joinedload(Case.case_advocates).joinedload(CaseAdvocate.advocate),
        joinedload(Case.tasks).joinedload(CaseTask.assignee)
    ).filter(Case.id == case_id, Case.is_deleted == False).first()
    
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    check_object_firm(case, current_user)

    events = []
    
    # 1. Case Creation
    if case.created_at:
        events.append({
            "type": "case_created",
            "date": case.created_at.isoformat(),
            "title": "Case Created",
            "detail": f"Matter {case.case_no} was created.",
            "icon": "briefcase",
            "color": "blue"
        })
        
    # 2. Hearings & Order Passed events from hearings
    for h in (case.hearings or []):
        if h.hearing_date:
            h_date = h.hearing_date.isoformat() if hasattr(h.hearing_date, 'isoformat') else str(h.hearing_date)
            events.append({
                "type": "hearing",
                "date": h_date,
                "title": f"Hearing — {h.purpose or 'Scheduled'}",
                "detail": f"{h.court or case.court} · Status: {h.status.capitalize() if hasattr(h.status, 'capitalize') else str(h.status)}" + (f" · Judge: {h.judge}" if h.judge else ""),
                "extra": h.order_passed,
                "icon": "gavel",
                "color": "amber"
            })
            if h.order_passed:
                events.append({
                    "type": "order",
                    "date": h_date,
                    "title": "Order Passed",
                    "detail": h.order_passed,
                    "icon": "stamp",
                    "color": "green"
                })
            
    # 3. Court Orders (manually logged)
    for o in (case.orders or []):
        o_date = o.order_date.isoformat() if hasattr(o.order_date, 'isoformat') else str(o.order_date) if o.order_date else o.created_at.isoformat() if o.created_at else None
        events.append({
            "type": "order",
            "date": o_date,
            "title": f"Court Order — {o.order_type}",
            "detail": o.summary or "",
            "icon": "stamp",
            "color": "green"
        })

    # 4. Documents
    for d in (case.documents or []):
        if not d.is_deleted and d.created_at:
            events.append({
                "type": "document",
                "date": d.created_at.isoformat(),
                "title": "Document Uploaded",
                "detail": f"'{d.name}' was uploaded." + (f" Type: {d.doc_type.value if hasattr(d.doc_type, 'value') else d.doc_type}" if d.doc_type else ""),
                "icon": "file-text",
                "color": "blue"
            })
            
    # 5. Invoices
    for i in (case.invoices or []):
        if i.created_at:
            events.append({
                "type": "invoice",
                "date": i.created_at.isoformat(),
                "title": "Invoice Generated",
                "detail": f"Invoice {i.invoice_no} generated for Rs. {i.total}.",
                "icon": "receipt",
                "color": "purple"
            })
            
    # 6. Filings
    for f in (case.filings or []):
        f_date = f.filing_date.isoformat() if hasattr(f.filing_date, 'isoformat') else str(f.filing_date) if f.filing_date else f.created_at.isoformat() if f.created_at else None
        events.append({
            "type": "filing",
            "date": f_date,
            "title": f"Filing: {f.title}",
            "detail": f"Type: {f.filing_type or ''} · Status: {f.status}",
            "icon": "folder",
            "color": "orange"
        })

    # 7. Advocate Assignments & Changes
    for a in (case.case_advocates or []):
        a_date = a.start_date.isoformat() if hasattr(a.start_date, 'isoformat') else str(a.start_date) if a.start_date else a.created_at.isoformat() if a.created_at else None
        events.append({
            "type": "advocate_assigned" if a.is_active else "advocate_removed",
            "date": a_date,
            "title": "Advocate Assigned",
            "detail": f"{a.advocate.full_name} — {a.role.value if hasattr(a.role, 'value') else a.role}" if a.advocate else (a.role.value if hasattr(a.role, 'value') else str(a.role)),
            "icon": "user",
            "color": "purple"
        })
        if a.end_date:
            a_end = a.end_date.isoformat() if hasattr(a.end_date, 'isoformat') else str(a.end_date)
            events.append({
                "type": "advocate_removed",
                "date": a_end,
                "title": "Advocate Removed / Transferred",
                "detail": f"{a.advocate.full_name if a.advocate else ''} — {a.transfer_reason or 'No reason given'}",
                "icon": "user-minus",
                "color": "red"
            })

    # 8. Tasks
    for t in (case.tasks or []):
        if t.created_at:
            events.append({
                "type": "task_created",
                "date": t.created_at.isoformat(),
                "title": f"Task: {t.title}",
                "detail": f"Type: {t.task_type.value if hasattr(t.task_type, 'value') else t.task_type} · Status: {t.status.value if hasattr(t.status, 'value') else t.status}" + (f" — assigned to {t.assignee.full_name}" if t.assignee else ""),
                "icon": "check-square",
                "color": "indigo"
            })
        if t.completed_at:
            events.append({
                "type": "task_completed",
                "date": t.completed_at.isoformat(),
                "title": f"Task Completed: {t.title}",
                "detail": f"Type: {t.task_type.value if hasattr(t.task_type, 'value') else t.task_type}",
                "icon": "check-circle",
                "color": "green"
            })

    # 9. Appeals (child cases)
    children = db.query(Case).filter(Case.parent_case_id == case_id, Case.is_deleted == False).all()
    for ch in children:
        ch_date = ch.filing_date.isoformat() if hasattr(ch.filing_date, 'isoformat') else str(ch.filing_date) if ch.filing_date else ch.created_at.isoformat() if ch.created_at else None
        events.append({
            "type": "appeal_filed",
            "date": ch_date,
            "title": f"Appeal Filed — {ch.appeal_type or 'appeal'}",
            "detail": f"Case No: {ch.case_no} · {ch.court}",
            "icon": "arrow-up",
            "color": "blue"
        })

    # 10. Lower Court Judgment (from parent case)
    if case.parent_case_id:
        parent_case = db.query(Case).options(joinedload(Case.hearings)).filter(Case.id == case.parent_case_id, Case.is_deleted == False).first()
        if parent_case and parent_case.hearings:
            for h in parent_case.hearings:
                if h.order_passed:
                    h_date = h.hearing_date.isoformat() if hasattr(h.hearing_date, 'isoformat') else str(h.hearing_date) if h.hearing_date else None
                    events.append({
                        "type": "lower_court_order",
                        "date": h_date,
                        "title": f"Lower Court Judgment — {parent_case.court}",
                        "detail": h.order_passed[:200],
                        "icon": "building-library",
                        "color": "stone"
                    })

    # Sort events by date descending (newest first, handling None/empty string safely)
    def get_event_date(e):
        d = e.get("date")
        return d if d else ""

    events.sort(key=get_event_date, reverse=True)
    
    return {"case_id": str(case_id), "total": len(events), "events": events}

