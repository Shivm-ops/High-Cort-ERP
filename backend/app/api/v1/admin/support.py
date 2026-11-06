"""
app/api/v1/admin/support.py
===========================
Superadmin Support Desk & Knowledge Base Management:
- Manage, filter, assign, and respond to advocate support tickets
- Internal notes and attachment review
- Auto email dispatch on admin response & status changes
- Knowledge Base articles and FAQ CRUD for platform administrators
"""

import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.core.security import get_current_superadmin
from app.models.support import (
    SupportTicket,
    TicketMessage,
    TicketStatus,
    TicketPriority,
    TicketCategory,
    HelpCategory,
    HelpArticle,
    FAQ,
)
from app.models.user import User
from app.services.ticket_emails import (
    send_ticket_reply_notification,
    send_ticket_status_notification,
)

router = APIRouter()


# ─── Pydantic Schemas ─────────────────────────────────────────────────────────

class AdminReplyPayload(BaseModel):
    message: str = Field(..., min_length=1)
    attachment_url: Optional[str] = None
    is_internal: bool = False  # If true, only visible to superadmins


class StatusPayload(BaseModel):
    status: str


class AssignPayload(BaseModel):
    assigned_to_id: Optional[str] = None


class FAQCreateUpdatePayload(BaseModel):
    category: str
    question: str
    answer: str
    order: int = 0
    is_published: bool = True


class ArticleCreateUpdatePayload(BaseModel):
    category_id: str
    title: str
    slug: str
    summary: Optional[str] = None
    content: str
    tags: Optional[str] = None
    order: int = 0
    is_published: bool = True


# ─── Ticket Management ────────────────────────────────────────────────────────

@router.get("/")
def get_all_tickets(
    status: str = "all",
    category: Optional[str] = None,
    priority: Optional[str] = None,
    q: Optional[str] = None,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_superadmin),
):
    """List all support tickets with filtering by status, category, priority, or user search."""
    query = db.query(SupportTicket)

    if status != "all":
        query = query.filter(SupportTicket.status == status)
    if category and category != "all":
        query = query.filter(SupportTicket.category == category)
    if priority and priority != "all":
        query = query.filter(SupportTicket.priority == priority)

    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.join(SupportTicket.user).filter(
            or_(
                SupportTicket.subject.ilike(term),
                SupportTicket.ticket_number.ilike(term),
                User.full_name.ilike(term),
                User.email.ilike(term),
            )
        )

    tickets = query.order_by(SupportTicket.updated_at.desc()).all()

    result = []
    for t in tickets:
        result.append({
            "id": str(t.id),
            "ticket_number": t.ticket_number or f"FC-{str(t.id)[:6].upper()}",
            "subject": t.subject,
            "category": t.category.value if hasattr(t.category, "value") else str(t.category),
            "priority": t.priority.value if hasattr(t.priority, "value") else str(t.priority),
            "status": t.status.value if hasattr(t.status, "value") else str(t.status),
            "attachment_url": t.attachment_url,
            "created_at": t.created_at,
            "updated_at": t.updated_at,
            "user_name": t.user.full_name if t.user else "Unknown Advocate",
            "user_email": t.user.email if t.user else "",
            "user_phone": t.user.phone if t.user else None,
            "firm_name": t.firm.name if t.firm else "Independent Chambers",
            "assigned_to_name": t.assigned_to.full_name if t.assigned_to else "Unassigned",
            "message_count": len(t.messages),
        })
    return result


@router.get("/{ticket_id}")
def get_ticket_details(
    ticket_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_superadmin),
):
    """Get full communication history including internal staff notes."""
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    messages = []
    for m in ticket.messages:
        messages.append({
            "id": str(m.id),
            "message": m.message,
            "attachment_url": m.attachment_url,
            "is_internal": m.is_internal or False,
            "created_at": m.created_at,
            "sender_name": m.sender.full_name if m.sender else "System Staff",
            "is_admin": m.sender.is_superadmin if m.sender else False,
        })

    return {
        "id": str(ticket.id),
        "ticket_number": ticket.ticket_number or f"FC-{str(ticket.id)[:6].upper()}",
        "subject": ticket.subject,
        "category": ticket.category.value if hasattr(ticket.category, "value") else str(ticket.category),
        "priority": ticket.priority.value if hasattr(ticket.priority, "value") else str(ticket.priority),
        "status": ticket.status.value if hasattr(ticket.status, "value") else str(ticket.status),
        "attachment_url": ticket.attachment_url,
        "created_at": ticket.created_at,
        "updated_at": ticket.updated_at,
        "user_name": ticket.user.full_name if ticket.user else "Unknown Advocate",
        "user_email": ticket.user.email if ticket.user else "",
        "user_phone": ticket.user.phone if ticket.user else None,
        "firm_name": ticket.firm.name if ticket.firm else "Independent Chambers",
        "assigned_to_id": str(ticket.assigned_to_id) if ticket.assigned_to_id else None,
        "assigned_to_name": ticket.assigned_to.full_name if ticket.assigned_to else "Unassigned",
        "messages": messages,
    }


