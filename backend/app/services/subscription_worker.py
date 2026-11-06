"""
app/services/subscription_worker.py
===================================
Automated Background Cron Worker for Subscription Lifecycle & Renewal Alerts:
- Runs periodically in the FastAPI lifespan.
- Detects upcoming expiries (7 days, 3 days, today).
- Enforces 3-day grace period for unpaid/failed renewals.
- Automatically suspends delinquent accounts after grace period.
- Dispatches branded email notifications via Brevo (Fastcase ERP <support@fastcase.in>).
"""

import asyncio
import logging
from datetime import datetime, date, timedelta
from app.core.database import SessionLocal
from app.models.subscription import TenantSubscription, SubscriptionStatus
from app.models.user import User
from app.services.subscription_emails import (
    send_renewal_reminder_email,
    send_grace_period_email,
    send_subscription_expired_email,
)

logger = logging.getLogger("subscription_worker")


async def check_and_dispatch_subscription_reminders():
    """Inspect all tenant subscriptions and dispatch automated lifecycle emails."""
    try:
        today = date.today()
        with SessionLocal() as db:
            subs = db.query(TenantSubscription).all()
            for sub in subs:
                if not sub.end_date:
                    continue

                end_d = sub.end_date.date() if isinstance(sub.end_date, datetime) else sub.end_date
                days_left = (end_d - today).days

                # Find firm primary advocate / owner to notify
                primary_user = db.query(User).filter(
                    User.firm_id == sub.firm_id,
                    User.is_active.is_(True),
                ).first()

                if not primary_user or not primary_user.email:
                    continue

                user_name = primary_user.full_name or "Advocate"
                plan_name = sub.plan.name if sub.plan else "Chambers Plan"
                reminder_tracker = getattr(sub, "last_reminder_type", None)

                # ── 1. Upcoming Expiry Reminders (7 Days & 3 Days) ────────────────
                if days_left == 7 and reminder_tracker != "7_days":
                    await send_renewal_reminder_email(
                        user_email=primary_user.email,
                        user_name=user_name,
                        plan_name=plan_name,
                        days_left=7,
                        expiry_date=sub.end_date,
                    )
                    sub.last_reminder_type = "7_days"
                    db.commit()
                    logger.info(f"Dispatched 7-day renewal reminder to {primary_user.email}")

                elif days_left == 3 and reminder_tracker != "3_days":
                    await send_renewal_reminder_email(
                        user_email=primary_user.email,
                        user_name=user_name,
                        plan_name=plan_name,
                        days_left=3,
                        expiry_date=sub.end_date,
                    )
                    sub.last_reminder_type = "3_days"
                    db.commit()
                    logger.info(f"Dispatched 3-day urgent renewal reminder to {primary_user.email}")

                elif days_left == 0 and reminder_tracker != "0_days":
                    await send_renewal_reminder_email(
                        user_email=primary_user.email,
                        user_name=user_name,
                        plan_name=plan_name,
                        days_left=0,
                        expiry_date=sub.end_date,
                    )
                    sub.last_reminder_type = "0_days"
                    db.commit()
                    logger.info(f"Dispatched day-of expiry alert to {primary_user.email}")

                # ── 2. Grace Period Management (Overdue 1 to 3 Days) ─────────────
                elif -3 <= days_left < 0:
                    grace_days_remaining = 3 - abs(days_left)
                    if sub.status != SubscriptionStatus.PAST_DUE:
                        sub.status = SubscriptionStatus.PAST_DUE
                        db.commit()

                    if reminder_tracker != "grace_period":
                        await send_grace_period_email(
                            user_email=primary_user.email,
                            user_name=user_name,
                            plan_name=plan_name,
                            grace_days_left=max(1, grace_days_remaining),
                        )
                        sub.last_reminder_type = "grace_period"
                        db.commit()
                        logger.info(f"Dispatched grace period alert to {primary_user.email}")

                # ── 3. Grace Period Exceeded -> Automatic Suspension ──────────────
                elif days_left < -3:
                    if sub.status != SubscriptionStatus.EXPIRED:
                        sub.status = SubscriptionStatus.EXPIRED
                        sub.last_reminder_type = "expired"
                        db.commit()

                        await send_subscription_expired_email(
                            user_email=primary_user.email,
                            user_name=user_name,
                            plan_name=plan_name,
                        )
                        logger.info(f"Suspended expired subscription for firm {sub.firm_id} & notified {primary_user.email}")

    except Exception as exc:
        logger.error(f"Error executing subscription reminder cron: {exc}", exc_info=True)


async def subscription_lifecycle_cron_worker():
    """Background loop running every 6 hours."""
    # Delay initial check 45s on boot to let DB warm up
    await asyncio.sleep(45)
    while True:
        try:
            logger.info("⏰ Checking subscription lifecycles & renewal notices...")
            await check_and_dispatch_subscription_reminders()
            # Sleep 6 hours (21600 seconds)
            await asyncio.sleep(21600)
        except asyncio.CancelledError:
            break
        except Exception as exc:
            logger.error(f"Subscription worker loop error: {exc}", exc_info=True)
            await asyncio.sleep(600)
