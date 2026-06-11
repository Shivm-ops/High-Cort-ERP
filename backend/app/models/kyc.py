from sqlalchemy import Column, String, Enum, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
import enum

from sqlalchemy_utils import StringEncryptedType
from sqlalchemy_utils.types.encrypted.encrypted_type import FernetEngine
from app.core.database import Base
from app.core.security_db import ENCRYPTION_KEY

class KycStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    RESUBMITTED = "resubmitted"

class DocumentType(str, enum.Enum):
    AADHAAR = "aadhaar"
    PAN = "pan"
    BAR_COUNCIL = "bar_council"
    GST = "gst"
    CIN = "cin"
    ADDRESS_PROOF = "address_proof"
    PHOTO = "photo"

class EntityType(str, enum.Enum):
    USER = "user"
    FIRM = "firm"

class KycRecord(Base):
    __tablename__ = "kyc_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_type = Column(Enum(EntityType), nullable=False)
    
    # We store either user_id or firm_id depending on the entity_type
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    firm_id = Column(UUID(as_uuid=True), ForeignKey("firms.id"), nullable=True)
    
    document_type = Column(Enum(DocumentType, name="kyc_document_type"), nullable=False)
    document_number = Column(StringEncryptedType(String(100), ENCRYPTION_KEY, FernetEngine))
    document_url = Column(String(500), nullable=False)
    
    status = Column(Enum(KycStatus), default=KycStatus.PENDING, nullable=False)
    rejection_reason = Column(Text)
    
    submitted_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime)
    reviewed_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="kyc_records")
    firm = relationship("Firm", foreign_keys=[firm_id])
    reviewed_by = relationship("User", foreign_keys=[reviewed_by_id])

    def __repr__(self):
        return f"<KycRecord {self.document_type} - {self.status}>"
