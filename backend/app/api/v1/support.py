"""
app/api/v1/support.py
=====================
Complete Advocate Help Center & Customer Support API:
- Knowledge Base categories, articles, search & vote
- Comprehensive categorized FAQs
- Step-by-step guides
- Support Ticket lifecycle (Create, List, Thread detail, Reply)
- Secure screenshot and PDF file attachments
- Automated notification emails
"""

import os
import re
import uuid
import random
import logging
from datetime import datetime
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status, BackgroundTasks
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.support import (
    SupportTicket,
    TicketMessage,
    HelpCategory,
    HelpArticle,
    FAQ,
    TicketStatus,
    TicketPriority,
    TicketCategory,
)
from app.services.ticket_emails import (
    send_ticket_created_notification,
    send_ticket_reply_notification,
    send_ticket_status_notification,
)

logger = logging.getLogger("support_api")
router = APIRouter()

# Directory for ticket attachments
ATTACHMENTS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "uploads", "support"))
os.makedirs(ATTACHMENTS_DIR, exist_ok=True)


# ─── Pydantic Schemas ─────────────────────────────────────────────────────────

class TicketCreateRequest(BaseModel):
    subject: str = Field(..., min_length=3, max_length=255)
    category: TicketCategory = TicketCategory.GENERAL
    priority: TicketPriority = TicketPriority.MEDIUM
    description: str = Field(..., min_length=10)
    attachment_url: Optional[str] = None


class TicketReplyRequest(BaseModel):
    message: str = Field(..., min_length=2)
    attachment_url: Optional[str] = None


class FAQItemResponse(BaseModel):
    id: str
    category: str
    question: str
    answer: str
    order: int


class ArticleSummaryResponse(BaseModel):
    id: str
    category_id: str
    category_name: Optional[str] = None
    title: str
    slug: str
    summary: Optional[str]
    tags: Optional[str]
    views_count: int
    helpful_count: int


class ArticleDetailResponse(ArticleSummaryResponse):
    content: str
    created_at: datetime
    updated_at: datetime


class HelpCategoryResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str]
    icon: Optional[str]
    order: int
    article_count: int


def _generate_ticket_number() -> str:
    """Generate human-readable unique reference like FC-84920."""
    num = random.randint(10000, 99999)
    return f"FC-{num}"


# ─── Knowledge Base & FAQ Endpoints ───────────────────────────────────────────

@router.get("/categories", response_model=List[HelpCategoryResponse])
def get_help_categories(db: Session = Depends(get_db)):
    """List all Knowledge Base categories with published article counts."""
    categories = db.query(HelpCategory).order_by(HelpCategory.order.asc()).all()
    res = []
    for c in categories:
        cnt = db.query(HelpArticle).filter(HelpArticle.category_id == c.id, HelpArticle.is_published.is_(True)).count()
        res.append(
            HelpCategoryResponse(
                id=str(c.id),
                name=c.name,
                slug=c.slug,
                description=c.description,
                icon=c.icon or "HelpCircle",
                order=c.order,
                article_count=cnt,
            )
        )
    return res


@router.get("/articles", response_model=List[ArticleSummaryResponse])
def list_help_articles(
    category: Optional[str] = Query(None, description="Category slug or ID"),
    q: Optional[str] = Query(None, description="Search term across title, tags, content"),
    db: Session = Depends(get_db),
):
    """Search or filter published help articles and guides."""
    query = db.query(HelpArticle).filter(HelpArticle.is_published.is_(True))

    if category:
        # Check if category slug or UUID
        cat = db.query(HelpCategory).filter(
            or_(HelpCategory.slug == category, HelpCategory.id.cast(db.bind.dialect.name == "postgresql" and "VARCHAR" or "TEXT") == category)
        ).first()
        if cat:
            query = query.filter(HelpArticle.category_id == cat.id)

    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.filter(
            or_(
                HelpArticle.title.ilike(term),
                HelpArticle.summary.ilike(term),
                HelpArticle.tags.ilike(term),
                HelpArticle.content.ilike(term),
            )
        )

    articles = query.order_by(HelpArticle.order.asc(), HelpArticle.views_count.desc()).all()
    
    out = []
    for a in articles:
        out.append(
            ArticleSummaryResponse(
                id=str(a.id),
                category_id=str(a.category_id),
                category_name=a.category.name if a.category else None,
                title=a.title,
                slug=a.slug,
                summary=a.summary,
                tags=a.tags,
                views_count=a.views_count or 0,
                helpful_count=a.helpful_count or 0,
            )
        )
    return out


