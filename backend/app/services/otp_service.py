"""
app/services/otp_service.py
===========================
Secure 6-digit OTP manager backed by Redis with in-memory TTL fallback.
Handles user registration verification and one-time password lifecycles.
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


def store_registration_otp(email: str, reg_data: dict, otp: str, expiry_seconds: int = 600) -> None:
    """Store pending registration data with 6-digit OTP (default 10 mins)."""
    clean_email = email.lower().strip()
    key = f"reg_otp:{clean_email}"
    payload = {
        "otp": str(otp).strip(),
        "data": reg_data,
        "expires_at": time.time() + expiry_seconds,
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


def verify_and_clear_registration_otp(email: str, otp: str) -> tuple[bool, Optional[dict]]:
    """Verify submitted OTP against stored OTP. Returns (is_valid, reg_data)."""
    payload = get_registration_otp_payload(email)
    if not payload:
        return False, None

    expected_otp = str(payload.get("otp", "")).strip()
    submitted_otp = str(otp).strip()

    if secrets.compare_digest(expected_otp, submitted_otp):
        # Cleared immediately upon single successful use (one-time protection)
        delete_registration_otp(email)
        return True, payload.get("data")

    return False, None


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
