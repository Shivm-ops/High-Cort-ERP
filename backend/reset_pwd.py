from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

db = SessionLocal()
user = db.query(User).filter(User.email == "priyanka@lagalos.in").first()
if user:
    user.hashed_password = get_password_hash("lagalos@2025")
    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()
    print("Password reset successfully for priyanka@lagalos.in")
else:
    print("User not found")
