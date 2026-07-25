import sys
import os

# Add backend dir to path
sys.path.append(os.path.abspath("backend"))

from app.core.database import SessionLocal
from app.models.user import User
from app.models.case import Case
from app.models.case_advocate import CaseTask

db = SessionLocal()
tasks = db.query(CaseTask).order_by(CaseTask.created_at.desc()).limit(5).all()
for t in tasks:
    print(f"Task: {t.title}, Assignee: {t.assignee_id}, Status: {t.status}")
