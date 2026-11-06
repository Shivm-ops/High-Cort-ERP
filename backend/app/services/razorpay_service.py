"""
app/services/razorpay_service.py
================================
Razorpay Payment Gateway client.

- Order creation (amounts in paise)
- Checkout signature verification  (HMAC-SHA256 of "order_id|payment_id")
- Webhook signature verification   (HMAC-SHA256 of raw body with webhook secret)
- Server-side payment fetch + capture (never trust the browser for amount/status)
- GST price breakdown (rate configurable via GST_RATE)

There is intentionally NO simulation mode: if keys are missing the gateway is
reported as "not configured" and checkout is refused.
"""

import hmac
import hashlib
import logging
from typing import Optional, Dict, Any, Tuple

import httpx
from app.core.config import settings

logger = logging.getLogger("razorpay_service")

RAZORPAY_API_BASE = "https://api.razorpay.com/v1"


class RazorpayError(Exception):
    """Raised when the Razorpay API returns an error or is unreachable."""


def get_razorpay_credentials() -> Tuple[str, str]:
    return (settings.RAZORPAY_KEY_ID or "").strip(), (settings.RAZORPAY_KEY_SECRET or "").strip()


def is_razorpay_configured() -> bool:
    key_id, key_secret = get_razorpay_credentials()
    return bool(key_id and key_secret)


def is_test_mode() -> bool:
    key_id, _ = get_razorpay_credentials()
    return key_id.startswith("rzp_test_")


def to_paise(amount_inr: float) -> int:
    return int(round(amount_inr * 100))


def calculate_price_breakdown(base_amount: float) -> Dict[str, float]:
    """Base price + GST (split into CGST/SGST) = total payable."""
    gst_rate = float(settings.GST_RATE or 0)
    base_amount = round(float(base_amount), 2)
    gst_amount = round(base_amount * gst_rate, 2)
    cgst = round(gst_amount / 2, 2)
    sgst = round(gst_amount - cgst, 2)
    return {
        "base_amount": base_amount,
        "gst_rate": gst_rate,
        "gst_amount": gst_amount,
        "cgst": cgst,
        "sgst": sgst,
        "total_amount": round(base_amount + gst_amount, 2),
    }


async def _request(method: str, path: str, json: Optional[dict] = None) -> Dict[str, Any]:
    key_id, key_secret = get_razorpay_credentials()
    if not key_id or not key_secret:
        raise RazorpayError("Razorpay is not configured")
    url = f"{RAZORPAY_API_BASE}{path}"
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.request(method, url, json=json, auth=(key_id, key_secret))
    except httpx.HTTPError as exc:
        logger.error(f"Razorpay network error on {method} {path}: {exc}")
        raise RazorpayError("Could not reach Razorpay") from exc

    if resp.status_code >= 400:
        try:
            desc = resp.json().get("error", {}).get("description") or resp.text
        except Exception:
            desc = resp.text
        logger.error(f"Razorpay {method} {path} failed [{resp.status_code}]: {desc}")
        raise RazorpayError(desc)
    return resp.json()


async def create_razorpay_order(amount_inr: float, receipt: str, notes: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
    amount_paise = to_paise(amount_inr)
    if amount_paise < 100:
        raise RazorpayError("Order amount must be at least ₹1")
    return await _request("POST", "/orders", {
        "amount": amount_paise,
        "currency": "INR",
        "receipt": receipt[:40],  # Razorpay limit
        "notes": {k: str(v)[:250] for k, v in (notes or {}).items()},
    })


async def fetch_payment(payment_id: str) -> Dict[str, Any]:
    return await _request("GET", f"/payments/{payment_id}")


async def capture_payment(payment_id: str, amount_paise: int) -> Dict[str, Any]:
    return await _request("POST", f"/payments/{payment_id}/capture", {"amount": amount_paise, "currency": "INR"})


async def ensure_payment_captured(payment_id: str, expected_order_id: str, expected_amount_paise: int) -> Dict[str, Any]:
    """
    Fetch the payment from Razorpay and make sure it belongs to our order, is for
    the exact amount, and is captured (capturing it if only authorized).
    """
    payment = await fetch_payment(payment_id)
    if payment.get("order_id") != expected_order_id:
        raise RazorpayError("Payment does not belong to this order")
    if int(payment.get("amount", 0)) != int(expected_amount_paise):
        raise RazorpayError("Payment amount mismatch")
    if payment.get("currency") != "INR":
        raise RazorpayError("Unexpected payment currency")

    status = payment.get("status")
    if status == "authorized":
        payment = await capture_payment(payment_id, expected_amount_paise)
        status = payment.get("status")
    if status != "captured":
        raise RazorpayError(f"Payment is not captured (status: {status})")
    return payment


def verify_payment_signature(razorpay_order_id: str, razorpay_payment_id: str, razorpay_signature: str) -> bool:
    _, key_secret = get_razorpay_credentials()
    if not key_secret or not razorpay_signature:
        return False
    message = f"{razorpay_order_id}|{razorpay_payment_id}".encode("utf-8")
    generated = hmac.new(key_secret.encode("utf-8"), message, hashlib.sha256).hexdigest()
    return hmac.compare_digest(generated, razorpay_signature)


def verify_webhook_signature(payload_body: bytes, signature_header: Optional[str]) -> bool:
    """Webhooks are rejected unless a secret is configured AND the signature matches."""
    secret = (settings.RAZORPAY_WEBHOOK_SECRET or "").strip()
    if not secret:
        logger.error("RAZORPAY_WEBHOOK_SECRET is not configured; rejecting webhook")
        return False
    if not signature_header:
        return False
    generated = hmac.new(secret.encode("utf-8"), payload_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(generated, signature_header)
