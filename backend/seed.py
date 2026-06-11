"""
Seed script — creates the default admin user and initialises all DB tables.
Run once after setting up the database:

    cd /Users/abhijitpatil/advocate-erp/backend
    python seed.py
"""

import sys
import os

# Make sure app/ is importable
sys.path.insert(0, os.path.dirname(__file__))

from app.models.firm import Firm
from app.core.security import get_password_hash

# Import ALL models so SQLAlchemy can resolve every relationship
from app.models.user import User, UserRole
from app.core.database import Base, engine, SessionLocal
import app.models.client   # noqa
import app.models.case     # noqa
import app.models.hearing  # noqa
import app.models.invoice  # noqa
import app.models.document # noqa
import app.models.draft    # noqa
import app.models.filing        # noqa
import app.models.case_advocate  # noqa
import app.models.intake         # noqa
import app.models.case_law       # noqa
import app.models.letterhead     # noqa
import app.models.security       # noqa
import app.models.fee_expense    # noqa
import app.models.audit_log      # noqa
import app.models.advance_payment # noqa
import app.models.witness        # noqa
import app.models.firm           # noqa
import app.models.kyc            # noqa
import app.models.subscription   # noqa
import app.models.setting        # noqa
import app.models.role           # noqa
import app.models.security       # noqa
import app.models.support        # noqa

# ── 1. Drop and recreate all tables (dev only — ensures schema is fresh) ──────
print("Recreating database tables...")
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)
print("  ✓ Tables ready")

# ── 2. Seed default admin ─────────────────────────────────────────────────────
db = SessionLocal()

DEFAULT_EMAIL    = "admin@lagalos.in"
DEFAULT_PASSWORD = "lagalos@2025"
DEFAULT_NAME     = "LegalOS System Admin"

try:
    existing = db.query(User).filter(User.email == DEFAULT_EMAIL).first()
    if existing:
        print(f"\n  ℹ  User already exists: {DEFAULT_EMAIL}")
    else:
        user = User(
            email=DEFAULT_EMAIL,
            hashed_password=get_password_hash(DEFAULT_PASSWORD),
            full_name=DEFAULT_NAME,
            user_type=UserRole.ADMIN,
            is_active=True,
            is_verified=True,
            is_superadmin=True,
        )
        db.add(user)
        db.commit()
        print(f"\n  ✓ Admin user created")



    # Add Vakalatnama template
    from app.models.draft import Draft
    existing_template = db.query(Draft).filter(Draft.title == "Vakalatnama").first()
    if not existing_template:
        template = Draft(
            title="Vakalatnama",
            category="other",
            is_template=True,
            language="en",
            created_by_id=user.id,
            content="""BEFORE THE HON'BLE COURT OF [COURT_NAME] AT [COURT_CITY]

Case No: [CASE_NO]

[PETITIONER_NAME] ............................................ Petitioner
                          VERSUS
[RESPONDENT_NAME] ............................................ Respondent

VAKALATNAMA

I/We, [CLIENT_NAME], do hereby appoint and retain [ADVOCATE_NAME] to act and appear for me/us in the above suit/appeal/petition and on my/our behalf to conduct and prosecute (or defend) the same and all proceedings that may be taken in respect of any application connected with the same..."""
        )
        db.add(template)
        db.commit()
        print(f"  ✓ Vakalatnama template created")



    # Add System Settings
    from app.models.setting import SystemSetting
    if db.query(SystemSetting).count() == 0:
        settings = [
            SystemSetting(key="platform_name", value="LegalOS Admin", description="Global Platform Name", is_public=True),
            SystemSetting(key="support_email", value="support@lagalos.in", description="Support Contact Email", is_public=True),
            SystemSetting(key="support_phone", value="+91-800-LegalOS-AI", description="Support Contact Phone", is_public=True),
            SystemSetting(key="maintenance_mode", value="false", description="Toggle Global Maintenance Mode", is_public=True),
            SystemSetting(key="max_upload_size_mb", value="50", description="Max file upload size in MB", is_public=False)
        ]
        db.add_all(settings)
        db.commit()
        print("  ✓ System Settings seeded")

    print("\n" + "─" * 48)
    print("  LOGIN CREDENTIALS")
    print("─" * 48)
    print(f"  Email    :  {DEFAULT_EMAIL}")
    print(f"  Password :  {DEFAULT_PASSWORD}")
    print("─" * 48)
    print("\n  Now start the backend:")
    print("  uvicorn app.main:app --reload --port 8000\n")

finally:
    db.close()
