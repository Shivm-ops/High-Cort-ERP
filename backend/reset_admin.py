import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

db = SessionLocal()
admin = db.query(User).filter(User.email == "admin@lagalos.in").first()
if admin:
    admin.hashed_password = get_password_hash("lagalos@2025")
    admin.failed_login_attempts = 0
    admin.locked_until = None
    db.commit()
    print("Admin unlocked and password reset successfully")
else:
    print("Admin not found")
db.close()
