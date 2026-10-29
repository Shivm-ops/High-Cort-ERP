from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from datetime import datetime, timedelta, date

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.permissions import require_firm_member, apply_firm_filter
from app.models.user import User
from app.models.case import Case, CaseStatus, CaseStage
from app.models.hearing import Hearing
from app.models.invoice import Invoice
from app.models.draft import Draft, DraftCategory
from app.models.document import Document, DocumentType, EvidenceStatus
from app.models.case_advocate import CaseTask, TaskStatus, TaskType
from app.models.filing import Filing, FilingStatus
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

    # ── Tenant isolation: scoped to firm ─────────────────────────────────────
    firm_case_ids = [
        row[0] for row in apply_firm_filter(db.query(Case.id), Case, current_user).filter(Case.is_deleted == False).all()
    ]
    firm_client_ids = [
        row[0] for row in apply_firm_filter(db.query(Client.id), Client, current_user).all()
    ]

    # Initialize empty defaults
    critical_matters = {
        "today_hearings": 0,
        "urgent_filings": 0,
        "pending_notices": 0,
        "limitation_alerts": 0,
        "pending_affidavits": 0,
    }
    limitation_alerts = []
    notice_summary = {
        "received": 0,
        "pending_replies": 0,
        "overdue_replies": 0,
        "replies_sent": 0,
    }
    matter_status = {
        "active": 0,
        "drafting": 0,
        "evidence": 0,
        "argument": 0,
        "appeal": 0,
        "closed": 0,
    }
    upcoming_hearings = []
    billing = {
        "outstanding": 0.0,
        "pending_hearing_fees": 0,
        "pending_filing_fees": 0,
        "advance_balance": 0.0,
    }
    team_work = {
        "drafting": 0,
        "research": 0,
        "filing": 0,
        "hearing": 0,
    }
    activity_feed = []

    # If firm has cases, query metrics efficiently
    if firm_case_ids:
        # 1. Today's Critical Matters
        today_hearings_count = db.query(Hearing).filter(
            Hearing.case_id.in_(firm_case_ids),
            Hearing.hearing_date == today
        ).count()

        urgent_filings_count = db.query(Filing).filter(
            Filing.case_id.in_(firm_case_ids),
            Filing.status == FilingStatus.DEFECT_RAISED
        ).count()

        pending_notices_count = db.query(Document).filter(
            Document.case_id.in_(firm_case_ids),
            Document.doc_type == DocumentType.NOTICE,
            Document.evidence_status == EvidenceStatus.UPLOADED
        ).count()

        limitation_alerts_count = db.query(Case).filter(
            Case.id.in_(firm_case_ids),
            Case.limitation_date >= today,
            Case.limitation_date <= thirty_days_from_now
        ).count()

        pending_affidavits_count = db.query(Draft).filter(
            Draft.firm_id == current_user.firm_id,
            Draft.category == DraftCategory.AFFIDAVIT,
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

        # 4. Matter Status Dashboard (consolidated via GROUP BY)
        status_counts = db.query(Case.status, func.count(Case.id)).filter(
            Case.id.in_(firm_case_ids)
        ).group_by(Case.status).all()
        for st, cnt in status_counts:
            if st == CaseStatus.ACTIVE:
                matter_status["active"] = cnt
            elif st == CaseStatus.APPEALED:
                matter_status["appeal"] = cnt
            elif st == CaseStatus.CLOSED:
                matter_status["closed"] = cnt

        stage_counts = db.query(Case.stage, func.count(Case.id)).filter(
            Case.id.in_(firm_case_ids)
        ).group_by(Case.stage).all()
        for sg, cnt in stage_counts:
            if sg == CaseStage.FILING:
                matter_status["drafting"] = cnt
            elif sg == CaseStage.EVIDENCE:
                matter_status["evidence"] = cnt
            elif sg == CaseStage.ARGUMENTS:
                matter_status["argument"] = cnt

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

        # 7. Team Work Dashboard (consolidated via GROUP BY)
        task_counts = db.query(CaseTask.task_type, func.count(CaseTask.id)).filter(
            CaseTask.case_id.in_(firm_case_ids)
        ).group_by(CaseTask.task_type).all()
        for tt, cnt in task_counts:
            if tt == TaskType.DRAFTING:
                team_work["drafting"] = cnt
            elif tt == TaskType.RESEARCH:
                team_work["research"] = cnt
            elif tt == TaskType.FILING:
                team_work["filing"] = cnt
            elif tt == TaskType.HEARING_PREPARATION:
                team_work["hearing"] = cnt

        # 8. Recent Activity Feed
        recent_cases = db.query(Case).filter(
            Case.id.in_(firm_case_ids)
        ).order_by(Case.created_at.desc()).limit(2).all()

        recent_docs = db.query(Document).filter(
            or_(
                Document.case_id.in_(firm_case_ids),
                Document.client_id.in_(firm_client_ids) if firm_client_ids else False,
            )
        ).order_by(Document.created_at.desc()).limit(3).all()

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

    # 6. Legal Billing Dashboard — scoped to firm's clients
    if firm_client_ids:
        outstanding = db.query(func.sum(Invoice.balance_due)).filter(
            Invoice.client_id.in_(firm_client_ids)
        ).scalar() or 0
        billing["outstanding"] = float(outstanding)

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
