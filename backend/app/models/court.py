from sqlalchemy import Column, String, DateTime, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime

from app.core.database import Base

class Court(Base):
    __tablename__ = "courts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(500), nullable=False, index=True)
    type = Column(String(100), nullable=False) # High Court, District Court, Tribunal, etc.
    jurisdiction = Column(String(255))
    address = Column(Text)
    presiding_officer = Column(String(255))
    room_number = Column(String(50))
    contact_info = Column(String(255))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Court {self.name}>"