@router.get("/articles/{slug}", response_model=ArticleDetailResponse)
def get_help_article_by_slug(slug: str, db: Session = Depends(get_db)):
    """Fetch full article content and increment view counter."""
    article = db.query(HelpArticle).filter(HelpArticle.slug == slug, HelpArticle.is_published.is_(True)).first()
    if not article:
        raise HTTPException(status_code=404, detail="Help article not found")

    article.views_count = (article.views_count or 0) + 1
    db.commit()

    return ArticleDetailResponse(
        id=str(article.id),
        category_id=str(article.category_id),
        category_name=article.category.name if article.category else None,
        title=article.title,
        slug=article.slug,
        summary=article.summary,
        tags=article.tags,
        content=article.content,
        views_count=article.views_count,
        helpful_count=article.helpful_count or 0,
        created_at=article.created_at,
        updated_at=article.updated_at,
    )


@router.post("/articles/{slug}/vote")
def vote_help_article(slug: str, helpful: bool = True, db: Session = Depends(get_db)):
    """Submit helpful feedback vote for an article."""
    article = db.query(HelpArticle).filter(HelpArticle.slug == slug).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    if helpful:
        article.helpful_count = (article.helpful_count or 0) + 1
        db.commit()
    return {"message": "Thank you for your feedback!", "helpful_count": article.helpful_count}


@router.get("/faqs")
def list_faqs(
    category: Optional[str] = Query(None, description="FAQ category slug"),
    q: Optional[str] = Query(None, description="Search query"),
    db: Session = Depends(get_db),
):
    """Retrieve categorized FAQs covering account setup, clients, cases, documents, and billing."""
    query = db.query(FAQ).filter(FAQ.is_published.is_(True))
    if category:
        query = query.filter(FAQ.category == category)
    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.filter(or_(FAQ.question.ilike(term), FAQ.answer.ilike(term)))

    faqs = query.order_by(FAQ.order.asc(), FAQ.created_at.asc()).all()

    # Group by category for easy consumption
    grouped = {}
    for f in faqs:
        cat_key = f.category
        if cat_key not in grouped:
            grouped[cat_key] = []
        grouped[cat_key].append({
            "id": str(f.id),
            "category": f.category,
            "question": f.question,
            "answer": f.answer,
            "order": f.order,
        })
    return {"faqs": [
        {"id": str(f.id), "category": f.category, "question": f.question, "answer": f.answer, "order": f.order}
        for f in faqs
    ], "grouped": grouped}


# ─── Ticket Management Endpoints ──────────────────────────────────────────────

@router.post("/tickets", status_code=status.HTTP_201_CREATED)
def create_support_ticket(
    payload: TicketCreateRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Raise a new Support Ticket with category, priority, description, and optional attachment.
    Auto-generates reference number (FC-XXXXX) and dispatches confirmation emails.
    """
    ticket_num = _generate_ticket_number()
    # Ensure ticket number uniqueness
    while db.query(SupportTicket).filter(SupportTicket.ticket_number == ticket_num).first():
        ticket_num = _generate_ticket_number()

    ticket = SupportTicket(
        ticket_number=ticket_num,
        user_id=current_user.id,
        firm_id=current_user.firm_id,
        subject=payload.subject.strip(),
        category=payload.category,
        priority=payload.priority,
        status=TicketStatus.OPEN,
        attachment_url=payload.attachment_url,
    )
    db.add(ticket)
    db.flush()

    # Add initial description as first message in thread
    initial_msg = TicketMessage(
        ticket_id=ticket.id,
        sender_id=current_user.id,
        message=payload.description.strip(),
        attachment_url=payload.attachment_url,
        is_internal=False,
    )
    db.add(initial_msg)
    db.commit()
    db.refresh(ticket)

    # Dispatch email in background
    user_name = current_user.full_name or "Valued Advocate"
    user_email = current_user.email
    cat_val = ticket.category.value if hasattr(ticket.category, "value") else str(ticket.category)
    prio_val = ticket.priority.value if hasattr(ticket.priority, "value") else str(ticket.priority)

    background_tasks.add_task(
        send_ticket_created_notification,
        user_email=user_email,
        user_name=user_name,
        ticket_number=ticket_num,
        subject=ticket.subject,
        category=cat_val,
        priority=prio_val,
        description=payload.description.strip(),
    )

    return {
        "id": str(ticket.id),
        "ticket_number": ticket.ticket_number,
        "subject": ticket.subject,
        "category": cat_val,
        "priority": prio_val,
        "status": ticket.status.value if hasattr(ticket.status, "value") else str(ticket.status),
        "created_at": ticket.created_at,
        "message": f"Support Ticket {ticket.ticket_number} created successfully. An acknowledgment email has been dispatched.",
    }


@router.get("/tickets")
def list_user_tickets(
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List tickets raised by the current advocate with unread status & message counts."""
    query = db.query(SupportTicket).filter(SupportTicket.user_id == current_user.id)
    if status_filter and status_filter != "all":
        query = query.filter(SupportTicket.status == status_filter)

    tickets = query.order_by(SupportTicket.updated_at.desc()).all()

    result = []
    for t in tickets:
        msg_count = len(t.messages)
        last_msg = t.messages[-1] if t.messages else None
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
            "message_count": msg_count,
            "last_message": {
                "message": (last_msg.message[:100] + "...") if last_msg and len(last_msg.message) > 100 else (last_msg.message if last_msg else None),
                "created_at": last_msg.created_at if last_msg else None,
                "is_support": last_msg.sender.is_superadmin if (last_msg and last_msg.sender) else False,
            } if last_msg else None,
        })
    return result


