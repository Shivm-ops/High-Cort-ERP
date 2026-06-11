import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.sql import text
from app.core.database import SessionLocal

def wipe_all():
    db = SessionLocal()
    try:
        print("Wiping all seed and mock data...")
        
        # We want to keep ONLY the Super Admin and system roles.
        # So we delete:
        # Documents, Drafts, Filings, Hearings, Orders, CaseAdvocate, CaseTask, Notes, Invoices
        tables = [
            "documents", "drafts", "filings", "court_orders", "hearings",
            "case_advocates", "case_tasks", "invoices", "witnesses", "parties",
            "audit_logs", "subscriptions", "payments", "kyc_records"
        ]
        
        for t in tables:
            try:
                db.execute(text(f"DELETE FROM {t}"))
            except Exception as e:
                db.rollback()
            
        # Then cases, clients
        try:
            db.execute(text("DELETE FROM cases"))
        except: db.rollback()
        try:
            db.execute(text("DELETE FROM clients"))
        except: db.rollback()
        
        # Delete all users EXCEPT superadmin
        # We check is_superadmin
        res = db.execute(text("DELETE FROM users WHERE is_superadmin = FALSE OR is_superadmin IS NULL"))
        print(f"Deleted {res.rowcount} non-admin users.")
        
        # Delete firms except the one tied to the superadmin
        superadmin = db.execute(text("SELECT firm_id FROM users WHERE is_superadmin = TRUE")).fetchone()
        if superadmin and superadmin[0]:
            db.execute(text("DELETE FROM firms WHERE id != :fid"), {"fid": superadmin[0]})
        else:
            db.execute(text("DELETE FROM firms"))
            
        db.commit()
        print("✅ Database successfully wiped clean. Ready for real production data.")
    except Exception as e:
        print(f"Error during wipe: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    wipe_all()
