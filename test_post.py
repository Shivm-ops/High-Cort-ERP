import sys
import os
import json
sys.path.append(os.path.abspath("backend"))

from fastapi.testclient import TestClient
from backend.main import app
from app.core.database import SessionLocal
from app.models.user import User
from app.models.case import Case
from app.core.security import create_access_token

client = TestClient(app)
db = SessionLocal()

user = db.query(User).first()
if not user:
    print("No user found")
    sys.exit(1)

access_token = create_access_token(data={"sub": user.email})
headers = {"Authorization": f"Bearer {access_token}"}

case = db.query(Case).first()
if not case:
    print("No case found")
    sys.exit(1)

payload = {
    "title": "CASE",
    "description": "TEST",
    "priority": "medium",
    "task_type": "other",
    "deadline": "2026-07-18",
    "assignee_id": str(user.id)
}

response = client.post(f"/api/v1/cases/{case.id}/tasks", json=payload, headers=headers)
print("Status Code:", response.status_code)
print("Response:", response.json())
