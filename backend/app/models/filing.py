from sqlalchemy import Column, String, Enum, DateTime, Text, Float, Boolean, ForeignKey, Integer, Date
from sqlalchemy.orm import relationship
from sqlalchemy import JSON
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
import enum

from app.core.database import Base


class FilingStatus(str, enum.Enum):
    NOT_READY = "not_ready"
    READY = "ready"
    FILED = "filed"
    DEFECT_RAISED = "defect_raised"
    DEFECT_RESOLVED = "defect_resolved"
    ACCEPTED = "accepted"


class Filing(Base):
    __tablename__ = "filings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id = Column(UUID(as_uuid=True), ForeignKey("cases.id"), nullable=False)
    draft_id = Column(UUID(as_uuid=True), ForeignKey("drafts.id"))
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    title = Column(String(500), nullable=False)
    filing_type = Column(String(100))          # Petition / Application / Reply / etc.
    status = Column(Enum(FilingStatus), default=FilingStatus.NOT_READY)

    # Dates
    filing_date = Column(Date)
    acceptance_date = Column(Date)
    defect_raised_date = Column(Date)

    # Fees
    court_fee = Column(Float, default=0.0)
    stamp_duty = Column(Float, default=0.0)
    estamp_reference = Column(String(100))
    other_costs = Column(Float, default=0.0)

    # Checklist — list of dicts: {name, required, submitted, document_id}
    checklist = Column(JSON, default=list)

    # Attached document IDs (list of strings)
    document_ids = Column(JSON, default=list)

    notes = Column(Text)
    defect_description = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    case = relationship("Case", back_populates="filings")
    draft = relationship("Draft", foreign_keys=[draft_id])

    def __repr__(self):
        return f"<Filing {self.title} [{self.status}]>"


class CaseNote(Base):
    __tablename__ = "case_notes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id = Column(UUID(as_uuid=True), ForeignKey("cases.id"), nullable=False)
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    content = Column(Text, nullable=False)
    note_type = Column(String(50), default="general")  # general / instruction / reminder / observation
    is_pinned = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    case = relationship("Case", back_populates="notes")

    def __repr__(self):
        return f"<CaseNote {self.id} [{self.note_type}]>"
