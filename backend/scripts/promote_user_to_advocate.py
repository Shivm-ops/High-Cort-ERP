"""
Script to promote a user (e.g. Shweta Jadhav / 7218834640) from citizen to advocate / senior_advocate.
Usage:
    python scripts/promote_user_to_advocate.py [phone_or_email]
"""

import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy.sql import text
from app.core.database import SessionLocal


def promote_user(query_target: str = "7218834640"):
    db = SessionLocal()
    clean_target = query_target.strip().lower()
    phone_digits = "".join(filter(str.isdigit, clean_target))
    phone_10 = phone_digits[-10:] if len(phone_digits) >= 10 else clean_target

    try:
        # Check valid userrole enum values
        try:
            enum_rows = db.execute(
                text("SELECT enumlabel FROM pg_enum WHERE enumtypid = 'userrole'::regtype")
            ).fetchall()
            valid_roles = [r[0] for r in enum_rows]
        except Exception:
            valid_roles = ["senior_advocate", "associate_advocate", "admin", "SENIOR_ADVOCATE", "ASSOCIATE_ADVOCATE", "ADMIN"]

        # Pick best role
        target_role = None
        for cand in ["senior_advocate", "SENIOR_ADVOCATE", "associate_advocate", "ASSOCIATE_ADVOCATE", "admin", "ADMIN"]:
            if cand in valid_roles:
                target_role = cand
                break
        if not target_role:
            target_role = valid_roles[0]

        # Find user
        user = db.execute(
            text("""
                SELECT id, email, full_name, user_type, phone, firm_id
                FROM users 
                WHERE phone LIKE :p OR lower(email) LIKE :e OR lower(full_name) LIKE :n
                LIMIT 1
            """),
            {"p": f"%{phone_10}%", "e": f"%{clean_target}%", "n": "%shweta%"}
        ).fetchone()

        if not user:
            print(f"[!] No user found matching target '{query_target}'.")
            return

        user_id = user[0]
        user_email = user[1]
        user_name = user[2]
        current_role = user[3]
        user_phone = user[4]
        current_firm = user[5]

        print(f"[*] Found User: {user_name} ({user_email}, Phone: {user_phone})")
        print(f"[*] Current user_type: {current_role}")

        # Ensure firm exists
        firm_id = current_firm
        if not firm_id:
            firm_row = db.execute(text("SELECT id FROM firms LIMIT 1")).fetchone()
            if firm_row:
                firm_id = firm_row[0]

        # Update role and firm
        db.execute(
            text("""
                UPDATE users
                SET user_type = :r::userrole,
                    firm_id = COALESCE(firm_id, :fid),
                    is_active = true,
                    is_verified = true
                WHERE id = :uid
            """),
            {"r": target_role, "fid": firm_id, "uid": user_id}
        )
        db.commit()

        updated = db.execute(
            text("SELECT id, email, full_name, user_type, phone, firm_id FROM users WHERE id = :uid"),
            {"uid": user_id}
        ).fetchone()

        print(f"[✓] SUCCESS: Promoted '{updated[2]}' ({updated[1]}) to user_type='{updated[3]}'.")
        print(f"[✓] Firm ID: {updated[5]}")

    except Exception as e:
        db.rollback()
        print(f"[!] Error promoting user: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "7218834640"
    promote_user(target)
