"""
Helper script to verify, create, or reset password for an advocate user.
Usage inside droplet:
    docker compose exec backend python fix_user.py
"""
import sys
from datetime import datetime
from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.models.firm import Firm
from app.models.subscription import SubscriptionPlan, TenantSubscription, SubscriptionStatus
from app.core.security import get_password_hash
from app.services.tenant_domain import allocate_unique_subdomain

def check_and_fix_user(email: str = "shwetajadhav2324@gmail.com", password: str = "@Shwetajadhav1", name: str = "Advocate Shweta Jadhav"):
    db = SessionLocal()
    try:
        clean_email = email.lower().strip()
        print(f"=== Checking database for user: {clean_email} ===")
        
        # 1. List all existing users in the system
        all_users = db.query(User).all()
        print(f"Total users found in database: {len(all_users)}")
        for u in all_users:
            print(f"  - ID: {u.id} | Email: {u.email} | Name: {u.full_name} | Active: {u.is_active}")

        # 2. Look for target user
        user = db.query(User).filter(User.email.ilike(clean_email)).first()
        
        if user:
            print(f"\nUser '{user.email}' exists! Resetting password to: {password}")
            user.hashed_password = get_password_hash(password)
            user.is_active = True
            user.is_verified = True
            user.failed_login_attempts = 0
            user.locked_until = None
            db.commit()
            print(f"SUCCESS: Password for {user.email} has been updated to '{password}'. You can now log in.")
        else:
            print(f"\nUser '{clean_email}' not found. Creating brand new active practice account...")
            firm_name = f"{name}'s Practice"
            firm = Firm(
                name=firm_name,
                type="INDIVIDUAL",
                is_active=True,
                subdomain=allocate_unique_subdomain(db, firm_name),
            )
            db.add(firm)
            db.flush()

            # Trial subscription
            trial_plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.tier == "free_trial").first()
            if trial_plan:
                sub = TenantSubscription(
                    firm_id=firm.id,
                    plan_id=trial_plan.id,
                    status=SubscriptionStatus.ACTIVE,
                    end_date=datetime.utcnow(),
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
            print(f"SUCCESS: Created new account '{clean_email}' with password '{password}'! You can now log in.")

    except Exception as e:
        db.rollback()
        print(f"ERROR: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    target_email = sys.argv[1] if len(sys.argv) > 1 else "shwetajadhav2324@gmail.com"
    check_and_fix_user(email=target_email)
