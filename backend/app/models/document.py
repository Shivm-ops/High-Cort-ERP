from sqlalchemy import Column, String, Enum, DateTime, Text, Float, Boolean, ForeignKey, Integer
from sqlalchemy.orm import relationship
from sqlalchemy import JSON
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
import enum

from app.core.database import Base


class DocumentType(str, enum.Enum):
    IDENTITY_DOCUMENT = "identity_document"
    COURT_DOCUMENT = "court_document"
    EVIDENCE_DOCUMENT = "evidence_document"
    MEDICAL_RECORD = "medical_record"
    BANK_RECORD = "bank_record"
    PROPERTY_RECORD = "property_record"
    PHOTO = "photo"
    VIDEO = "video"
    AUDIO = "audio"
    NOTICE = "notice"
    REPLY = "reply"
    ORDER = "order"
    JUDGMENT = "judgment"
    OTHER = "other"


class EvidenceStatus(str, enum.Enum):
    UPLOADED = "uploaded"
    VERIFIED = "verified"
    FILED = "filed"
    MARKED_EXHIBIT = "marked_exhibit"
    ACCEPTED = "accepted"
    REJECTED = "rejected"


class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(500), nullable=False)
    original_filename = Column(String(500))
    file_path = Column(String(1000))  # S3/Azure URL
    file_size = Column(Integer)  # bytes
    mime_type = Column(String(100))
    doc_type = Column(Enum(DocumentType), default=DocumentType.OTHER)
    case_id = Column(UUID(as_uuid=True), ForeignKey("cases.id"), index=True)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"), index=True)
    uploaded_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    modified_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    downloaded_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    filed_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    last_action_date = Column(DateTime)
    
    tags = Column(JSON, default=list)
    description = Column(Text)
    
    # OCR & AI
    ocr_text = Column(Text)  # Extracted text via OCR
    ocr_processed = Column(Boolean, default=False)
    ocr_language = Column(String(10))
    extracted_metadata = Column(JSON, default=dict)  # Document Name, Date, Ref No, Parties
    
    is_deleted = Column(Boolean, default=False)
    
    # Evidence specific
    is_evidence = Column(Boolean, default=False)
    evidence_date = Column(DateTime)
    exhibit_number = Column(String(50))
    evidence_status = Column(Enum(EvidenceStatus))
    
    # Links
    linked_arguments = Column(JSON, default=list)
    linked_case_laws = Column(JSON, default=list)
    linked_drafts = Column(JSON, default=list)

    hash_sha256 = Column(String(64))  # For integrity verification
    version = Column(Integer, default=1)
    signature_status = Column(String(50))
    signature_request_id = Column(String(200))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    case = relationship("Case", back_populates="documents")
    client = relationship("Client", back_populates="documents")

    def __repr__(self):
        return f"<Document {self.name}>"
