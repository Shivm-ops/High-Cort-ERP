import sys, os
sys.path.insert(0, os.path.dirname(__file__))

# Import ALL models so SQLAlchemy resolves every relationship
import app.models.user
import app.models.client
import app.models.case
import app.models.hearing
import app.models.invoice
import app.models.document
import app.models.draft
import app.models.filing
import app.models.case_advocate
import app.models.intake
import app.models.case_law
import app.models.letterhead
import app.models.security
import app.models.fee_expense
import app.models.audit_log
import app.models.advance_payment
import app.models.witness
import app.models.firm
import app.models.kyc
import app.models.subscription
import app.models.setting
import app.models.role
import app.models.support

from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

db = SessionLocal()

EMAIL = "admin@fastcase.in"
PASSWORD = "legal@2025"

try:
    admin = db.query(User).filter(User.email == EMAIL).first()

    if admin:
        admin.hashed_password = get_password_hash(PASSWORD)
        admin.failed_login_attempts = 0
        admin.locked_until = None
        admin.is_active = True
        db.commit()
        print(f"✅ Account unlocked and password reset for: {EMAIL}")
        print(f"   Password: {PASSWORD}")
    else:
        print(f"❌ User '{EMAIL}' not found in the database.")
        print("   Please run: python seed.py")
finally:
    db.close()
