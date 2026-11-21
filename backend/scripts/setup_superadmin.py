"""
Fastcase Super Admin Provisioning Script
Usage:
    python scripts/setup_superadmin.py [email] [password]

Defaults:
    email:    admin@fastcase.in
    password: Admin@Fastcase2026!
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
        # Use direct raw SQL to guarantee success without any ORM mapper initialization delays
        update_res = db.execute(
            text("""
                UPDATE users 
                SET hashed_password = :h, 
                    is_superadmin = true, 
                    is_active = true, 
                    is_verified = true,
                    user_type = 'admin'
                WHERE lower(email) = lower(:e)
            """),
            {"h": pw_hash, "e": clean_email}
        )
        db.commit()

        if update_res.rowcount > 0:
            print(f"SUCCESS: Super Admin account '{clean_email}' successfully updated.")
            print(f"Password reset to: '{password}'")
            print(f"Privileges verified: is_superadmin=True, is_active=True")
        else:
            # User doesn't exist yet, insert brand new superadmin
            db.execute(
                text("""
                    INSERT INTO users (
                        id, email, hashed_password, full_name, user_type, 
                        is_superadmin, is_active, is_verified, created_at, updated_at
                    )
                    VALUES (
                        gen_random_uuid(), lower(:e), :h, 'Fastcase Super Admin', 'admin', 
                        true, true, true, NOW(), NOW()
                    )
                """),
                {"h": pw_hash, "e": clean_email}
            )
            db.commit()
            print(f"SUCCESS: Brand new Super Admin account '{clean_email}' created.")
            print(f"Password set to: '{password}'")
            print(f"Privileges verified: is_superadmin=True, is_active=True")
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
