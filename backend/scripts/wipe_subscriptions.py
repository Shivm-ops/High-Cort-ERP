import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.sql import text
from app.core.database import SessionLocal

def wipe_subs():
    db = SessionLocal()
    try:
        db.execute(text("DELETE FROM payment_transactions"))
        db.execute(text("DELETE FROM tenant_subscriptions"))
        db.commit()
        print("Wiped dummy subscriptions and payments")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    wipe_subs()
