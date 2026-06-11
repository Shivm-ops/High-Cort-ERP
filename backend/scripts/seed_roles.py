import sys
import os
import uuid
import json
from datetime import datetime

# Add backend dir to pythonpath
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.orm import Session
from sqlalchemy.sql import text
from app.core.database import SessionLocal

def seed_roles():
    db = SessionLocal()
    try:
        roles = [
            {"name": "Admin", "desc": "Full system access.", "sys": True},
            {"name": "Firm Admin", "desc": "Tenant-level admin.", "sys": True},
            {"name": "Senior Advocate", "desc": "Partner level access.", "sys": True},
            {"name": "Associate Advocate", "desc": "Standard advocate access.", "sys": True},
            {"name": "Junior Advocate", "desc": "Restricted advocate access.", "sys": True},
            {"name": "Clerk", "desc": "Data entry and scheduling.", "sys": True},
            {"name": "Paralegal", "desc": "Document drafting and research.", "sys": True},
            {"name": "Client Portal User", "desc": "Read-only case updates.", "sys": True},
        ]
        
        for r in roles:
            # Check if exists
            result = db.execute(text("SELECT id FROM roles WHERE name = :name"), {"name": r["name"]}).fetchone()
            if not result:
                perms = json.dumps({"view_cases": True, "create_cases": r["name"] != "Client Portal User"})
                db.execute(text("""
                    INSERT INTO roles (id, name, description, is_system, permissions, created_at) 
                    VALUES (:id, :name, :description, :is_system, :permissions, :created_at)
                """), {
                    "id": str(uuid.uuid4()),
                    "name": r["name"],
                    "description": r["desc"],
                    "is_system": r["sys"],
                    "permissions": perms,
                    "created_at": datetime.utcnow()
                })
        db.commit()
        print("Successfully seeded platform roles.")
    except Exception as e:
        print(f"Error seeding roles: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_roles()
