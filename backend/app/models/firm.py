from sqlalchemy import Column, String, Boolean, Enum, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
import enum

from app.core.database import Base

class FirmType(str, enum.Enum):
    INDIVIDUAL = "individual"
    PARTNERSHIP = "partnership"
    LLP = "llp"
    PVT_LTD = "pvt_ltd"

class Firm(Base):
    __tablename__ = "firms"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    type = Column(Enum(FirmType), default=FirmType.INDIVIDUAL, nullable=False)
    gst_no = Column(String(50))
    pan_no = Column(String(50))
    cin_no = Column(String(50))
    email = Column(String(255))
    phone = Column(String(20))
    address = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    users = relationship("User", back_populates="firm")

    def __repr__(self):
        return f"<Firm {self.name}>"
