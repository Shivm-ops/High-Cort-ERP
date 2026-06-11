from sqlalchemy import Column, String, Enum, DateTime, Text, Float, Boolean, ForeignKey, Integer, Date
from sqlalchemy.orm import relationship
from sqlalchemy import JSON
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
import enum

from app.core.database import Base


class InvoiceStatus(str, enum.Enum):
    DRAFT = "draft"
    SENT = "sent"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"
    PARTIAL = "partial"


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    invoice_no = Column(String(50), unique=True, nullable=False, index=True)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=False)
    case_id = Column(UUID(as_uuid=True), ForeignKey("cases.id"))
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    items = Column(JSON, default=list)  # [{description, quantity, rate, amount}]
    subtotal = Column(Float, nullable=False)
    gst_rate = Column(Float, default=18.0)
    gst_amount = Column(Float, default=0.0)
    total = Column(Float, nullable=False)
    amount_paid = Column(Float, default=0.0)
    balance_due = Column(Float)
    status = Column(Enum(InvoiceStatus), default=InvoiceStatus.DRAFT)
    due_date = Column(Date)
    paid_date = Column(Date)
    payment_method = Column(String(50))
    payment_reference = Column(String(100))
    notes = Column(Text)
    terms = Column(Text)
    hsn_sac_code = Column(String(20))
    place_of_supply = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    client = relationship("Client", back_populates="invoices")
    case = relationship("Case", back_populates="invoices")
    created_by_user = relationship("User", back_populates="invoices")

    def __repr__(self):
        return f"<Invoice {self.invoice_no} — ₹{self.total}>"
