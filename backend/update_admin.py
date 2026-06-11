import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from app.core.database import SessionLocal
from app.models.user import User

db = SessionLocal()
admin = db.query(User).filter(User.email == "admin@lagalos.in").first()
if admin:
    admin.full_name = "SOSM SERVICES PVT LTD"
    db.commit()
    print("Updated admin name")
db.close()
