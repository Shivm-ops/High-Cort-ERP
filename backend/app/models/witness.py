from sqlalchemy import Column, String, Text, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime

from app.core.database import Base


class Witness(Base):
    __tablename__ = "witnesses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id = Column(UUID(as_uuid=True), ForeignKey("cases.id"), nullable=False)
    name = Column(String(255), nullable=False)
    address = Column(Text)
    mobile = Column(String(20))
    statement = Column(Text)
    status = Column(String(50), default="Pending")
    supporting_documents = Column(JSON, default=list)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    case = relationship("Case", backref="witnesses")

    def __repr__(self):
        return f"<Witness {self.name}>"
