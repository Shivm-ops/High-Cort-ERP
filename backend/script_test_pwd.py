from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import verify_password

db = SessionLocal()
user = db.query(User).filter(User.email.in_(["priyanka@fastcase.in", "priyanka@lagalos.in"])).first()
if user:
    pwd = "Fastcase@2026!"
    print("Hash:", user.hashed_password)
    print("Match:", verify_password(pwd, user.hashed_password))
else:
    print("User not found")
