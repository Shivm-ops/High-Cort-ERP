"""
app/services/otp_service.py
===========================
Secure 6-digit OTP manager backed by Redis with in-memory TTL fallback.
Handles user registration verification and passwordless login OTP lifecycles.
Enforces 3-minute TTL (180s) and strict 3-attempt limit lockout.
"""

import json
import secrets
import time
import logging
from typing import Optional, Dict, Any
from app.core.config import settings

logger = logging.getLogger("otp_service")

# In-memory fallback if Redis is unavailable or in development
_memory_store: Dict[str, Dict[str, Any]] = {}


class OtpResult(tuple):
    """
    Subclass of tuple (is_valid, data) for 100% backward compatibility
    with existing unpacking: `is_valid, data = verify_and_clear_...()`
    while also exposing `.error_msg` and `.attempts_remaining`.
    """
    is_valid: bool
    data: Optional[dict]
    error_msg: Optional[str]
    attempts_remaining: int

    def __new__(cls, is_valid: bool, data: Optional[dict], error_msg: Optional[str] = None, attempts_remaining: int = 0):
        return super().__new__(cls, (is_valid, data))

    def __init__(self, is_valid: bool, data: Optional[dict], error_msg: Optional[str] = None, attempts_remaining: int = 0):
        self.is_valid = is_valid
        self.data = data
        self.error_msg = error_msg
        self.attempts_remaining = attempts_remaining


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


# ── Registration OTP (180s / 3-minute expiry, max 3 attempts) ─────────────────

def store_registration_otp(email: str, reg_data: dict, otp: str, expiry_seconds: int = 180) -> None:
    """Store pending registration data with 6-digit OTP (default 3 minutes / 180s)."""
    clean_email = email.lower().strip()
    key = f"reg_otp:{clean_email}"
    payload = {
        "otp": str(otp).strip(),
        "data": reg_data,
        "expires_at": time.time() + expiry_seconds,
        "attempts": 0,
        "max_attempts": 3,
    }

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


def verify_and_clear_registration_otp(email: str, otp: str, max_attempts: int = 3) -> OtpResult:
    """
    Verify submitted OTP against stored OTP with 3-attempt limit.
    Returns: OtpResult (is_valid, reg_data, error_msg, attempts_remaining)
    """
    clean_email = email.lower().strip()
    key = f"reg_otp:{clean_email}"
    payload = get_registration_otp_payload(email)
    if not payload:
        return OtpResult(False, None, "Verification code has expired or was not found. Please click 'Resend Code'.", 0)

    current_attempts = payload.get("attempts", 0)
    if current_attempts >= max_attempts:
        delete_registration_otp(email)
        return OtpResult(False, None, f"Too many failed attempts ({max_attempts}/{max_attempts}). This verification code has been invalidated for security. Please request a new code.", 0)

    expected_otp = str(payload.get("otp", "")).strip()
    submitted_otp = str(otp).strip()

    if secrets.compare_digest(expected_otp, submitted_otp):
        # Cleared immediately upon single successful use (one-time protection)
        delete_registration_otp(email)
        return OtpResult(True, payload.get("data"), None, max_attempts - current_attempts)

    # Failed attempt: increment counter
    current_attempts += 1
    payload["attempts"] = current_attempts
    remaining = max(0, max_attempts - current_attempts)

    if current_attempts >= max_attempts:
        delete_registration_otp(email)
        return OtpResult(False, None, f"Too many failed attempts ({max_attempts}/{max_attempts}). This verification code has been invalidated for security. Please request a new code.", 0)

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

    return OtpResult(False, None, f"Invalid verification code. {remaining} attempt(s) remaining.", remaining)


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


# ── Login OTP (180s / 3-minute expiry, max 3 attempts) ────────────────────────

def store_login_otp(email: str, otp: str, expiry_seconds: int = 180) -> None:
    """Store 6-digit Login OTP for existing user (default 3 minutes / 180s)."""
    clean_email = email.lower().strip()
    key = f"login_otp:{clean_email}"
    payload = {
        "otp": str(otp).strip(),
        "expires_at": time.time() + expiry_seconds,
        "attempts": 0,
        "max_attempts": 3,
    }

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


def verify_and_clear_login_otp(email: str, otp: str, max_attempts: int = 3) -> OtpResult:
    """
    Verify submitted Login OTP against stored OTP with 3-attempt limit.
    Returns: OtpResult (is_valid, data, error_msg, attempts_remaining)
    """
    clean_email = email.lower().strip()
    key = f"login_otp:{clean_email}"
    payload = get_login_otp_payload(email)
    if not payload:
        return OtpResult(False, None, "Login code has expired or was not found. Please request a new login code.", 0)

    current_attempts = payload.get("attempts", 0)
    if current_attempts >= max_attempts:
        delete_login_otp(email)
        return OtpResult(False, None, f"Too many failed attempts ({max_attempts}/{max_attempts}). This login code has been invalidated for security. Please request a new code.", 0)

    expected_otp = str(payload.get("otp", "")).strip()
    submitted_otp = str(otp).strip()

    if secrets.compare_digest(expected_otp, submitted_otp):
        delete_login_otp(email)
        return OtpResult(True, {"email": clean_email}, None, max_attempts - current_attempts)

    current_attempts += 1
    payload["attempts"] = current_attempts
    remaining = max(0, max_attempts - current_attempts)

    if current_attempts >= max_attempts:
        delete_login_otp(email)
        return OtpResult(False, None, f"Too many failed attempts ({max_attempts}/{max_attempts}). This login code has been invalidated for security. Please request a new code.", 0)

    ttl = int(payload.get("expires_at", 0) - time.time())
    if ttl > 0:
        client = _get_redis()
        if client:
            try:
                client.set(key, json.dumps(payload), ex=ttl)
            except Exception:
                pass
        _memory_store[key] = payload

    return OtpResult(False, None, f"Invalid login code. {remaining} attempt(s) remaining.", remaining)


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
