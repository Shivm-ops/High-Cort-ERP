from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Integer, Float, Enum, Date
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
import enum
from datetime import datetime

from app.core.database import Base

class MactCaseStage(str, enum.Enum):
    CLIENT_INTAKE = "client_intake"
    DOCUMENT_COLLECTION = "document_collection"
    PETITION_DRAFTING = "petition_drafting"
    FILING = "filing"
    NOTICE_ISSUED = "notice_issued"
    WRITTEN_STATEMENT = "written_statement"
    EVIDENCE = "evidence"
    ARGUMENTS = "arguments"
    AWARD = "award"
    EXECUTION = "execution"

class MactCase(Base):
    __tablename__ = "mact_cases"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    firm_id = Column(UUID(as_uuid=True), ForeignKey("firms.id"), nullable=False, index=True)
    advocate_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Registration details
    mact_case_number = Column(String(100), index=True)
    tribunal_name = Column(String(255))
    filing_date = Column(Date)
    
    # Accident details
    accident_date = Column(Date)
    police_station = Column(String(255))
    fir_number = Column(String(100))
    vehicle_details = Column(Text)
    driver_details = Column(Text)
    owner_details = Column(Text)
    
    # Workflow & Compensation
    current_stage = Column(Enum(MactCaseStage), default=MactCaseStage.CLIENT_INTAKE)
    compensation_claimed = Column(Float, default=0.0)
    compensation_awarded = Column(Float, default=0.0)
    next_action_date = Column(Date)
    
    # Tracking
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    firm = relationship("Firm")
    advocate = relationship("User")
    claimants = relationship("MactClaimant", back_populates="mact_case", cascade="all, delete-orphan")
    documents = relationship("MactDocument", back_populates="mact_case", cascade="all, delete-orphan")
    insurance = relationship("MactInsurance", back_populates="mact_case", uselist=False, cascade="all, delete-orphan")
    workflow_logs = relationship("MactWorkflowLog", back_populates="mact_case", cascade="all, delete-orphan")

class MactClaimant(Base):
    __tablename__ = "mact_claimants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    mact_case_id = Column(UUID(as_uuid=True), ForeignKey("mact_cases.id"), nullable=False)
    
    name = Column(String(255), nullable=False)
    age = Column(Integer)
    occupation = Column(String(255))
    monthly_income = Column(Float, default=0.0)
    dependency_details = Column(Text)
    contact_information = Column(String(255))
    aadhaar_pan = Column(String(100))
    
    created_at = Column(DateTime, default=datetime.utcnow)

    mact_case = relationship("MactCase", back_populates="claimants")

class MactDocument(Base):
    __tablename__ = "mact_documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    mact_case_id = Column(UUID(as_uuid=True), ForeignKey("mact_cases.id"), nullable=False)
    
    document_type = Column(String(100)) # FIR, Charge Sheet, Driving License, etc.
    file_name = Column(String(255))
    file_url = Column(String(1024))
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    mact_case = relationship("MactCase", back_populates="documents")

class MactInsurance(Base):
    __tablename__ = "mact_insurance"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    mact_case_id = Column(UUID(as_uuid=True), ForeignKey("mact_cases.id"), nullable=False, unique=True)
    
    company_name = Column(String(255))
    policy_details = Column(Text)
    claim_reference_number = Column(String(100))
    settlement_offers = Column(Text)
    award_compliance_status = Column(String(100), default="Pending")
    correspondence_log = Column(Text)

    mact_case = relationship("MactCase", back_populates="insurance")

class MactWorkflowLog(Base):
    __tablename__ = "mact_workflow_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    mact_case_id = Column(UUID(as_uuid=True), ForeignKey("mact_cases.id"), nullable=False)
    
    stage = Column(Enum(MactCaseStage))
    notes = Column(Text)
    entered_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    mact_case = relationship("MactCase", back_populates="workflow_logs")
    entered_by = relationship("User")
