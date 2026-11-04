"""
scripts/unlock_user.py
======================
Unlock an account locked out due to OTP attempts.
Usage:
    python scripts/unlock_user.py <email>
Example:
    python scripts/unlock_user.py shwetajadhav2324@gmail.com
"""

import sys
import os

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.otp_service import unlock_account, is_account_locked


def unlock(email: str):
    email = email.strip().lower()
    if not email:
        print("[ERROR] Please provide an email address to unlock.")
        return

    is_locked, secs, human_str = is_account_locked(email)
    if not is_locked:
        print(f"[INFO] Account '{email}' is not currently locked.")
    else:
        print(f"[STATUS] Account '{email}' is locked (remaining: {human_str}). Unlocking now...")

    unlock_account(email)
    print(f"[SUCCESS] Account '{email}' has been successfully unlocked. OTP cache cleared.")


if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "shwetajadhav2324@gmail.com"
    unlock(target)

