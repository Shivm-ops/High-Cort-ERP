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
import uuid

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash


def setup_superadmin(email: str = "admin@fastcase.in", password: str = "Admin@Fastcase2026!"):
    db = SessionLocal()
    clean_email = email.lower().strip()
    try:
        user = db.query(User).filter(User.email.ilike(clean_email)).first()
        if user:
            user.hashed_password = get_password_hash(password)
            user.is_superadmin = True
            user.is_active = True
            user.is_verified = True
            user.user_type = UserRole.ADMIN
            user.full_name = "Fastcase Super Admin"
            db.commit()
            print(f"SUCCESS: Super Admin account '{clean_email}' successfully updated.")
            print(f"Password reset to: '{password}'")
            print(f"Superadmin privileges confirmed: is_superadmin=True, is_active=True")
        else:
            new_admin = User(
                id=uuid.uuid4(),
                email=clean_email,
                hashed_password=get_password_hash(password),
                full_name="Fastcase Super Admin",
                user_type=UserRole.ADMIN,
                is_superadmin=True,
                is_active=True,
                is_verified=True,
            )
            db.add(new_admin)
            db.commit()
            print(f"SUCCESS: New Super Admin account '{clean_email}' successfully created.")
            print(f"Password set to: '{password}'")
            print(f"Superadmin privileges confirmed: is_superadmin=True, is_active=True")
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
