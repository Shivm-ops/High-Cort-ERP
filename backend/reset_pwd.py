import os

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
    user = db.query(User).filter(func.lower(User.email) == target_email).first()
    if user:
        user.hashed_password = get_password_hash(new_password)
        user.failed_login_attempts = 0
        user.locked_until = None
        db.query(UserSession).filter(UserSession.user_id == user.id).update({"is_active": False})
        db.commit()
        print(f"Password updated and sessions revoked for {user.email}")
    else:
        print("User not found")
finally:
    db.close()
