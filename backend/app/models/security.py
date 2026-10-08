from typing import Optional
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, Mapped
import uuid
from datetime import datetime

from app.core.database import Base

class LoginHistory(Base):
    __tablename__ = "login_history"

    id: Mapped[uuid.UUID] = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    ip_address: Mapped[Optional[str]] = Column(String(50))
    user_agent: Mapped[Optional[str]] = Column(String(500))
    success: Mapped[bool] = Column(Boolean, default=True)
    failure_reason: Mapped[Optional[str]] = Column(String(255))
    attempted_at: Mapped[datetime] = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")

class UserSession(Base):
    __tablename__ = "user_sessions"

    id: Mapped[uuid.UUID] = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token_jti: Mapped[str] = Column(String(255), unique=True, nullable=False, index=True) # JWT ID
    device_info: Mapped[Optional[str]] = Column(String(255))
    ip_address: Mapped[Optional[str]] = Column(String(50))
    created_at: Mapped[datetime] = Column(DateTime, default=datetime.utcnow)
    expires_at: Mapped[datetime] = Column(DateTime, nullable=False)
    is_active: Mapped[bool] = Column(Boolean, default=True)

    user = relationship("User")

class SystemAuditLog(Base):
    __tablename__ = "system_audit_logs"

    id: Mapped[uuid.UUID] = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    admin_id: Mapped[Optional[uuid.UUID]] = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action: Mapped[str] = Column(String(100), nullable=False) # e.g., 'SUSPEND_FIRM', 'FORCE_LOGOUT'
    resource_type: Mapped[Optional[str]] = Column(String(50)) # e.g., 'FIRM', 'USER', 'SETTING'
    resource_id: Mapped[Optional[str]] = Column(String(255))
    details: Mapped[Optional[str]] = Column(String(1000)) # JSON string or descriptive text
    ip_address: Mapped[Optional[str]] = Column(String(50))
    created_at: Mapped[datetime] = Column(DateTime, default=datetime.utcnow)

    admin = relationship("User")
