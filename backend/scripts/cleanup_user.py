"""
scripts/cleanup_user.py
=======================
Clean up user account, associated firm, sessions, and client CRM records by email/keyword.
Usage:
    python scripts/cleanup_user.py <email_or_keyword>
Example:
    python scripts/cleanup_user.py shweta
"""

import sys
import os

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal
from app.models.user import User
from app.models.firm import Firm
from app.models.security import UserSession, LoginHistory
from app.models.subscription import TenantSubscription
from app.models.case import Case
from app.models.client import Client
from app.models.draft import Draft
from app.models.document import Document
from app.services.otp_service import delete_registration_otp, delete_login_otp

try:
    from app.models.audit_log import AuditLog
except ImportError:
    AuditLog = None


def cleanup(keyword: str):
    keyword = keyword.strip().lower()
    if not keyword:
        print("Please provide an email or search keyword.")
        return

    db = SessionLocal()
    try:
        print(f"🔍 Searching for users matching '{keyword}'...")
        users = db.query(User).filter(
            (User.email.ilike(f"%{keyword}%")) | (User.full_name.ilike(f"%{keyword}%"))
        ).all()

        if not users:
            print(f"No user accounts found matching '{keyword}'.")
        else:
            for user in users:
                user_id = user.id
                user_email = user.email
                firm_id = user.firm_id
                print(f"🗑️ Deleting user: {user.full_name} ({user_email}) [ID: {user_id}]")

                # 1. Clear Redis / in-memory OTPs
                try:
                    delete_registration_otp(user_email)
                    delete_login_otp(user_email)
                except Exception as ex:
                    print(f"   (OTP cleanup note: {ex})")

                # 2. Delete user sessions & login history
                deleted_sessions = db.query(UserSession).filter(UserSession.user_id == user_id).delete(synchronize_session=False)
                deleted_history = db.query(LoginHistory).filter(LoginHistory.user_id == user_id).delete(synchronize_session=False)
                print(f"   - Removed {deleted_sessions} sessions, {deleted_history} login logs.")

                # 3. Clean audit logs
                if AuditLog:
                    try:
                        db.query(AuditLog).filter(AuditLog.user_id == user_id).delete(synchronize_session=False)
                    except Exception:
                        pass

                # 4. Remove drafts created by user
                try:
                    db.query(Draft).filter(Draft.created_by == user_id).delete(synchronize_session=False)
                except Exception:
                    pass

                # 5. Remove cases assigned
                try:
                    db.query(Case).filter(Case.primary_advocate_id == user_id).delete(synchronize_session=False)
                except Exception:
                    pass

                # 6. Delete user
                db.delete(user)
                db.commit()
                print(f"   ✓ User account {user_email} deleted.")

                # 7. If firm was created exclusively for this user, delete firm & subscription
                if firm_id:
                    other_users = db.query(User).filter(User.firm_id == firm_id).count()
                    if other_users == 0:
                        try:
                            db.query(TenantSubscription).filter(TenantSubscription.firm_id == firm_id).delete(synchronize_session=False)
                        except Exception:
                            pass
                        firm = db.query(Firm).filter(Firm.id == firm_id).first()
                        if firm:
                            db.delete(firm)
                            db.commit()
                            print(f"   ✓ Firm '{firm.name}' & subscription deleted.")

        # Also search and remove matching CRM Clients
        print(f"\n🔍 Searching for CRM Clients matching '{keyword}'...")
        clients = db.query(Client).filter(
            (Client.email.ilike(f"%{keyword}%")) | (Client.name.ilike(f"%{keyword}%"))
        ).all()

        if not clients:
            print(f"No CRM clients found matching '{keyword}'.")
        else:
            for cl in clients:
                cl_id = cl.id
                cl_name = cl.name
                cl_email = cl.email
                print(f"🗑️ Deleting CRM Client: {cl_name} ({cl_email})")
                try:
                    db.query(Document).filter(Document.client_id == cl_id).delete(synchronize_session=False)
                except Exception:
                    pass
                try:
                    db.query(Case).filter(Case.client_id == cl_id).delete(synchronize_session=False)
                except Exception:
                    pass
                db.delete(cl)
                db.commit()
                print(f"   ✓ CRM Client {cl_name} deleted.")

        print("\n✨ Cleanup finished! You can now register a brand new account with this email/username.")

    except Exception as e:
        db.rollback()
        print(f"❌ Error during cleanup: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    kw = sys.argv[1] if len(sys.argv) > 1 else "shweta"
    cleanup(kw)
