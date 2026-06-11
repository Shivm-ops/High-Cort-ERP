"""
app/models/audit_log.py
========================
Firm-level audit trail for all user actions on LegalOS data.
Captures every create/read/update/delete plus auth events.
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Who did it
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    firm_id = Column(UUID(as_uuid=True), ForeignKey("firms.id", ondelete="SET NULL"), nullable=True, index=True)

    # What happened
    action = Column(String(100), nullable=False, index=True)
    # e.g. CLIENT_CREATE, CASE_UPDATE, DOCUMENT_DOWNLOAD, LOGIN, LOGOUT,
    #       INVOICE_CREATE, KYC_APPROVE, USER_SUSPEND, PASSWORD_CHANGE

    # What it affected
    resource_type = Column(String(50), nullable=True)   # CLIENT, CASE, DOCUMENT, INVOICE, USER, AUTH
    resource_id = Column(String(255), nullable=True)     # UUID of affected record

    # Context
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(String(500), nullable=True)
    details = Column(Text, nullable=True)               # JSON string: before/after, extra context
    status = Column(String(20), default="success")      # success | failure | blocked

    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    user = relationship("User", foreign_keys=[user_id])
