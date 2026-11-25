"""
Helper script to verify, create, or reset password for an advocate user.
Requires TARGET_EMAIL and TARGET_PASSWORD environment variables.
"""
import os
from datetime import datetime, timedelta
from sqlalchemy import func

from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.firm import Firm
from app.models.security import UserSession
from app.models.subscription import SubscriptionPlan, TenantSubscription, SubscriptionStatus
from app.models.user import User, UserRole
from app.services.tenant_domain import allocate_unique_subdomain


def check_and_fix_user(email: str, password: str, name: str = "Advocate User"):
    db = SessionLocal()
    try:
        clean_email = email.lower().strip()
        user = db.query(User).filter(func.lower(User.email) == clean_email).first()

        if user:
            user.hashed_password = get_password_hash(password)
            user.is_active = True
            user.is_verified = True
            user.failed_login_attempts = 0
            user.locked_until = None
            db.query(UserSession).filter(UserSession.user_id == user.id).update({"is_active": False})
            db.commit()
            print(f"SUCCESS: Password updated and active sessions revoked for {user.email}.")
        else:
            firm_name = f"{name}'s Practice"
            firm = Firm(
                name=firm_name,
                type="INDIVIDUAL",
                is_active=True,
                subdomain=allocate_unique_subdomain(db, firm_name),
            )
            db.add(firm)
            db.flush()

            trial_plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.tier == "free_trial").first()
            if trial_plan:
                sub = TenantSubscription(
                    firm_id=firm.id,
                    plan_id=trial_plan.id,
                    status=SubscriptionStatus.ACTIVE,
                    end_date=datetime.utcnow() + timedelta(days=14),
                )
                db.add(sub)

            new_user = User(
                email=clean_email,
                hashed_password=get_password_hash(password),
                full_name=name,
                user_type=UserRole.ADMIN,
                firm_id=firm.id,
                is_active=True,
                is_verified=True,
                failed_login_attempts=0,
                locked_until=None,
            )
            db.add(new_user)
            db.commit()
            print(f"SUCCESS: Created active account '{clean_email}'.")
    except Exception as e:
        db.rollback()
        print(f"ERROR: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    env_email = (os.environ.get("TARGET_EMAIL") or "").strip()
    env_password = os.environ.get("TARGET_PASSWORD") or ""
    env_name = (os.environ.get("TARGET_NAME") or "Advocate User").strip()
    if not env_email or len(env_password) < 8:
        raise SystemExit("Usage: set TARGET_EMAIL and TARGET_PASSWORD (min 8 chars) env vars.")
    check_and_fix_user(email=env_email, password=env_password, name=env_name)
