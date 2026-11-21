"""
Fastcase Super Admin Setup & Verification Script
Usage:
    python scripts/setup_superadmin.py [email] [password]
"""

import sys
import os

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy.sql import text
from app.core.database import SessionLocal
from app.core.security import get_password_hash


def setup_superadmin(email: str = "admin@fastcase.in", password: str = "Admin@Fastcase2026!"):
    db = SessionLocal()
    clean_email = email.lower().strip()
    pw_hash = get_password_hash(password)

    try:
        # Check if user already exists
        existing = db.execute(
            text("SELECT id, email, user_type, is_superadmin, is_active FROM users WHERE lower(email) = lower(:e)"),
            {"e": clean_email}
        ).fetchone()

        if existing:
            # Update password, unlock account, grant superadmin
            db.execute(
                text("""
                    UPDATE users 
                    SET hashed_password = :h, 
                        is_superadmin = true, 
                        is_active = true, 
                        is_verified = true,
                        failed_login_attempts = 0,
                        locked_until = NULL
                    WHERE lower(email) = lower(:e)
                """),
                {"h": pw_hash, "e": clean_email}
            )
            db.commit()
            print(f"✓ SUCCESS: Updated existing account '{clean_email}'.")
            print(f"✓ Password reset to: '{password}'")
            print(f"✓ Account unlocked & superadmin privileges active.")
        else:
            # Discover exact PostgreSQL userrole enum values to prevent InvalidTextRepresentation
            try:
                enum_rows = db.execute(
                    text("SELECT enumlabel FROM pg_enum WHERE enumtypid = 'userrole'::regtype")
                ).fetchall()
                valid_roles = [r[0] for r in enum_rows]
                role_val = "ADMIN" if "ADMIN" in valid_roles else ("admin" if "admin" in valid_roles else valid_roles[0])
            except Exception:
                role_val = "ADMIN"

            db.execute(
                text("""
                    INSERT INTO users (
                        id, email, hashed_password, full_name, user_type, 
                        is_superadmin, is_active, is_verified, failed_login_attempts, created_at, updated_at
                    )
                    VALUES (
                        gen_random_uuid(), lower(:e), :h, 'Fastcase Super Admin', :role, 
                        true, true, true, 0, NOW(), NOW()
                    )
                """),
                {"h": pw_hash, "e": clean_email, "role": role_val}
            )
            db.commit()
            print(f"✓ SUCCESS: Created new Super Admin account '{clean_email}'.")
            print(f"✓ Password set to: '{password}' (role: {role_val})")

        # Print all active superadmins in the database for confirmation
        admins = db.execute(
            text("SELECT email, is_superadmin, is_active, user_type FROM users WHERE is_superadmin = true")
        ).fetchall()
        print("\n--- Verified Super Admins in Database ---")
        for a in admins:
            print(f"  • Email: {a[0]} | is_superadmin: {a[1]} | is_active: {a[2]} | user_type: {a[3]}")
        print("-----------------------------------------\n")

    except Exception as e:
        db.rollback()
        print(f"ERROR: Failed to configure superadmin account: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    target_email = sys.argv[1] if len(sys.argv) > 1 else "admin@fastcase.in"
    target_password = sys.argv[2] if len(sys.argv) > 2 else "Admin@Fastcase2026!"
    setup_superadmin(target_email, target_password)
