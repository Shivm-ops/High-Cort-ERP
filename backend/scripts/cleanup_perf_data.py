import sys
import os

# Add backend dir to pythonpath
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.sql import text
from app.core.database import SessionLocal

def cleanup_data():
    db = SessionLocal()
    try:
        print("Starting cleanup of performance and test data...")
        
        # We delete by matching the patterns used in seed_performance.py
        # Delete Documents
        res = db.execute(text("DELETE FROM documents WHERE name LIKE 'Evidence_%.pdf'"))
        db.commit()
        print(f"Deleted {res.rowcount} dummy documents.")
        
        # Delete Cases
        res = db.execute(text("DELETE FROM cases WHERE case_no LIKE 'PERF-CASE-%'"))
        db.commit()
        print(f"Deleted {res.rowcount} dummy cases.")
        
        # Delete Clients
        res = db.execute(text("DELETE FROM clients WHERE name LIKE 'Perf Client %'"))
        db.commit()
        print(f"Deleted {res.rowcount} dummy clients.")
        
        print("✅ Cleanup complete! The database is now ready for production.")
    except Exception as e:
        print(f"Error during cleanup: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    cleanup_data()
