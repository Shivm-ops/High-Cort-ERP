"""
app/services/otp_service.py
===========================
Secure 6-digit OTP manager backed by Redis with in-memory TTL fallback.
Handles user registration verification and passwordless login OTP lifecycles.
Enforces:
  - 60-second OTP validity (1 minute TTL)
  - 3 attempts maximum
  - 12-hour account lockout on 3 failed attempts (43,200 seconds)
"""

import json
import secrets
import time
import logging
from typing import Optional, Dict, Any, Tuple
from app.core.config import settings

logger = logging.getLogger("otp_service")

# In-memory fallback stores if Redis is unavailable or in development
_memory_store: Dict[str, Dict[str, Any]] = {}
_memory_lockout: Dict[str, float] = {}

# Constants
DEFAULT_OTP_EXPIRY_SECONDS: int = 60          # 60 seconds (1 minute)
MAX_OTP_ATTEMPTS: int = 3                     # 3 attempts
LOCKOUT_DURATION_SECONDS: int = 12 * 3600     # 12 hours (43,200 seconds)


class OtpResult(tuple):
    """
    Subclass of tuple (is_valid, data) for 100% backward compatibility
    with existing unpacking: `is_valid, data = verify_and_clear_...()`
    while also exposing `.error_msg`, `.attempts_remaining`, and `.is_locked`.
    """
    is_valid: bool
    data: Optional[dict]
    error_msg: Optional[str]
    attempts_remaining: int
    is_locked: bool

    def __new__(
        cls,
        is_valid: bool,
        data: Optional[dict],
        error_msg: Optional[str] = None,
        attempts_remaining: int = 0,
        is_locked: bool = False,
    ):
        return super().__new__(cls, (is_valid, data))

    def __init__(
        self,
        is_valid: bool,
        data: Optional[dict],
        error_msg: Optional[str] = None,
        attempts_remaining: int = 0,
        is_locked: bool = False,
    ):
        self.is_valid = is_valid
        self.data = data
        self.error_msg = error_msg
        self.attempts_remaining = attempts_remaining
        self.is_locked = is_locked


def _get_redis():
    """Attempt connecting to Redis; return client or None."""
    try:
        import redis
        client = redis.from_url(settings.REDIS_URL, decode_responses=True, socket_connect_timeout=2)
        client.ping()
        return client
    except Exception as exc:
        logger.debug("Redis not reachable (%s), using in-memory store for OTP.", exc)
        return None


def generate_otp() -> str:
    """Generate a cryptographically secure 6-digit numeric OTP."""
    return f"{secrets.randbelow(900000) + 100000}"


def format_remaining_lockout(seconds: int) -> str:
    """Format remaining lockout seconds into human readable time."""
    if seconds <= 0:
        return "0 minutes"
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    if hours > 0:
        return f"{hours} hour{'s' if hours > 1 else ''} and {minutes} minute{'s' if minutes != 1 else ''}"
    return f"{max(1, minutes)} minute{'s' if minutes != 1 else ''}"


# ── 12-Hour Account Lockout Management ────────────────────────────────────────

def is_account_locked(email: str) -> Tuple[bool, int, str]:
    """
    Check if an email is currently locked out for 12 hours after 3 failed OTP attempts.
    Returns: (is_locked, remaining_seconds, human_readable_time)
    """
    clean_email = email.lower().strip()
    key = f"otp_lockout:{clean_email}"

    client = _get_redis()
    if client:
        try:
            ttl = client.ttl(key)
            if ttl and ttl > 0:
                return True, ttl, format_remaining_lockout(ttl)
        except Exception as exc:
            logger.warning("Failed checking lockout in Redis: %s", exc)

    locked_until = _memory_lockout.get(clean_email, 0)
    now = time.time()
    if locked_until > now:
        remaining = int(locked_until - now)
        return True, remaining, format_remaining_lockout(remaining)
    elif clean_email in _memory_lockout:
        _memory_lockout.pop(clean_email, None)

    return False, 0, ""


def lock_account(email: str, duration_seconds: int = LOCKOUT_DURATION_SECONDS) -> None:
    """Lock an account for duration_seconds (12 hours) after 3 failed OTP attempts."""
    clean_email = email.lower().strip()
    key = f"otp_lockout:{clean_email}"

    client = _get_redis()
    if client:
        try:
            client.set(key, "locked", ex=duration_seconds)
        except Exception as exc:
            logger.warning("Failed setting lockout in Redis: %s", exc)

    _memory_lockout[clean_email] = time.time() + duration_seconds
    logger.warning("ACCOUNT LOCKED: %s locked for 12 hours (%d seconds) due to 3 failed OTP attempts.", clean_email, duration_seconds)


