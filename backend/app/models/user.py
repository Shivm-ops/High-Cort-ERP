from sqlalchemy import Column, String, Boolean, Enum, DateTime, Text, ForeignKey, JSON, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
import enum

from app.core.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    SENIOR_ADVOCATE = "senior_advocate"
    ASSOCIATE_ADVOCATE = "associate_advocate"
    JUNIOR_ADVOCATE = "junior_advocate"
    PARALEGAL = "paralegal"
    CLERK = "clerk"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    user_type = Column(Enum(UserRole), default=UserRole.ASSOCIATE_ADVOCATE, nullable=False)
    phone = Column(String(20))
    address = Column(Text)
    bar_council_no = Column(String(50))
    firm_id = Column(UUID(as_uuid=True), ForeignKey("firms.id"))
    role_id = Column(UUID(as_uuid=True), ForeignKey("roles.id"))
    role = relationship("Role", back_populates="users")
    avatar_url = Column(String(500))
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    is_superadmin = Column(Boolean, default=False)
    admin_permissions = Column(JSON, default=list)
    preferred_language = Column(String(10), default="en")
    specializations = Column(Text)  # JSON array
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime)
    # ── Auth hardening ─────────────────────────────────────────────────────
    failed_login_attempts = Column(Integer, default=0, nullable=False)
    locked_until = Column(DateTime, nullable=True)  # Account lockout expiry
    login_count = Column(Integer, default=0, nullable=False)
    mfa_enabled = Column(Boolean, default=False)
    mfa_secret = Column(String(255), nullable=True)
    # ─────────────────────────────────────────────────────────────────────────

    # Relationships
    cases = relationship("Case", back_populates="assigned_advocate", foreign_keys="Case.primary_advocate_id")
    created_drafts = relationship("Draft", back_populates="created_by_user")
    invoices = relationship("Invoice", back_populates="created_by_user")
    firm = relationship("Firm", back_populates="users")
    kyc_records = relationship("KycRecord", back_populates="user", foreign_keys="KycRecord.user_id")

    def __repr__(self):
        return f"<User {self.email} ({self.role})>"
