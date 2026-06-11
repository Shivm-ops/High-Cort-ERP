import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.sql import text
from app.core.database import SessionLocal

def alter_db():
    db = SessionLocal()
    try:
        db.execute(text("ALTER TABLE firms ADD COLUMN email VARCHAR(255)"))
        db.execute(text("ALTER TABLE firms ADD COLUMN phone VARCHAR(20)"))
        db.commit()
        print("Table altered successfully")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    alter_db()
