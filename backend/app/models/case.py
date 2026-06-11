from sqlalchemy import Column, String, Enum, DateTime, Text, Float, Integer, Boolean, ForeignKey, Date
from sqlalchemy.orm import relationship
from sqlalchemy import JSON
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
import enum

from app.core.database import Base


class CaseStatus(str, enum.Enum):
    ACTIVE = "active"
    PENDING = "pending"
    URGENT = "urgent"
    STAYED = "stayed"
    DISPOSED = "disposed"
    CLOSED = "closed"
    APPEALED = "appealed"


class CaseStage(str, enum.Enum):
    FILING = "filing"
    NOTICE = "notice"
    REPLY = "reply"
    EVIDENCE = "evidence"
    ARGUMENTS = "arguments"
    JUDGMENT = "judgment"
    EXECUTION = "execution"


class CasePriority(str, enum.Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class Case(Base):
    __tablename__ = "cases"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_no = Column(String(100), nullable=False, index=True)
    title = Column(String(500), nullable=False)
    description = Column(Text)

    # Court details
    court = Column(String(255), nullable=False)
    bench = Column(String(255))
    judge = Column(String(255))
    court_complex = Column(String(255))
    court_state = Column(String(100))

    # e-Courts Integration
    ecourts_cnr = Column(String(50), nullable=True)
    last_sync_date = Column(DateTime, nullable=True)

    # Parties
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=False, index=True)
    petitioner = Column(String(500))
    respondent = Column(String(500))
    opposing_counsel = Column(String(255))
    opposing_counsel_phone = Column(String(20))

    # Classification
    practice_area = Column(String(100), nullable=False)
    case_type = Column(String(100))  # Civil, Criminal, Writ, etc.
    acts_involved = Column(JSON, default=list)
    sections_involved = Column(JSON, default=list)
    arguments = Column(JSON, default=list)
    tags = Column(JSON, default=list)

    # Status
    status = Column(Enum(CaseStatus), default=CaseStatus.ACTIVE)
    stage = Column(Enum(CaseStage), default=CaseStage.FILING)
    priority = Column(Enum(CasePriority), default=CasePriority.MEDIUM)

    # Dates
    filing_date = Column(Date)
    disposal_date = Column(Date)
    incident_date = Column(Date) # Cause of Action or Judgment date
    limitation_date = Column(Date)
    limitation_act = Column(String(255))
    limitation_section = Column(String(255))
    next_hearing_date = Column(Date)

    # Financial
    fees_agreed = Column(Float, default=0.0)
    fees_received = Column(Float, default=0.0)

    # Assignment
    primary_advocate_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    team_members = Column(JSON, default=list)  # List of user IDs

    # ── Tenant isolation ─────────────────────────────────────────────────────
    firm_id = Column(UUID(as_uuid=True), ForeignKey("firms.id"), nullable=True, index=True)
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    updated_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    # ─────────────────────────────────────────────────────────────────────────
    is_deleted = Column(Boolean, default=False)

    # Appeal hierarchy
    parent_case_id = Column(UUID(as_uuid=True), ForeignKey("cases.id"), nullable=True)
    appeal_type = Column(String(50))   # appeal / revision / writ / slp / execution / other
    appeal_level = Column(Integer, default=0)   # 0=original, 1=first appeal, 2=second, etc.
    forum = Column(String(100))        # District Court / Sessions / High Court / Supreme Court / Tribunal

    # AI metadata
    ai_risk_score = Column(Float)
    ai_summary = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    client = relationship("Client", back_populates="cases")
    assigned_advocate = relationship("User", back_populates="cases", foreign_keys=[primary_advocate_id])
    hearings = relationship("Hearing", back_populates="case", order_by="Hearing.hearing_date")
    documents = relationship("Document", back_populates="case")
    drafts = relationship("Draft", back_populates="case")
    invoices = relationship("Invoice", back_populates="case")
    filings = relationship("Filing", back_populates="case", order_by="Filing.created_at")
    notes = relationship("CaseNote", back_populates="case", order_by="CaseNote.created_at.desc()")
    # Advocate team + tasks
    case_advocates = relationship("CaseAdvocate", back_populates="case", order_by="CaseAdvocate.start_date")
    tasks = relationship("CaseTask", back_populates="case", order_by="CaseTask.created_at")
    # Parties / Oppositions
    parties = relationship("Party", back_populates="case", cascade="all, delete-orphan")
    # Court Orders
    orders = relationship("CourtOrder", back_populates="case", cascade="all, delete-orphan")
    # Appeal hierarchy
    parent_case = relationship("Case", remote_side="Case.id", foreign_keys=[parent_case_id], backref="child_cases")

    def __repr__(self):
        return f"<Case {self.case_no}: {self.title[:50]}>"
