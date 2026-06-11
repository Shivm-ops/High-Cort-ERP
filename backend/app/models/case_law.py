import uuid
from sqlalchemy import Column, String, Text, Boolean, Date, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class CaseLaw(Base):
    __tablename__ = "case_laws"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), index=True, nullable=False)
    citation = Column(String(255), index=True, nullable=True)
    court_name = Column(String(255), index=True, nullable=True)
    judge_name = Column(String(255), nullable=True)
    judgment_date = Column(Date, nullable=True)
    practice_area = Column(String(100), index=True, nullable=True)
    
    # Store as JSON lists
    keywords = Column(JSON, default=list)
    mapped_sections = Column(JSON, default=list)
    important_paragraphs = Column(JSON, default=list)
    arguments = Column(JSON, default=list)
    
    # Text fields
    summary = Column(Text, nullable=True)
    ratio_decidendi = Column(Text, nullable=True)
    key_findings = Column(Text, nullable=True)
    personal_notes = Column(Text, nullable=True)
    
    # S3 / blob storage path
    document_url = Column(String(1024), nullable=True)
    
    # Is it a favorite?
    is_favorite = Column(Boolean, default=False)
    
    # Optional link to a specific matter/case
    case_id = Column(UUID(as_uuid=True), ForeignKey("cases.id", ondelete="SET NULL"), nullable=True)
    
    # ── Tenant isolation ─────────────────────────────────────────────────────
    firm_id = Column(UUID(as_uuid=True), ForeignKey("firms.id"), nullable=True, index=True)
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    # ─────────────────────────────────────────────────────────────────────────
    
    # Relationship
    case = relationship("Case", backref="case_laws")
