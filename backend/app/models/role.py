from sqlalchemy import Column, String, Boolean, JSON, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from app.core.database import Base

class Role(Base):
    __tablename__ = "roles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(String(500))
    is_system = Column(Boolean, default=False) # System roles cannot be deleted
    permissions = Column(JSON, default=dict) 
    # Example permissions: {"view_cases": True, "create_cases": False, "billing_access": True}

    created_at = Column(DateTime, default=datetime.utcnow)
    
    users = relationship("User", back_populates="role")
