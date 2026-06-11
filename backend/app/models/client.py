from sqlalchemy import Column, String, Enum, DateTime, Date, Text, Float, Integer, Boolean, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy import JSON
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
import enum

from sqlalchemy_utils import StringEncryptedType
from sqlalchemy_utils.types.encrypted.encrypted_type import FernetEngine
from app.core.database import Base
from app.core.security_db import ENCRYPTION_KEY


class ClientType(str, enum.Enum):
    INDIVIDUAL = "individual"
    CORPORATE = "corporate"
    GOVERNMENT = "government"


class Client(Base):
    __tablename__ = "clients"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, index=True)
    type = Column(Enum(ClientType), default=ClientType.INDIVIDUAL)
    email = Column(String(255))
    phone = Column(String(20), nullable=False)
    alternate_phone = Column(String(20))
    address = Column(Text)
    city = Column(String(100))
    state = Column(String(100))
    pincode = Column(String(10))
    pan = Column(StringEncryptedType(String(20), ENCRYPTION_KEY, FernetEngine))
    gstin = Column(String(20))
    aadhaar_last4 = Column(String(4))     # Legacy: last 4 digits
    aadhaar_number = Column(StringEncryptedType(String(12), ENCRYPTION_KEY, FernetEngine))   # Full Aadhaar (store encrypted in prod)
    occupation = Column(String(255))
    date_of_birth = Column(Date)
    photograph_url = Column(String(1000))
    company_name = Column(String(255))    # For corporate clients
    contact_person = Column(String(255))  # For corporate clients
    notes = Column(Text)
    tags = Column(JSON, default=list)
    assigned_advocate_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    # ── Tenant isolation ─────────────────────────────────────────────────────
    firm_id = Column(UUID(as_uuid=True), ForeignKey("firms.id"), nullable=True, index=True)
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    updated_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    # ─────────────────────────────────────────────────────────────────────────
    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)
    kyc_verified = Column(Boolean, default=False)
    fees_outstanding = Column(Float, default=0.0)
    
    # Client Portal Authentication
    portal_access_enabled = Column(Boolean, default=False)
    hashed_password = Column(String(255), nullable=True)
    last_login = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    cases = relationship("Case", back_populates="client")
    invoices = relationship("Invoice", back_populates="client")
    documents = relationship("Document", back_populates="client")
    assigned_advocate = relationship("User", foreign_keys=[assigned_advocate_id])
    firm = relationship("Firm")

    @property
    def active_cases_count(self):
        return sum(1 for c in self.cases if c.status == "active")

    def __repr__(self):
        return f"<Client {self.name} ({self.type})>"
