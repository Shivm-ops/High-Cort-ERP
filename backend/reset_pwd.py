from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

db = SessionLocal()
user = db.query(User).filter(User.email.in_(["priyanka@fastcase.in", "priyanka@lagalos.in"])).first()
if user:
    user.hashed_password = get_password_hash("Fastcase@2026!")
    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()
    print(f"Password reset successfully for {user.email}")
else:
    print("User not found")
