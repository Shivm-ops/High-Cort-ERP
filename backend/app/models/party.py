from sqlalchemy import Column, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime

from app.core.database import Base

class Party(Base):
    __tablename__ = "parties"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id = Column(UUID(as_uuid=True), ForeignKey("cases.id"), nullable=False)
    
    # "petitioner", "respondent", "appellant", etc.
    party_type = Column(String(50), nullable=False, default="respondent")
    
    name = Column(String(255), nullable=False)
    advocate_name = Column(String(255))
    mobile = Column(String(20))
    email = Column(String(255))
    address = Column(String(500))
    
    # ── Tenant isolation ─────────────────────────────────────────────────────
    firm_id = Column(UUID(as_uuid=True), ForeignKey("firms.id"), nullable=True, index=True)
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    # ─────────────────────────────────────────────────────────────────────────

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    case = relationship("Case", back_populates="parties")

    def __repr__(self):
        return f"<Party {self.name} ({self.party_type})>"
