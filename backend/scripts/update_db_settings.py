import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.sql import text
from app.core.database import SessionLocal

def update_settings():
    db = SessionLocal()
    try:
        res = db.execute(text("UPDATE system_settings SET value = REPLACE(value, 'LegalOS', 'Fastcase'), description = REPLACE(description, 'LegalOS', 'Fastcase') WHERE value LIKE '%LegalOS%' OR description LIKE '%LegalOS%'"))
        db.commit()
        print(f"Successfully updated system settings. Rows affected: {res.rowcount}")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    update_settings()
