"""
Script to test login and logout email notifications.
Usage:
    python backend/scripts/test_auth_notifications.py [optional_recipient_email]
"""

import asyncio
import sys
import os
import logging
from datetime import datetime, timezone

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Configure logging to console
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

from app.services.email_service import send_login_notification, send_logout_notification
from app.core.config import settings


async def main():
    recipient = sys.argv[1] if len(sys.argv) > 1 else "test_user@example.com"
    
    print("=" * 60)
    print("FASTCASE ERP — AUTH EMAIL NOTIFICATION TEST")
    print("=" * 60)
    print(f"Target Email Recipient: {recipient}")
    print(f"Azure Connection String: {'Configured' if settings.AZURE_COMMUNICATION_CONNECTION_STRING else 'Not set'}")
    print(f"SMTP Host: {settings.SMTP_HOST or 'Not set'}")
    print(f"SMTP From Address: {settings.SMTP_FROM_EMAIL} ({settings.SMTP_FROM_NAME})")
    print("-" * 60)
    
    # 1. Test Login Notification
    print("\n[1/2] Sending test Login notification email...")
    await send_login_notification(
        to_email=recipient,
        full_name="Advocate Vikram Sharma",
        ip_address="103.24.188.42",
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0 Safari/537.36",
        login_time=datetime.now(timezone.utc),
    )
    print("[OK] Login notification dispatched successfully!")

    # 2. Test Logout Notification
    print("\n[2/2] Sending test Logout notification email...")
    await send_logout_notification(
        to_email=recipient,
        full_name="Advocate Vikram Sharma",
        ip_address="103.24.188.42",
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0 Safari/537.36",
        logout_time=datetime.now(timezone.utc),
    )
    print("[OK] Logout notification dispatched successfully!")

    print("\n" + "=" * 60)
    print("Test completed successfully.")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
