import uuid
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.core.database import SessionLocal
from app.models.user import User
from app.models.firm import Firm

db = SessionLocal()
priyanka = db.query(User).filter(User.full_name == "Priyanka").first()
if priyanka:
    new_firm = Firm(
        name="Priyanka's Practice",
        type="INDIVIDUAL",
        phone=priyanka.phone,
        is_active=True
    )
    db.add(new_firm)
    db.flush()
    priyanka.firm_id = new_firm.id
    db.commit()
    print("Fixed Priyanka's firm_id.")
else:
    print("Priyanka not found.")
db.close()
