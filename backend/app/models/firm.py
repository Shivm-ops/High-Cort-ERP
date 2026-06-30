from sqlalchemy import Column, String, Boolean, Enum, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
import enum

from sqlalchemy_utils import StringEncryptedType
from sqlalchemy_utils.types.encrypted.encrypted_type import FernetEngine
from app.core.database import Base
from app.core.security_db import ENCRYPTION_KEY

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

    # Bring Your Own Key (BYOK) AI Settings (encrypted in DB)
    ai_provider = Column(String(50), default="platform", nullable=True)  # "platform", "openai", "azure", etc.
    ai_api_key = Column(StringEncryptedType(String(500), ENCRYPTION_KEY, FernetEngine), nullable=True)
    ai_api_base = Column(String(255), nullable=True)
    ai_model = Column(String(100), nullable=True)

    # Relationships
    users = relationship("User", back_populates="firm")

    def __repr__(self):
        return f"<Firm {self.name}>"
