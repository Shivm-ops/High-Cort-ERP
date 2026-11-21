import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.sql import text
from app.core.database import SessionLocal
from app.core.security import get_password_hash

def reset_admin(email: str = "admin@fastcase.in", password: str = "Admin@Fastcase2026!"):
    db = SessionLocal()
    clean_email = email.lower().strip()
    pw_hash = get_password_hash(password)
    try:
        existing = db.execute(
            text("SELECT id, email, user_type, is_superadmin, is_active FROM users WHERE lower(email) = lower(:e)"),
            {"e": clean_email}
        ).fetchone()

        if existing:
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
            print(f"✓ Reset existing user: {clean_email}")
        else:
            try:
                enum_rows = db.execute(text("SELECT enumlabel FROM pg_enum WHERE enumtypid = 'userrole'::regtype")).fetchall()
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
            print(f"✓ Created superadmin: {clean_email}")

        admins = db.execute(text("SELECT email, is_superadmin, is_active FROM users WHERE is_superadmin = true")).fetchall()
        for a in admins:
            print(f"  • {a[0]} (is_superadmin={a[1]}, is_active={a[2]})")
    except Exception as e:
        print(f"ERROR: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reset_admin()
