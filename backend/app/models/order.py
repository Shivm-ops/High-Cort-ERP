from sqlalchemy import Column, String, ForeignKey, DateTime, Date, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime

from app.core.database import Base

class CourtOrder(Base):
    __tablename__ = "court_orders"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id = Column(UUID(as_uuid=True), ForeignKey("cases.id"), nullable=False)
    hearing_id = Column(UUID(as_uuid=True), ForeignKey("hearings.id"), nullable=True)
    
    order_type = Column(String(50), default="Interim Order") # Interim Order, Final Order, Judgment
    order_date = Column(Date, nullable=False)
    summary = Column(Text, nullable=True)
    
    # Compliance Tracking
    compliance_required = Column(Boolean, default=False)
    compliance_due_date = Column(Date, nullable=True)
    compliance_status = Column(String(50), default="pending") # pending, completed, overdue, not_applicable
    next_action = Column(String(255), nullable=True)
    
    # Tenant isolation
    firm_id = Column(UUID(as_uuid=True), ForeignKey("firms.id"), nullable=True, index=True)
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    case = relationship("Case", back_populates="orders")
    hearing = relationship("Hearing")
