"""
app/models/property_check.py
============================
Data models for FastCase Property Legal Check, Court Case Search & Title Verification.
Includes:
- PropertyCheckRequest: Citizen search query and property identification
- PropertyDocument: Uploaded title deeds, 7/12, Index II, with OCR extracted text
- PropertyCheckResult: Aggregated multi-source findings, risk scores, and discrepancies
- AdvocateTitleSearchOrder: Professional advocate verification workflow and Title Opinions
"""

from sqlalchemy import Column, String, DateTime, ForeignKey, Text, JSON, Enum, Boolean, Float
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
import enum

from app.core.database import Base


class PropertyCategory(str, enum.Enum):
    AGRICULTURAL_LAND = "agricultural_land"
    RESIDENTIAL_PLOT = "residential_plot"
    NA_PLOT = "na_plot"
    FLAT_APARTMENT = "flat_apartment"
    COMMERCIAL_PROPERTY = "commercial_property"
    INDUSTRIAL_PROPERTY = "industrial_property"


class CheckStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class RiskCategory(str, enum.Enum):
    RECORDS_FOUND = "records_found"
    FURTHER_VERIFICATION_REQUIRED = "further_verification_required"
    NO_RECORD_FOUND = "no_record_found"
    SOURCE_UNAVAILABLE = "source_unavailable"


class PropertyDocumentType(str, enum.Enum):
    SATBARA_7_12 = "satbara_7_12"
    EXTRACT_8A = "extract_8a"
    SALE_DEED = "sale_deed"
    INDEX_II = "index_ii"
    MUTATION_FERFAR = "mutation_ferfar"
    PROPERTY_CARD = "property_card"
    ENCUMBRANCE_CERTIFICATE = "encumbrance_certificate"
    OTHER = "other"


class AdvocateVerificationStatus(str, enum.Enum):
    REQUESTED = "requested"
    ASSIGNED = "assigned"
    UNDER_REVIEW = "under_review"
    OPINION_ISSUED = "opinion_issued"
    REJECTED = "rejected"


class PropertyCheckRequest(Base):
    __tablename__ = "property_check_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    firm_id = Column(UUID(as_uuid=True), ForeignKey("firms.id"), nullable=True, index=True)

    # Property Identification
    property_category = Column(String(50), default="agricultural_land", nullable=False)
    state = Column(String(100), default="Maharashtra", nullable=False)
    district = Column(String(100), nullable=False, index=True)
    taluka = Column(String(100), nullable=True)
    village_city = Column(String(100), nullable=True)
    
    # Identifiers
    survey_number = Column(String(100), nullable=True, index=True)
    gat_number = Column(String(100), nullable=True, index=True)
    cts_number = Column(String(100), nullable=True, index=True)
    property_address = Column(Text, nullable=True)

    # Parties
    current_owner_name = Column(String(255), nullable=False, index=True)
    previous_owner_names = Column(JSON, default=list)  # List of strings

    # Status & Meta
    status = Column(Enum(CheckStatus), default=CheckStatus.PENDING, nullable=False)
    search_type = Column(String(50), default="standard")  # "basic_court", "basic_property", "detailed"
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    documents = relationship("PropertyDocument", back_populates="property_check", cascade="all, delete-orphan")
    result = relationship("PropertyCheckResult", back_populates="property_check", uselist=False, cascade="all, delete-orphan")
    advocate_orders = relationship("AdvocateTitleSearchOrder", back_populates="property_check", cascade="all, delete-orphan")


class PropertyDocument(Base):
    __tablename__ = "property_documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    property_check_id = Column(UUID(as_uuid=True), ForeignKey("property_check_requests.id"), nullable=False, index=True)

    document_type = Column(String(50), default="other", nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_url = Column(String(500), nullable=False)
    file_hash = Column(String(64), nullable=False)  # SHA-256 for audit integrity
    file_size_bytes = Column(Float, default=0.0)

    # OCR & Extraction
    ocr_extracted_text = Column(Text, nullable=True)
    extracted_metadata = Column(JSON, default=dict)  # {"identified_owners": [], "survey_numbers": [], "dates": [], "clauses": []}
    created_at = Column(DateTime, default=datetime.utcnow)

    property_check = relationship("PropertyCheckRequest", back_populates="documents")


class PropertyCheckResult(Base):
    __tablename__ = "property_check_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    property_check_id = Column(UUID(as_uuid=True), ForeignKey("property_check_requests.id"), nullable=False, unique=True)

    # Risk Category & Overall Score
    risk_category = Column(Enum(RiskCategory), default=RiskCategory.FURTHER_VERIFICATION_REQUIRED, nullable=False)
    risk_score = Column(Float, default=50.0)  # 0 to 100 (lower score = lower risk)
    summary_verdict = Column(Text, nullable=True)

    # Sources Checked & Details
    sources_checked = Column(JSON, default=list)  # e.g. ["mahabhumi_7_12", "ecourts_high_court", "ecourts_district_court", "igr_index_ii", "cersai"]
    source_status = Column(JSON, default=dict)  # {"mahabhumi": "success", "ecourts": "success", "igr": "no_record", "cersai": "offline"}

    # Structured Findings
    land_records_findings = Column(JSON, default=dict)  # 7/12, 8A, Ferfar, Property Card
    court_cases_findings = Column(JSON, default=list)  # Matching civil disputes with relevance scores
    registration_findings = Column(JSON, default=dict)  # Index II, deeds, encumbrance
    mortgage_charge_findings = Column(JSON, default=dict)  # CERSAI or 7/12 Other Rights
    
    # Analysis & Flags
    chain_of_title_observations = Column(JSON, default=list)
    identified_inconsistencies = Column(JSON, default=list)
    missing_documents = Column(JSON, default=list)
    verification_limitations = Column(JSON, default=list)
    recommended_next_steps = Column(JSON, default=list)

    # Generated Report
    report_html_url = Column(String(500), nullable=True)
    report_pdf_url = Column(String(500), nullable=True)
    generated_at = Column(DateTime, default=datetime.utcnow)

    property_check = relationship("PropertyCheckRequest", back_populates="result")


class AdvocateTitleSearchOrder(Base):
    __tablename__ = "advocate_title_search_orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    property_check_id = Column(UUID(as_uuid=True), ForeignKey("property_check_requests.id"), nullable=False, index=True)
    citizen_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    assigned_firm_id = Column(UUID(as_uuid=True), ForeignKey("firms.id"), nullable=True, index=True)
    assigned_advocate_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    status = Column(Enum(AdvocateVerificationStatus), default=AdvocateVerificationStatus.REQUESTED, nullable=False)
    client_notes = Column(Text, nullable=True)
    
    # Lawyer Opinion
    advocate_opinion_text = Column(Text, nullable=True)
    certified_opinion_doc_url = Column(String(500), nullable=True)
    advocate_verified_at = Column(DateTime, nullable=True)

    # Pricing & Payment
    fee_amount = Column(Float, default=0.0)
    payment_status = Column(String(20), default="pending")  # pending, paid, refunded
    payment_reference = Column(String(100), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    property_check = relationship("PropertyCheckRequest", back_populates="advocate_orders")
    assigned_firm = relationship("Firm")
