import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.core.database import SessionLocal
from app.models.case_law import CaseLaw

db = SessionLocal()
cls = db.query(CaseLaw).filter(CaseLaw.title == "ABC vs XYZ").all()
if cls:
    for cl in cls:
        db.delete(cl)
    db.commit()
    print(f"Deleted {len(cls)} ABC vs XYZ case law(s).")
else:
    print("ABC vs XYZ not found.")
db.close()
