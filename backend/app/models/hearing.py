from sqlalchemy import Column, String, Enum, DateTime, Text, Boolean, ForeignKey, Date, Time, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
import enum

from app.core.database import Base


class HearingStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    ADJOURNED = "adjourned"
    CANCELLED = "cancelled"
    STAYED = "stayed"


class Hearing(Base):
    __tablename__ = "hearings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id = Column(UUID(as_uuid=True), ForeignKey("cases.id"), nullable=False)
    hearing_date = Column(Date, nullable=False, index=True)
    hearing_time = Column(Time)
    court = Column(String(255))
    courtroom = Column(String(100))
    judge = Column(String(255))
    purpose = Column(String(255))  # Arguments, Evidence, etc.
    status = Column(Enum(HearingStatus), default=HearingStatus.SCHEDULED)
    notes = Column(Text)
    next_date = Column(Date)
    next_purpose = Column(String(255))
    order_passed = Column(Text)
    reminder_sent = Column(Boolean, default=False)
    attended_by = Column(String(255))  # Advocate name who attended
    readiness_status = Column(String(50), default="pending")
    preparation_checklist = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    case = relationship("Case", back_populates="hearings")

    def __repr__(self):
        return f"<Hearing {self.hearing_date} for Case {self.case_id}>"
