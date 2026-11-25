import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import func
from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.security import UserSession
from app.models.user import User

target_email = (os.environ.get("TARGET_EMAIL") or "").strip().lower()
new_password = os.environ.get("TARGET_PASSWORD") or ""
if not target_email or len(new_password) < 8:
    raise SystemExit("Usage: set TARGET_EMAIL and TARGET_PASSWORD (min 8 chars) env vars.")

db = SessionLocal()
try:
    admin = db.query(User).filter(func.lower(User.email) == target_email).first()
    if admin:
        admin.hashed_password = get_password_hash(new_password)
        admin.failed_login_attempts = 0
        admin.locked_until = None
        db.query(UserSession).filter(UserSession.user_id == admin.id).update({"is_active": False})
        db.commit()
        print(f"Account unlocked, password updated, and sessions revoked for {admin.email}")
    else:
        print("User not found")
finally:
    db.close()
