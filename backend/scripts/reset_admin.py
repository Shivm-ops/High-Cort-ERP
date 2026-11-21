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
        res = db.execute(
            text("""
                UPDATE users 
                SET hashed_password = :h, is_superadmin = true, is_active = true, is_verified = true, user_type = 'admin' 
                WHERE lower(email) = lower(:e)
            """),
            {"h": pw_hash, "e": clean_email}
        )
        db.commit()
        if res.rowcount > 0:
            print(f"SUCCESS: Reset password for {clean_email} to '{password}' (is_superadmin=True).")
        else:
            db.execute(
                text("""
                    INSERT INTO users (
                        id, email, hashed_password, full_name, user_type, is_superadmin, is_active, is_verified, created_at, updated_at
                    )
                    VALUES (
                        gen_random_uuid(), lower(:e), :h, 'Fastcase Super Admin', 'admin', true, true, true, NOW(), NOW()
                    )
                """),
                {"h": pw_hash, "e": clean_email}
            )
            db.commit()
            print(f"SUCCESS: Created superadmin {clean_email} with password '{password}'.")
    except Exception as e:
        print(f"ERROR: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    target_email = sys.argv[1] if len(sys.argv) > 1 else "admin@fastcase.in"
    target_password = sys.argv[2] if len(sys.argv) > 2 else "Admin@Fastcase2026!"
    reset_admin(target_email, target_password)