@router.get("/tickets/{ticket_id}")
def get_ticket_details(
    ticket_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get full communication thread and messages for a specific support ticket."""
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Support ticket not found")

    # Authorization check: user must own ticket or be superadmin
    if ticket.user_id != current_user.id and not current_user.is_superadmin:
        raise HTTPException(status_code=403, detail="You do not have permission to view this ticket")

    messages = []
    for m in ticket.messages:
        # Hide internal staff notes from advocates
        if m.is_internal and not current_user.is_superadmin:
            continue
        messages.append({
            "id": str(m.id),
            "sender_id": str(m.sender_id),
            "sender_name": m.sender.full_name if m.sender else "Support Team",
            "is_support": m.sender.is_superadmin if m.sender else False,
            "message": m.message,
            "attachment_url": m.attachment_url,
            "created_at": m.created_at,
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
        "user_name": ticket.user.full_name if ticket.user else "Advocate",
        "user_email": ticket.user.email if ticket.user else "",
        "messages": messages,
    }


@router.post("/tickets/{ticket_id}/reply")
def reply_to_ticket(
    ticket_id: str,
    payload: TicketReplyRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Post a reply message to an existing support ticket thread."""
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Support ticket not found")

    if ticket.user_id != current_user.id and not current_user.is_superadmin:
        raise HTTPException(status_code=403, detail="Access denied")

    msg = TicketMessage(
        ticket_id=ticket.id,
        sender_id=current_user.id,
        message=payload.message.strip(),
        attachment_url=payload.attachment_url,
        is_internal=False,
    )
    db.add(msg)

    # Re-open or adjust status if resolved or waiting
    if ticket.status in (TicketStatus.RESOLVED, TicketStatus.WAITING_FOR_USER):
        ticket.status = TicketStatus.IN_PROGRESS

    ticket.updated_at = datetime.utcnow()
    db.commit()

    # Send notification email
    is_admin = current_user.is_superadmin
    recipient_email = ticket.user.email if is_admin else "support@fastcase.in"
    recipient_name = ticket.user.full_name if is_admin else "Support Operations"
    sender_name = current_user.full_name or ("Fastcase Support" if is_admin else "Advocate")

    background_tasks.add_task(
        send_ticket_reply_notification,
        to_email=recipient_email,
        recipient_name=recipient_name or "User",
        ticket_number=ticket.ticket_number or str(ticket.id)[:8],
        subject=ticket.subject,
        reply_message=payload.message.strip(),
        sender_name=sender_name,
        is_admin_reply=is_admin,
    )

    return {"message": "Reply posted successfully", "ticket_id": str(ticket.id), "status": ticket.status.value}


# ─── File Upload & Attachment Serving ─────────────────────────────────────────

ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".pdf"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB limit


@router.post("/upload")
async def upload_support_attachment(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Upload a screenshot (PNG/JPEG) or PDF file for a support ticket."""
    ext = os.path.splitext(file.filename)[1].lower() if file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: PNG, JPG, JPEG, WEBP, PDF.",
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds maximum limit of 10 MB.")

    safe_stem = re.sub(r"[^a-zA-Z0-9_\-]", "_", os.path.splitext(file.filename or "attachment")[0])[:30]
    filename = f"{uuid.uuid4().hex[:12]}_{safe_stem}{ext}"
    dest_path = os.path.join(ATTACHMENTS_DIR, filename)

    with open(dest_path, "wb") as f:
        f.write(content)

    url = f"/api/v1/support/attachment/{filename}"
    return {
        "url": url,
        "filename": file.filename,
        "size_bytes": len(content),
        "content_type": file.content_type,
    }


@router.get("/attachment/{file_name}")
def get_support_attachment(file_name: str):
    """Stream stored support attachment (PNG/JPG/PDF)."""
    # Sanitize file_name to prevent directory traversal
    clean_name = os.path.basename(file_name)
    file_path = os.path.join(ATTACHMENTS_DIR, clean_name)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Attachment not found")

    ext = os.path.splitext(clean_name)[1].lower()
    media_type = "application/pdf" if ext == ".pdf" else f"image/{ext.replace('.', '')}"
    return FileResponse(file_path, media_type=media_type, filename=clean_name)
