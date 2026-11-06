"""
app/models/support.py
=====================
Complete Support, Knowledge Base, FAQ, and Ticketing data models.
Supports:
  - Categories: Technical, Payment, Account, Feature Request, General Query
  - Priorities: Low, Medium, High, Critical
  - Statuses: Open, In Progress, Waiting for User, Resolved, Closed
  - Message threads, attachments (screenshots, PDFs), assignments
  - Knowledge Base categories, step-by-step guides, articles, and FAQs
"""

from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Enum, Boolean, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
import enum

from app.core.database import Base


class TicketStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    WAITING_FOR_USER = "waiting_for_user"
    RESOLVED = "resolved"
    CLOSED = "closed"


class TicketPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class TicketCategory(str, enum.Enum):
    TECHNICAL = "technical"
    PAYMENT = "payment"
    ACCOUNT = "account"
    FEATURE_REQUEST = "feature_request"
    GENERAL = "general"


class SupportTicket(Base):
    __tablename__ = "support_tickets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_number = Column(String(50), unique=True, index=True, nullable=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    firm_id = Column(UUID(as_uuid=True), ForeignKey("firms.id"), nullable=True)
    assigned_to_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    subject = Column(String(255), nullable=False)
    category = Column(Enum(TicketCategory), default=TicketCategory.GENERAL, nullable=False)
    priority = Column(Enum(TicketPriority), default=TicketPriority.MEDIUM, nullable=False)
    status = Column(Enum(TicketStatus), default=TicketStatus.OPEN, nullable=False)

    attachment_url = Column(String(500), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    firm = relationship("Firm", foreign_keys=[firm_id])
    assigned_to = relationship("User", foreign_keys=[assigned_to_id])
    messages = relationship(
        "TicketMessage",
        back_populates="ticket",
        cascade="all, delete-orphan",
        order_by="TicketMessage.created_at",
    )


class TicketMessage(Base):
    __tablename__ = "ticket_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_id = Column(UUID(as_uuid=True), ForeignKey("support_tickets.id", ondelete="CASCADE"), nullable=False)
    sender_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    message = Column(Text, nullable=False)
    attachment_url = Column(String(500), nullable=True)
    is_internal = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    ticket = relationship("SupportTicket", back_populates="messages")
    sender = relationship("User", foreign_keys=[sender_id])


# ─── Knowledge Base & FAQ Models ──────────────────────────────────────────────

class HelpCategory(Base):
    __tablename__ = "help_categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(String(255), nullable=True)
    icon = Column(String(50), default="HelpCircle")
    order = Column(Integer, default=0)

    articles = relationship(
        "HelpArticle",
        back_populates="category",
        cascade="all, delete-orphan",
        order_by="HelpArticle.order",
    )


class HelpArticle(Base):
    __tablename__ = "help_articles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category_id = Column(UUID(as_uuid=True), ForeignKey("help_categories.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    summary = Column(Text, nullable=True)
    content = Column(Text, nullable=False)
    tags = Column(String(255), nullable=True) # comma-separated tags e.g. "cases, cause list, hearings"
    views_count = Column(Integer, default=0)
    helpful_count = Column(Integer, default=0)
    order = Column(Integer, default=0)
    is_published = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    category = relationship("HelpCategory", back_populates="articles")


class FAQ(Base):
    __tablename__ = "faqs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category = Column(String(50), nullable=False) # "account_setup", "clients", "cases", "documents", "billing", "general"
    question = Column(String(300), nullable=False)
    answer = Column(Text, nullable=False)
    order = Column(Integer, default=0)
    is_published = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