def unlock_account(email: str) -> None:
    """Manually unlock an account and clear lockout and OTP cache."""
    clean_email = email.lower().strip()
    key = f"otp_lockout:{clean_email}"

    client = _get_redis()
    if client:
        try:
            client.delete(key)
        except Exception:
            pass

    _memory_lockout.pop(clean_email, None)
    delete_registration_otp(clean_email)
    delete_login_otp(clean_email)
    logger.info("ACCOUNT UNLOCKED: %s has been manually unlocked.", clean_email)


# ── Registration OTP (60s expiry, max 3 attempts, 12h lockout) ────────────────

def store_registration_otp(
    email: str,
    reg_data: dict,
    otp: str,
    expiry_seconds: int = DEFAULT_OTP_EXPIRY_SECONDS,
) -> None:
    """Store pending registration data with 6-digit OTP (default 60 seconds)."""
    clean_email = email.lower().strip()
    key = f"reg_otp:{clean_email}"
    payload = {
        "otp": str(otp).strip(),
        "data": reg_data,
        "expires_at": time.time() + expiry_seconds,
        "attempts": 0,
        "max_attempts": MAX_OTP_ATTEMPTS,
    }

    # Prominent log for dev and server debugging
    logger.info("[REGISTRATION OTP] Code for %s is: %s (valid for %ds)", clean_email, otp, expiry_seconds)
    print(f"[REGISTRATION OTP] Code for {clean_email} is: {otp} (valid for {expiry_seconds}s)", flush=True)

    client = _get_redis()
    if client:
        try:
            client.set(key, json.dumps(payload), ex=expiry_seconds)
            return
        except Exception as exc:
            logger.warning("Failed writing OTP to Redis: %s. Using memory fallback.", exc)

    _memory_store[key] = payload


def get_registration_otp_payload(email: str) -> Optional[dict]:
    """Retrieve active registration payload for an email if valid and not expired."""
    clean_email = email.lower().strip()
    key = f"reg_otp:{clean_email}"

    client = _get_redis()
    if client:
        try:
            val = client.get(key)
            if val:
                return json.loads(val)
        except Exception as exc:
            logger.warning("Failed reading OTP from Redis: %s", exc)

    item = _memory_store.get(key)
    if item:
        if time.time() > item.get("expires_at", 0):
            _memory_store.pop(key, None)
            return None
        return item

    return None


def verify_and_clear_registration_otp(
    email: str,
    otp: str,
    max_attempts: int = MAX_OTP_ATTEMPTS,
) -> OtpResult:
    """
    Verify submitted OTP against stored OTP with 3-attempt limit.
    If 3 failed attempts are reached, locks the account for 12 hours.
    Returns: OtpResult (is_valid, reg_data, error_msg, attempts_remaining, is_locked)
    """
    clean_email = email.lower().strip()

    # 1. Check if already locked out
    locked, remaining_secs, time_str = is_account_locked(clean_email)
    if locked:
        return OtpResult(
            False,
            None,
            f"Account is locked for 12 hours due to 3 failed attempts. Please try again after {time_str}.",
            0,
            is_locked=True,
        )

    key = f"reg_otp:{clean_email}"
    payload = get_registration_otp_payload(clean_email)
    if not payload:
        return OtpResult(
            False,
            None,
            "Verification code has expired (60 seconds) or was not found. Please click 'Resend Code'.",
            0,
        )

    current_attempts = payload.get("attempts", 0)
    if current_attempts >= max_attempts:
        delete_registration_otp(clean_email)
        lock_account(clean_email)
        _, _, time_str = is_account_locked(clean_email)
        return OtpResult(
            False,
            None,
            f"Too many failed attempts (3/3). Account is locked for 12 hours. Please try again after {time_str}.",
            0,
            is_locked=True,
        )

    expected_otp = str(payload.get("otp", "")).strip()
    submitted_otp = str(otp).strip()

    if secrets.compare_digest(expected_otp, submitted_otp):
        # Cleared immediately upon single successful use (one-time protection)
        delete_registration_otp(clean_email)
        return OtpResult(True, payload.get("data"), None, max_attempts - current_attempts)

    # Failed attempt: increment counter
    current_attempts += 1
    payload["attempts"] = current_attempts
    remaining = max(0, max_attempts - current_attempts)

    # 3rd failure => 12-hour lockout!
    if current_attempts >= max_attempts:
        delete_registration_otp(clean_email)
        lock_account(clean_email)
        _, _, time_str = is_account_locked(clean_email)
        return OtpResult(
            False,
            None,
            f"Too many failed attempts (3/3). Account is locked for 12 hours. Please try again after {time_str}.",
            0,
            is_locked=True,
        )

    # Update payload with incremented attempts
    ttl = int(payload.get("expires_at", 0) - time.time())
    if ttl > 0:
        client = _get_redis()
        if client:
            try:
                client.set(key, json.dumps(payload), ex=ttl)
            except Exception:
                pass
        _memory_store[key] = payload

    return OtpResult(
        False,
        None,
        f"Invalid verification code. {remaining} attempt(s) remaining before 12-hour account lockout.",
        remaining,
    )


