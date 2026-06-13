from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from datetime import datetime, timedelta, date

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.permissions import require_firm_member, apply_firm_filter
from app.models.user import User
from app.models.case import Case, CaseStatus
from app.models.hearing import Hearing
from app.models.invoice import Invoice
from app.models.draft import Draft
from app.models.document import Document, DocumentType
from app.models.case_advocate import CaseTask, TaskStatus
from app.models.filing import Filing
from app.models.case_advocate import CaseAdvocate
from app.models.client import Client

router = APIRouter()

@router.get("/metrics")
async def get_dashboard_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    today = date.today()
    thirty_days_from_now = today + timedelta(days=30)

    # ── Tenant isolation: all queries scoped to firm ──────────────────────────
    firm_case_ids = [
        c.id for c in apply_firm_filter(db.query(Case), Case, current_user).all()
    ]
    firm_client_ids = [
        c.id for c in apply_firm_filter(db.query(Client), Client, current_user).all()
    ]

    # 1. Today's Critical Matters
    today_hearings_count = db.query(Hearing).filter(
        Hearing.case_id.in_(firm_case_ids),
        Hearing.hearing_date == today
    ).count()

    urgent_filings_count = db.query(Filing).filter(
        Filing.case_id.in_(firm_case_ids),
        Filing.status == "defect_raised"
    ).count()

    pending_notices_count = db.query(Document).filter(
        Document.case_id.in_(firm_case_ids),
        Document.doc_type == DocumentType.NOTICE,
        Document.evidence_status == "uploaded"
    ).count()

    limitation_alerts_count = db.query(Case).filter(
        Case.id.in_(firm_case_ids),
        Case.limitation_date >= today,
        Case.limitation_date <= thirty_days_from_now
    ).count()

    pending_affidavits_count = db.query(Draft).filter(
        Draft.firm_id == current_user.firm_id,
        Draft.category.ilike('%affidavit%'),
        Draft.title.ilike('%pending%')
    ).count()

    critical_matters = {
        "today_hearings": today_hearings_count,
        "urgent_filings": urgent_filings_count,
        "pending_notices": pending_notices_count,
        "limitation_alerts": limitation_alerts_count,
        "pending_affidavits": pending_affidavits_count
    }

    # 2. Limitation & Deadline Alerts
    limitation_cases = db.query(Case).filter(
        Case.id.in_(firm_case_ids),
        Case.limitation_date >= today,
        Case.limitation_date <= thirty_days_from_now
    ).order_by(Case.limitation_date.asc()).limit(5).all()

    limitation_alerts = [
        {
            "id": str(c.id),
            "case_no": c.case_no,
            "title": c.title,
            "limitation_date": c.limitation_date.isoformat(),
            "days_left": (c.limitation_date - today).days
        } for c in limitation_cases
    ]

    # 3. Notice Management Summary
    notices_received = db.query(Document).filter(
        Document.case_id.in_(firm_case_ids),
        Document.doc_type == DocumentType.NOTICE
    ).count()
    replies_sent = db.query(Document).filter(
        Document.case_id.in_(firm_case_ids),
        Document.doc_type == DocumentType.REPLY
    ).count()
    notice_summary = {
        "received": notices_received,
        "pending_replies": max(0, notices_received - replies_sent),
        "overdue_replies": 0,
        "replies_sent": replies_sent
    }

    # 4. Matter Status Dashboard
    active = db.query(Case).filter(Case.id.in_(firm_case_ids), Case.status == CaseStatus.ACTIVE).count()
    drafting = db.query(Case).filter(Case.id.in_(firm_case_ids), Case.stage == "drafting").count()
    evidence = db.query(Case).filter(Case.id.in_(firm_case_ids), Case.stage == "evidence").count()
    argument = db.query(Case).filter(Case.id.in_(firm_case_ids), Case.stage == "argument").count()
    appeal = db.query(Case).filter(Case.id.in_(firm_case_ids), Case.stage == "appeal").count()
    closed = db.query(Case).filter(Case.id.in_(firm_case_ids), Case.status == CaseStatus.CLOSED).count()

    matter_status = {
        "active": active,
        "drafting": drafting,
        "evidence": evidence,
        "argument": argument,
        "appeal": appeal,
        "closed": closed
    }

    # 5. Upcoming Hearings Widget
    upcoming_hearings_q = db.query(Hearing).join(Case).filter(
        Hearing.case_id.in_(firm_case_ids),
        Hearing.hearing_date >= today
    ).order_by(Hearing.hearing_date.asc(), Hearing.hearing_time.asc()).limit(5).all()

    upcoming_hearings = [
        {
            "id": str(h.id),
            "case_id": str(h.case.id),
            "case_title": h.case.title,
            "court": h.court,
            "hearing_date": h.hearing_date.isoformat(),
            "hearing_time": str(h.hearing_time) if h.hearing_time else None,
            "assigned_advocate": current_user.full_name
        } for h in upcoming_hearings_q
    ]

    # 6. Legal Billing Dashboard — scoped to firm's clients
    outstanding = db.query(func.sum(Invoice.balance_due)).filter(
        Invoice.client_id.in_(firm_client_ids)
    ).scalar() or 0
    billing = {
        "outstanding": float(outstanding),
        "pending_hearing_fees": 0,
        "pending_filing_fees": 0,
        "advance_balance": 0.0
    }

    # 7. Team Work Dashboard — scoped to firm's cases
    drafting_tasks = db.query(CaseTask).filter(
        CaseTask.case_id.in_(firm_case_ids), CaseTask.task_type == "drafting"
    ).count()
    research_tasks = db.query(CaseTask).filter(
        CaseTask.case_id.in_(firm_case_ids), CaseTask.task_type == "research"
    ).count()
    filing_tasks = db.query(CaseTask).filter(
        CaseTask.case_id.in_(firm_case_ids), CaseTask.task_type == "filing"
    ).count()
    hearing_tasks = db.query(CaseTask).filter(
        CaseTask.case_id.in_(firm_case_ids), CaseTask.task_type == "hearing"
    ).count()

    team_work = {
        "drafting": drafting_tasks,
        "research": research_tasks,
        "filing": filing_tasks,
        "hearing": hearing_tasks
    }

    # 8. Recent Activity Feed — firm-scoped
    recent_cases = db.query(Case).filter(
        Case.id.in_(firm_case_ids)
    ).order_by(Case.created_at.desc()).limit(2).all()

    recent_docs = db.query(Document).filter(
        or_(
            Document.case_id.in_(firm_case_ids),
            Document.client_id.in_(firm_client_ids),
        )
    ).order_by(Document.created_at.desc()).limit(3).all()

    activity_feed = []
    for c in recent_cases:
        activity_feed.append({
            "type": "case_created",
            "title": f"New Matter: {c.title}",
            "date": c.created_at.isoformat() if c.created_at else None,
            "id": str(c.id)
        })
    for d in recent_docs:
        activity_feed.append({
            "type": "document_uploaded",
            "title": f"Uploaded: {d.name}",
            "date": d.created_at.isoformat() if d.created_at else None,
            "id": str(d.id)
        })

    activity_feed.sort(key=lambda x: x["date"] or "", reverse=True)

    return {
        "critical_matters": critical_matters,
        "limitation_alerts": limitation_alerts,
        "notice_summary": notice_summary,
        "matter_status": matter_status,
        "upcoming_hearings": upcoming_hearings,
        "billing": billing,
        "team_work": team_work,
        "recent_activity": activity_feed[:10]
    }
