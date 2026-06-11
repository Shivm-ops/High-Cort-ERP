from sqlalchemy import Column, String, Enum, DateTime, Text, Boolean, ForeignKey, Integer
from sqlalchemy.orm import relationship
from sqlalchemy import JSON
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
import enum

from app.core.database import Base


class DraftCategory(str, enum.Enum):
    APPLICATION = "application"
    AFFIDAVIT = "affidavit"
    PETITION = "petition"
    COMPLAINT = "complaint"
    REPLY = "reply"
    WRITTEN_STATEMENT = "written_statement"
    NOTICE = "notice"
    AGREEMENT = "agreement"
    APPEAL = "appeal"
    VAKALATNAMA = "vakalatnama"
    MOTION = "motion"
    OTHER = "other"


class DraftLanguage(str, enum.Enum):
    ENGLISH = "en"
    HINDI = "hi"
    MARATHI = "mr"
    GUJARATI = "gu"


class Draft(Base):
    __tablename__ = "drafts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(500), nullable=False)
    content = Column(Text, nullable=True)
    category = Column(Enum(DraftCategory), nullable=False)
    practice_area = Column(String(255))
    subcategory = Column(String(255))
    court_type = Column(String(255))
    storage_url = Column(String(1000))
    status = Column(String(50), default="active")
    language = Column(Enum(DraftLanguage), default=DraftLanguage.ENGLISH)
    case_id = Column(UUID(as_uuid=True), ForeignKey("cases.id"))
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"))
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    tags = Column(JSON, default=list)
    is_template = Column(Boolean, default=False)
    ai_generated = Column(Boolean, default=False)
    ai_prompt = Column(Text)
    version = Column(Integer, default=1)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("drafts.id"))
    word_count = Column(Integer)
    sections_used = Column(JSON, default=list)
    cases_cited = Column(JSON, default=list)
    is_public_template = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)
    # ── Tenant isolation ─────────────────────────────────────────────────────
    firm_id = Column(UUID(as_uuid=True), ForeignKey("firms.id"), nullable=True, index=True)
    # ─────────────────────────────────────────────────────────────────────────
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    case = relationship("Case", back_populates="drafts")
    client = relationship("Client")
    created_by_user = relationship("User", back_populates="created_drafts")
    versions = relationship("Draft", foreign_keys=[parent_id])

    def __repr__(self):
        return f"<Draft '{self.title[:50]}' ({self.category})>"
