import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.database import SessionLocal
import app.models.user
import app.models.case
import app.models.firm
import app.models.document
import app.models.subscription
from app.models.user import User

db = SessionLocal()
users = db.query(User).all()
for u in users:
    print(u.email, u.is_superadmin, u.hashed_password[:10])
