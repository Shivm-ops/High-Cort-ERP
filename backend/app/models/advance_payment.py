import uuid
from sqlalchemy import Column, String, Float, Date, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime

from app.core.database import Base

class AdvancePayment(Base):
    __tablename__ = "advance_payments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=False)
    case_id = Column(UUID(as_uuid=True), ForeignKey("cases.id"), nullable=True)
    
    amount_received = Column(Float, nullable=False, default=0.0)
    amount_utilized = Column(Float, nullable=False, default=0.0)
    balance = Column(Float, nullable=False, default=0.0)
    
    date = Column(Date, nullable=False)
    payment_method = Column(String(50), nullable=False)
    reference = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    client = relationship("Client")
    case = relationship("Case")
