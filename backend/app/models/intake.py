from sqlalchemy import Column, String, Enum, DateTime, Date, Text, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
import enum

from app.core.database import Base

class IntakeStatus(str, enum.Enum):
    UNDER_REVIEW = "under_review"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    AWAITING_DOCS = "awaiting_documents"

class Intake(Base):
    __tablename__ = "intakes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=True)
    case_id = Column(UUID(as_uuid=True), ForeignKey("cases.id"), nullable=True)
    
    # Interview Fields
    narrative = Column(Text, nullable=True)
    facts = Column(Text, nullable=True)
    opponent_details = Column(Text, nullable=True)
    witness_details = Column(Text, nullable=True)
    previous_litigation = Column(Text, nullable=True)
    urgency_level = Column(String(50), default="Normal")
    
    # JSON Arrays
    chronology = Column(JSON, default=list) # [{date, event, remarks}]
    document_checklist = Column(JSON, default=dict) # {doc_type: status}
    applicable_sections = Column(JSON, default=list) # [str]
    facts_list = Column(JSON, default=list) # [{fact, evidence_needed}]
    assessment = Column(JSON, default=dict) # {strengths: [], weaknesses: [], limitation: ""}
    
    # Text Fields
    relief_sought = Column(Text, nullable=True)
    
    # Assessment Fields (Legacy)
    strengths = Column(Text, nullable=True)
    weaknesses = Column(Text, nullable=True)
    risks = Column(Text, nullable=True)
    limitation_issues = Column(Text, nullable=True)
    jurisdiction_issues = Column(Text, nullable=True)
    additional_docs_required = Column(Text, nullable=True)
    
    # Engagement Fields
    status = Column(Enum(IntakeStatus), default=IntakeStatus.UNDER_REVIEW)
    date_of_acceptance = Column(DateTime, nullable=True)
    fee_agreement = Column(Text, nullable=True)
    consent_received = Column(Boolean, default=False)
    consent_details = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    client = relationship("Client", foreign_keys=[client_id])
    case = relationship("Case", foreign_keys=[case_id])
