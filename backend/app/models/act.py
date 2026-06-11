from sqlalchemy import Column, String, Enum, DateTime, Text, Integer, Boolean, ForeignKey, Float
from sqlalchemy.orm import relationship
from sqlalchemy import JSON
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime

from app.core.database import Base


class Act(Base):
    __tablename__ = "acts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(500), nullable=False, index=True)
    short_name = Column(String(100))
    year = Column(Integer)
    category = Column(String(100))
    description = Column(Text)
    total_sections = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    superseded_by = Column(String(255))  # e.g., "BNS 2023" supersedes "IPC 1860"
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    sections = relationship("Section", back_populates="act")

    def __repr__(self):
        return f"<Act {self.short_name or self.name}>"


class Section(Base):
    __tablename__ = "sections"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    act_id = Column(UUID(as_uuid=True), ForeignKey("acts.id"), nullable=False)
    number = Column(String(20), nullable=False)
    title = Column(String(500))
    content = Column(Text, nullable=False)
    sub_sections = Column(JSON, default=list)
    annotations = Column(Text)
    interpretation = Column(Text)
    importance = Column(String(10), default="medium")  # high, medium, low
    linked_case_laws = Column(JSON, default=list)  # Case law IDs
    tags = Column(JSON, default=list)
    embedding_id = Column(String(255))  # Vector DB reference
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    act = relationship("Act", back_populates="sections")

    def __repr__(self):
        return f"<Section {self.number} of {self.act_id}>"


