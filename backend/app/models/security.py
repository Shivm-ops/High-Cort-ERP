from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from app.core.database import Base

class LoginHistory(Base):
    __tablename__ = "login_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    ip_address = Column(String(50))
    user_agent = Column(String(500))
    success = Column(Boolean, default=True)
    failure_reason = Column(String(255))
    attempted_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")

class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token_jti = Column(String(255), unique=True, nullable=False, index=True) # JWT ID
    device_info = Column(String(255))
    ip_address = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    is_active = Column(Boolean, default=True)

    user = relationship("User")

class SystemAuditLog(Base):
    __tablename__ = "system_audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    admin_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(100), nullable=False) # e.g., 'SUSPEND_FIRM', 'FORCE_LOGOUT'
    resource_type = Column(String(50)) # e.g., 'FIRM', 'USER', 'SETTING'
    resource_id = Column(String(255))
    details = Column(String(1000)) # JSON string or descriptive text
    ip_address = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)

    admin = relationship("User")
