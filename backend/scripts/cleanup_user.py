"""
scripts/cleanup_user.py
=======================
Clean up user account, associated firm, sessions, and client CRM records by email/keyword.
Uses raw SQL via engine.connect() to avoid ORM mapper relationship dependencies.
Usage:
    python scripts/cleanup_user.py <email_or_keyword>
Example:
    python scripts/cleanup_user.py shweta
"""

import sys
import os

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import text
from app.core.database import engine
from app.services.otp_service import delete_registration_otp, delete_login_otp


def cleanup(keyword: str):
    keyword = keyword.strip().lower()
    if not keyword:
        print("[ERROR] Please provide an email or search keyword.")
        return

    pattern = f"%{keyword}%"
    print(f"[SEARCH] Searching for accounts and clients matching '{keyword}'...")

    with engine.connect() as conn:
        trans = conn.begin()
        try:
            # 1. Find all users matching keyword
            users = conn.execute(
                text("SELECT id, email, full_name, firm_id FROM users WHERE email ILIKE :pat OR full_name ILIKE :pat"),
                {"pat": pattern}
            ).fetchall()

            if not users:
                print(f"[INFO] No user accounts found matching '{keyword}'.")
            else:
                for u in users:
                    uid = str(u[0])
                    uemail = str(u[1])
                    ufullname = str(u[2])
                    ufirm_id = str(u[3]) if u[3] else None
                    print(f"[FOUND] User: {ufullname} ({uemail}) [ID: {uid}]")

                    # Clear OTP caches
                    try:
                        delete_registration_otp(uemail)
                        delete_login_otp(uemail)
                    except Exception:
                        pass

                    # Delete dependent records
                    conn.execute(text("DELETE FROM user_sessions WHERE user_id = :uid"), {"uid": uid})
                    conn.execute(text("DELETE FROM login_history WHERE user_id = :uid"), {"uid": uid})
                    try:
                        conn.execute(text("DELETE FROM audit_logs WHERE user_id = :uid"), {"uid": uid})
                    except Exception:
                        pass
                    try:
                        conn.execute(text("DELETE FROM drafts WHERE created_by = :uid"), {"uid": uid})
                    except Exception:
                        pass
                    try:
                        conn.execute(text("DELETE FROM cases WHERE primary_advocate_id = :uid"), {"uid": uid})
                    except Exception:
                        pass

                    # Delete user
                    conn.execute(text("DELETE FROM users WHERE id = :uid"), {"uid": uid})
                    print(f"   [DONE] Deleted user {uemail}")

                    # If firm has no other users, clean up firm and subscription
                    if ufirm_id:
                        remaining_users = conn.execute(
                            text("SELECT count(*) FROM users WHERE firm_id = :fid"),
                            {"fid": ufirm_id}
                        ).scalar()
                        if remaining_users == 0:
                            try:
                                conn.execute(text("DELETE FROM tenant_subscriptions WHERE firm_id = :fid"), {"fid": ufirm_id})
                            except Exception:
                                pass
                            conn.execute(text("DELETE FROM firms WHERE id = :fid"), {"fid": ufirm_id})
                            print(f"   [DONE] Deleted firm ID {ufirm_id}")

            # 2. Find and delete CRM Clients matching keyword
            clients = conn.execute(
                text("SELECT id, name, email FROM clients WHERE email ILIKE :pat OR name ILIKE :pat"),
                {"pat": pattern}
            ).fetchall()

            if not clients:
                print(f"[INFO] No CRM clients found matching '{keyword}'.")
            else:
                for cl in clients:
                    cid = str(cl[0])
                    cname = str(cl[1])
                    cemail = str(cl[2])
                    print(f"[FOUND] CRM Client: {cname} ({cemail}) [ID: {cid}]")
                    try:
                        conn.execute(text("DELETE FROM documents WHERE client_id = :cid"), {"cid": cid})
                    except Exception:
                        pass
                    try:
                        conn.execute(text("DELETE FROM cases WHERE client_id = :cid"), {"cid": cid})
                    except Exception:
                        pass
                    conn.execute(text("DELETE FROM clients WHERE id = :cid"), {"cid": cid})
                    print(f"   [DONE] Deleted CRM client {cname}")

            trans.commit()
            print("\n[SUCCESS] Cleanup finished successfully! All matching user accounts, sessions, and CRM clients were deleted.")

        except Exception as e:
            trans.rollback()
            print(f"[ERROR] Error during cleanup: {e}")


if __name__ == "__main__":
    kw = sys.argv[1] if len(sys.argv) > 1 else "shweta"
    cleanup(kw)
