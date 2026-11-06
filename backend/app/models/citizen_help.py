"""
app/models/citizen_help.py
===========================
Citizen Legal Help & Grievance Assistance Data Models:
Stores citizen legal applications, classifications, target authorities,
applicable statutory provisions, and document generation history.
"""

from sqlalchemy import Column, String, DateTime, ForeignKey, Text, JSON, Enum, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
import enum

from app.core.database import Base


class GrievanceStatus(str, enum.Enum):
    DRAFT = "draft"
    GENERATED = "generated"
    SUBMITTED = "submitted"
    RESOLVED = "resolved"


class CitizenGrievance(Base):
    __tablename__ = "citizen_grievances"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    firm_id = Column(UUID(as_uuid=True), ForeignKey("firms.id"), nullable=True)

    category = Column(String(100), nullable=False, index=True)
    sub_category = Column(String(100), nullable=True)
    language = Column(String(10), default="en", nullable=False)  # "en", "mr", "hi"

    # Applicant Details
    applicant_name = Column(String(255), nullable=False)
    applicant_phone = Column(String(20), nullable=True)
    applicant_email = Column(String(255), nullable=True)
    applicant_address = Column(Text, nullable=True)

    # Respondent / Opposite Party / Authority
    opposite_party = Column(String(255), nullable=True)
    opposite_party_address = Column(Text, nullable=True)

    # Incident Details
    incident_date = Column(String(50), nullable=True)
    incident_place = Column(String(255), nullable=True)
    facts_summary = Column(Text, nullable=False)
    relief_sought = Column(Text, nullable=True)

    # Legal Classification & Output
    target_authority = Column(String(255), nullable=True)
    applicable_laws = Column(JSON, default=list)  # [{"act": "...", "section": "...", "title": "..."}]
    required_documents = Column(JSON, default=list)  # ["ID proof", "Bank statement", ...]
    official_portal_url = Column(String(500), nullable=True)
    generated_application = Column(Text, nullable=True)

    status = Column(Enum(GrievanceStatus), default=GrievanceStatus.GENERATED, nullable=False)
    is_saved = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    firm = relationship("Firm", foreign_keys=[firm_id])
