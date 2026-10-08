from typing import Optional, List, Any
from sqlalchemy import Column, String, Enum, DateTime, Date, Text, Float, Integer, Boolean, ForeignKey, Index
from sqlalchemy.orm import relationship, Mapped
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

    id: Mapped[uuid.UUID] = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = Column(String(255), nullable=False, index=True)
    type: Mapped[ClientType] = Column(Enum(ClientType), default=ClientType.INDIVIDUAL)
    email: Mapped[Optional[str]] = Column(String(255))
    phone: Mapped[str] = Column(String(20), nullable=False)
    alternate_phone: Mapped[Optional[str]] = Column(String(20))
    address: Mapped[Optional[str]] = Column(Text)
    city: Mapped[Optional[str]] = Column(String(100))
    state: Mapped[Optional[str]] = Column(String(100))
    pincode: Mapped[Optional[str]] = Column(String(10))
    pan: Mapped[Any] = Column(StringEncryptedType(String(20), ENCRYPTION_KEY, FernetEngine))
    gstin: Mapped[Optional[str]] = Column(String(20))
    aadhaar_last4: Mapped[Optional[str]] = Column(String(4))     # Legacy: last 4 digits
    aadhaar_number: Mapped[Any] = Column(StringEncryptedType(String(12), ENCRYPTION_KEY, FernetEngine))   # Full Aadhaar (store encrypted in prod)
    occupation: Mapped[Optional[str]] = Column(String(255))
    date_of_birth: Mapped[Optional[Date]] = Column(Date)
    photograph_url: Mapped[Optional[str]] = Column(String(1000))
    company_name: Mapped[Optional[str]] = Column(String(255))    # For corporate clients
    contact_person: Mapped[Optional[str]] = Column(String(255))  # For corporate clients
    notes: Mapped[Optional[str]] = Column(Text)
    tags: Mapped[Optional[list]] = Column(JSON, default=list)
    assigned_advocate_id: Mapped[Optional[uuid.UUID]] = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    # ── Tenant isolation ─────────────────────────────────────────────────────
    firm_id: Mapped[Optional[uuid.UUID]] = Column(UUID(as_uuid=True), ForeignKey("firms.id"), nullable=True, index=True)
    created_by_id: Mapped[Optional[uuid.UUID]] = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    updated_by_id: Mapped[Optional[uuid.UUID]] = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    # ─────────────────────────────────────────────────────────────────────────
    is_active: Mapped[bool] = Column(Boolean, default=True)
    is_deleted: Mapped[bool] = Column(Boolean, default=False)
    kyc_verified: Mapped[bool] = Column(Boolean, default=False)
    fees_outstanding: Mapped[float] = Column(Float, default=0.0)
    
    # Client Portal Authentication
    portal_access_enabled: Mapped[bool] = Column(Boolean, default=False)
    hashed_password: Mapped[Optional[str]] = Column(String(255), nullable=True)
    last_login: Mapped[Optional[datetime]] = Column(DateTime, nullable=True)

    created_at: Mapped[datetime] = Column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

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
