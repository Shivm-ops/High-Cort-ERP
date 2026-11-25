from sqlalchemy import Column, String, Date, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime

from app.core.database import Base


class LegalNotice(Base):
    __tablename__ = "legal_notices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    firm_id = Column(UUID(as_uuid=True), ForeignKey("firms.id"), index=True, nullable=True)
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"), index=True, nullable=True)
    case_id = Column(UUID(as_uuid=True), ForeignKey("cases.id"), index=True, nullable=True)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=True)
    reply_draft_id = Column(UUID(as_uuid=True), ForeignKey("drafts.id"), nullable=True)

    direction = Column(String(20), default="received", nullable=False)  # "received" | "sent"
    subject = Column(String(500), nullable=False)
    notice_type = Column(String(120), default="General Legal Notice", nullable=False)
    reference_no = Column(String(120), nullable=True)

    opponent_name = Column(String(255), nullable=False)
    opponent_advocate = Column(String(255), nullable=True)
    opponent_address = Column(Text, nullable=True)

    notice_date = Column(Date, nullable=True)
    received_date = Column(Date, nullable=True)
    reply_deadline = Column(Date, nullable=True, index=True)
    replied_date = Column(Date, nullable=True)

    delivery_mode = Column(String(60), default="RPAD", nullable=False)
    tracking_number = Column(String(120), nullable=True)
    status = Column(String(30), default="pending_reply", nullable=False)  # "pending_reply" | "replied" | "sent" | "draft" | "closed"
    summary = Column(Text, nullable=True)
    language = Column(String(20), default="en", nullable=False)

    is_deleted = Column(Boolean, default=False, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    client = relationship("Client", foreign_keys=[client_id])
    case = relationship("Case", foreign_keys=[case_id])
    document = relationship("Document", foreign_keys=[document_id])
    reply_draft = relationship("Draft", foreign_keys=[reply_draft_id])

    def __repr__(self):
        return f"<LegalNotice {self.subject}>"
