"""
Quick test script to verify live Brevo / SMTP configuration.
Usage:
    python test_send_email.py your_email@example.com
"""

import sys
import asyncio
from datetime import datetime, timezone
from app.core.config import settings
from app.services.email_service import send_new_device_login_alert, send_otp_verification_email

async def main():
    if len(sys.argv) < 2:
        print("Usage: python test_send_email.py <recipient_email>")
        sys.exit(1)

    target_email = sys.argv[1].strip()
    recipient_name = sys.argv[2].strip() if len(sys.argv) > 2 else "Advocate Sharma"

    print(f"[*] Testing Full Fastcase Email Lifecycle for: {target_email} ({recipient_name})")
    print(f"[*] SMTP Host : {settings.SMTP_HOST}")
    print(f"[*] SMTP Port : {settings.SMTP_PORT}")
    print(f"[*] SMTP User : {settings.SMTP_USERNAME}")
    print(f"[*] From Email: {settings.SMTP_FROM_EMAIL}")

    if not settings.SMTP_HOST or "REPLACE_WITH" in (settings.SMTP_USERNAME or ""):
        print("\n[!] Please update SMTP credentials in backend/.env first.")
        sys.exit(1)

    print("\n--------------------------------------------------------------")
    print("[Stage 1/3] Sending OTP Verification Code (Registration Flow)...")
    await send_otp_verification_email(
        to_email=target_email,
        otp_code="784912",
        user_name=recipient_name,
        expiry_minutes=10,
    )
    print("  -> Delivered: 'Secure Verification Code for Your Account'")

    print("\n[Stage 2/3] Sending Welcome & Subscription Activation Email...")
    from app.services.email_service import send_welcome_subscription_email
    await send_welcome_subscription_email(
        to_email=target_email,
        user_name=recipient_name,
        plan_name="Chambers Workspace",
        dashboard_url="https://app.fastcase.in/login",
    )
    print("  -> Delivered: 'Welcome to Fastcase — Your Legal Practice Platform is Ready'")

    print("\n[Stage 3/3] Sending New Device Sign-in Security Alert...")
    await send_new_device_login_alert(
        to_email=target_email,
        user_name=recipient_name,
        ip_address="103.211.54.12",
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0",
        location="New Delhi, Delhi, India",
        login_time=datetime.now(timezone.utc),
        reset_url="https://fastcase.in/reset-password",
    )
    print("  -> Delivered: 'New Sign-in Alert for Your Account'")

    print("\n==============================================================")
    print(f"[SUCCESS] All 3 emails successfully dispatched to: {target_email}!")
    print("Please check your inbox to view how they look on mobile & desktop.")
    print("==============================================================")

if __name__ == "__main__":
    asyncio.run(main())