def delete_registration_otp(email: str) -> None:
    """Delete OTP entry upon verification or cancellation."""
    clean_email = email.lower().strip()
    key = f"reg_otp:{clean_email}"

    client = _get_redis()
    if client:
        try:
            client.delete(key)
        except Exception:
            pass

    _memory_store.pop(key, None)


# ── Login OTP (60s expiry, max 3 attempts, 12h lockout) ───────────────────────

def store_login_otp(
    email: str,
    otp: str,
    expiry_seconds: int = DEFAULT_OTP_EXPIRY_SECONDS,
) -> None:
    """Store 6-digit Login OTP for existing user (default 60 seconds)."""
    clean_email = email.lower().strip()
    key = f"login_otp:{clean_email}"
    payload = {
        "otp": str(otp).strip(),
        "expires_at": time.time() + expiry_seconds,
        "attempts": 0,
        "max_attempts": MAX_OTP_ATTEMPTS,
    }

    logger.info("[LOGIN OTP] Code for %s is: %s (valid for %ds)", clean_email, otp, expiry_seconds)
    print(f"[LOGIN OTP] Code for {clean_email} is: {otp} (valid for {expiry_seconds}s)", flush=True)

    client = _get_redis()
    if client:
        try:
            client.set(key, json.dumps(payload), ex=expiry_seconds)
            return
        except Exception as exc:
            logger.warning("Failed writing Login OTP to Redis: %s", exc)

    _memory_store[key] = payload


def get_login_otp_payload(email: str) -> Optional[dict]:
    """Retrieve active login OTP payload if valid and not expired."""
    clean_email = email.lower().strip()
    key = f"login_otp:{clean_email}"

    client = _get_redis()
    if client:
        try:
            val = client.get(key)
            if val:
                return json.loads(val)
        except Exception:
            pass

    item = _memory_store.get(key)
    if item:
        if time.time() > item.get("expires_at", 0):
            _memory_store.pop(key, None)
            return None
        return item
    return None


def verify_and_clear_login_otp(
    email: str,
    otp: str,
    max_attempts: int = MAX_OTP_ATTEMPTS,
) -> OtpResult:
    """
    Verify submitted Login OTP against stored OTP with 3-attempt limit.
    If 3 failed attempts are reached, locks the account for 12 hours.
    Returns: OtpResult (is_valid, data, error_msg, attempts_remaining, is_locked)
    """
    clean_email = email.lower().strip()

    # 1. Check if already locked out
    locked, remaining_secs, time_str = is_account_locked(clean_email)
    if locked:
        return OtpResult(
            False,
            None,
            f"Account is locked for 12 hours due to 3 failed attempts. Please try again after {time_str}.",
            0,
            is_locked=True,
        )

    key = f"login_otp:{clean_email}"
    payload = get_login_otp_payload(clean_email)
    if not payload:
        return OtpResult(
            False,
            None,
            "Login code has expired (60 seconds) or was not found. Please request a new login code.",
            0,
        )

    current_attempts = payload.get("attempts", 0)
    if current_attempts >= max_attempts:
        delete_login_otp(clean_email)
        lock_account(clean_email)
        _, _, time_str = is_account_locked(clean_email)
        return OtpResult(
            False,
            None,
            f"Too many failed attempts (3/3). Account is locked for 12 hours. Please try again after {time_str}.",
            0,
            is_locked=True,
        )

    expected_otp = str(payload.get("otp", "")).strip()
    submitted_otp = str(otp).strip()

    if secrets.compare_digest(expected_otp, submitted_otp):
        delete_login_otp(clean_email)
        return OtpResult(True, {"email": clean_email}, None, max_attempts - current_attempts)

    current_attempts += 1
    payload["attempts"] = current_attempts
    remaining = max(0, max_attempts - current_attempts)

    # 3rd failure => 12-hour lockout!
    if current_attempts >= max_attempts:
        delete_login_otp(clean_email)
        lock_account(clean_email)
        _, _, time_str = is_account_locked(clean_email)
        return OtpResult(
            False,
            None,
            f"Too many failed attempts (3/3). Account is locked for 12 hours. Please try again after {time_str}.",
            0,
            is_locked=True,
        )

    ttl = int(payload.get("expires_at", 0) - time.time())
    if ttl > 0:
        client = _get_redis()
        if client:
            try:
                client.set(key, json.dumps(payload), ex=ttl)
            except Exception:
                pass
        _memory_store[key] = payload

    return OtpResult(
        False,
        None,
        f"Invalid login code. {remaining} attempt(s) remaining before 12-hour account lockout.",
        remaining,
    )


def delete_login_otp(email: str) -> None:
    """Delete Login OTP entry upon successful verification or cancellation."""
    clean_email = email.lower().strip()
    key = f"login_otp:{clean_email}"
    client = _get_redis()
    if client:
        try:
            client.delete(key)
        except Exception:
            pass
    _memory_store.pop(key, None)
