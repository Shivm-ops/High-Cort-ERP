from sqlalchemy import Column, String, Enum, DateTime, Date, Text, Boolean, ForeignKey, Integer
from sqlalchemy.orm import relationship
from sqlalchemy import JSON
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime, date as date_type
import enum

from app.core.database import Base


class AdvocateRole(str, enum.Enum):
    SENIOR = "senior"
    JUNIOR = "junior"
    ASSOCIATE = "associate"
    EXTERNAL = "external"
    STANDBY = "standby"


class TaskType(str, enum.Enum):
    DRAFTING = "drafting"
    FILING = "filing"
    RESEARCH = "research"
    EVIDENCE_COLLECTION = "evidence_collection"
    CLIENT_MEETING = "client_meeting"
    HEARING_PREPARATION = "hearing_preparation"
    REVIEW = "review"
    OTHER = "other"


class TaskStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    REVIEWED = "reviewed"
    CANCELLED = "cancelled"


class CaseAdvocate(Base):
    """Represents one advocate's assignment to a case (with full history)."""
    __tablename__ = "case_advocates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id = Column(UUID(as_uuid=True), ForeignKey("cases.id"), nullable=False)
    advocate_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    assigned_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))

    role = Column(Enum(AdvocateRole), default=AdvocateRole.JUNIOR)
    start_date = Column(Date, default=date_type.today)
    end_date = Column(Date)                    # NULL = still active
    is_active = Column(Boolean, default=True)

    transfer_reason = Column(String(255))      # "Client Decision" / "Advocate Resigned" / etc.
    notes = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    case = relationship("Case", back_populates="case_advocates")
    advocate = relationship("User", foreign_keys=[advocate_id])
    assigned_by = relationship("User", foreign_keys=[assigned_by_id])

    def __repr__(self):
        return f"<CaseAdvocate case={self.case_id} advocate={self.advocate_id} role={self.role}>"


class CaseTask(Base):
    """A task assigned to an advocate within a case."""
    __tablename__ = "case_tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id = Column(UUID(as_uuid=True), ForeignKey("cases.id"), nullable=False)
    assignee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    assigned_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))

    title = Column(String(500), nullable=False)
    description = Column(Text)
    task_type = Column(Enum(TaskType), default=TaskType.OTHER)
    status = Column(Enum(TaskStatus), default=TaskStatus.PENDING)
    priority = Column(String(20), default="medium")

    deadline = Column(Date)
    completed_at = Column(DateTime)
    reviewed_at = Column(DateTime)
    
    estimated_minutes = Column(Integer, default=0)
    actual_minutes = Column(Integer, default=0)

    notes = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    case = relationship("Case", back_populates="tasks")
    assignee = relationship("User", foreign_keys=[assignee_id])
    assigned_by = relationship("User", foreign_keys=[assigned_by_id])

    def __repr__(self):
        return f"<CaseTask {self.title[:40]} [{self.status}]>"
