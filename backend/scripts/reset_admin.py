import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.sql import text
from app.core.database import SessionLocal
from app.core.security import get_password_hash

def reset_admin():
    db = SessionLocal()
    try:
        pw_hash = get_password_hash("admin123")
        res = db.execute(text("UPDATE users SET hashed_password = :h WHERE email = 'admin@lagalos.in'"), {"h": pw_hash})
        db.commit()
        print(f"Updated {res.rowcount} admin user passwords to 'admin123'.")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reset_admin()
