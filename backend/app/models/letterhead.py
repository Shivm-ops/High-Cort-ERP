import uuid
from sqlalchemy import Column, String, Text, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class Letterhead(Base):
    __tablename__ = "letterheads"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), default="Primary Letterhead")
    is_default = Column(Boolean, default=False)
    
    # Advocate / Firm Details
    advocate_name = Column(String(255))
    firm_name = Column(String(255))
    enrollment_number = Column(String(100))
    office_address = Column(Text)
    mobile_number = Column(String(50))
    email_id = Column(String(100))
    website = Column(String(100))
    gst_number = Column(String(50))
    
    # Base64 Encoded Images
    logo_base64 = Column(Text)
    signature_base64 = Column(Text)
    stamp_base64 = Column(Text)
    
    # Visual Template Settings
    template_type = Column(String(50), default="standard") # standard, law_firm, senior_advocate, custom
    
    # Custom Headers (optional)
    custom_header_html = Column(Text)
    custom_footer_html = Column(Text)

    user = relationship("User", backref="letterhead")

    def __repr__(self):
        return f"<Letterhead {self.id} for User {self.user_id}>"