@router.post("/{ticket_id}/reply")
def reply_to_ticket(
    ticket_id: str,
    payload: AdminReplyPayload,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_superadmin),
):
    """Admin reply or internal note. Dispatches notification email to advocate if not internal."""
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    msg = TicketMessage(
        ticket_id=ticket.id,
        sender_id=current_admin.id,
        message=payload.message.strip(),
        attachment_url=payload.attachment_url,
        is_internal=payload.is_internal,
    )
    db.add(msg)

    # If it's a customer-facing reply and status is open or waiting, update to waiting_for_user or in_progress
    if not payload.is_internal:
        if ticket.status == TicketStatus.OPEN:
            ticket.status = TicketStatus.IN_PROGRESS

    ticket.updated_at = datetime.datetime.utcnow()
    db.commit()

    # Trigger email to customer if not an internal note
    if not payload.is_internal and ticket.user and ticket.user.email:
        background_tasks.add_task(
            send_ticket_reply_notification,
            to_email=ticket.user.email,
            recipient_name=ticket.user.full_name or "Advocate",
            ticket_number=ticket.ticket_number or str(ticket.id)[:8],
            subject=ticket.subject,
            reply_message=payload.message.strip(),
            sender_name=current_admin.full_name or "Fastcase Support Team",
            is_admin_reply=True,
        )

    return {"message": "Reply recorded successfully", "is_internal": payload.is_internal}


@router.put("/{ticket_id}/status")
def update_ticket_status(
    ticket_id: str,
    payload: StatusPayload,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_superadmin),
):
    """Update ticket status (open, in_progress, waiting_for_user, resolved, closed). Notifies user on resolution."""
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    old_status = ticket.status.value if hasattr(ticket.status, "value") else str(ticket.status)
    ticket.status = payload.status
    ticket.updated_at = datetime.datetime.utcnow()
    db.commit()

    # If status changed to resolved or in_progress, notify user
    if old_status != payload.status and ticket.user and ticket.user.email:
        background_tasks.add_task(
            send_ticket_status_notification,
            user_email=ticket.user.email,
            user_name=ticket.user.full_name or "Advocate",
            ticket_number=ticket.ticket_number or str(ticket.id)[:8],
            subject=ticket.subject,
            new_status=payload.status,
        )

    return {"message": f"Ticket status updated to {payload.status}"}


@router.put("/{ticket_id}/assign")
def assign_ticket(
    ticket_id: str,
    payload: AssignPayload,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_superadmin),
):
    """Assign ticket to a staff member or unassign."""
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    ticket.assigned_to_id = payload.assigned_to_id
    ticket.updated_at = datetime.datetime.utcnow()
    db.commit()

    assigned_user = db.query(User).filter(User.id == payload.assigned_to_id).first() if payload.assigned_to_id else None
    return {"message": "Ticket assigned successfully", "assigned_to": assigned_user.full_name if assigned_user else "Unassigned"}


# ─── Admin Knowledge Base Management (FAQs & Articles) ─────────────────────────

@router.get("/faqs")
def get_all_faqs(db: Session = Depends(get_db), current_admin: User = Depends(get_current_superadmin)):
    faqs = db.query(FAQ).order_by(FAQ.order.asc()).all()
    return [{
        "id": str(f.id),
        "category": f.category,
        "question": f.question,
        "answer": f.answer,
        "order": f.order,
        "is_published": f.is_published,
    } for f in faqs]


@router.post("/faqs")
def create_faq(payload: FAQCreateUpdatePayload, db: Session = Depends(get_db), current_admin: User = Depends(get_current_superadmin)):
    faq = FAQ(
        category=payload.category,
        question=payload.question,
        answer=payload.answer,
        order=payload.order,
        is_published=payload.is_published,
    )
    db.add(faq)
    db.commit()
    return {"message": "FAQ created successfully", "id": str(faq.id)}


@router.put("/faqs/{faq_id}")
def update_faq(faq_id: str, payload: FAQCreateUpdatePayload, db: Session = Depends(get_db), current_admin: User = Depends(get_current_superadmin)):
    faq = db.query(FAQ).filter(FAQ.id == faq_id).first()
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found")
    faq.category = payload.category
    faq.question = payload.question
    faq.answer = payload.answer
    faq.order = payload.order
    faq.is_published = payload.is_published
    db.commit()
    return {"message": "FAQ updated successfully"}


@router.delete("/faqs/{faq_id}")
def delete_faq(faq_id: str, db: Session = Depends(get_db), current_admin: User = Depends(get_current_superadmin)):
    faq = db.query(FAQ).filter(FAQ.id == faq_id).first()
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found")
    db.delete(faq)
    db.commit()
    return {"message": "FAQ deleted successfully"}
