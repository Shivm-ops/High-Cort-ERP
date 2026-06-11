import uuid
from sqlalchemy import Column, String, Float, Boolean, Date, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime

from app.core.database import Base

class Fee(Base):
    __tablename__ = "fees"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=False)
    case_id = Column(UUID(as_uuid=True), ForeignKey("cases.id"), nullable=True)
    hearing_id = Column(UUID(as_uuid=True), ForeignKey("hearings.id"), nullable=True)
    invoice_id = Column(UUID(as_uuid=True), ForeignKey("invoices.id"), nullable=True)
    
    category = Column(String(100), nullable=False)  # Consultation, Notice Drafting, Hearing, etc.
    description = Column(Text, nullable=True)
    amount = Column(Float, nullable=False)
    date = Column(Date, nullable=False)
    
    is_billed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    client = relationship("Client")
    case = relationship("Case")
    hearing = relationship("Hearing")
    invoice = relationship("Invoice")


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=False)
    case_id = Column(UUID(as_uuid=True), ForeignKey("cases.id"), nullable=True)
    invoice_id = Column(UUID(as_uuid=True), ForeignKey("invoices.id"), nullable=True)
    
    category = Column(String(100), nullable=False)  # Court Fees, Travel, Courier, etc.
    description = Column(Text, nullable=True)
    amount = Column(Float, nullable=False)
    date = Column(Date, nullable=False)
    
    is_billed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    client = relationship("Client")
    case = relationship("Case")
    invoice = relationship("Invoice")
