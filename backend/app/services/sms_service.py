"""
Fastcase SMS Dispatch Service (Fast2SMS Gateway)
Supports:
  - Route "otp" (Transactional OTP route)
  - Route "q" (Quick SMS route fallback)
"""

import logging
import httpx
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

FAST2SMS_ENDPOINT = "https://www.fast2sms.com/dev/bulkV2"


async def send_fast2sms_otp(phone_number: str, otp_code: str) -> bool:
    """
    Dispatches a 6-digit OTP code to an Indian mobile handset via Fast2SMS.
    """
    api_key = getattr(settings, "FAST2SMS_API_KEY", "") or ""
    if not api_key:
        logger.warning("FAST2SMS_API_KEY is not configured in environment. Skipping SMS.")
        return False

    # Extract 10-digit number
    digits = "".join(filter(str.isdigit, str(phone_number)))
    if len(digits) < 10:
        logger.error(f"Invalid phone number length for Fast2SMS: {phone_number}")
        return False
    mobile_10 = digits[-10:]

    headers = {
        "authorization": api_key.strip(),
        "Content-Type": "application/json",
    }

    # Attempt 1: Try OTP route (Fast2SMS OTP Service)
    otp_payload = {
        "variables_values": str(otp_code),
        "route": "otp",
        "numbers": mobile_10,
    }

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.post(FAST2SMS_ENDPOINT, json=otp_payload, headers=headers)
            data = resp.json() if resp.status_code == 200 else {}
            if resp.status_code == 200 and data.get("return") is True:
                logger.info(f"✓ Fast2SMS OTP delivered to {mobile_10}: {data.get('message')}")
                return True

            logger.info(f"Fast2SMS OTP route response: {resp.status_code} {resp.text}. Trying Quick SMS route...")

            # Attempt 2: Fallback to Quick SMS route (route=q)
            quick_payload = {
                "message": f"Your Fastcase verification code is {otp_code}. Valid for 10 minutes.",
                "route": "q",
                "numbers": mobile_10,
            }
            resp_q = await client.post(FAST2SMS_ENDPOINT, json=quick_payload, headers=headers)
            data_q = resp_q.json() if resp_q.status_code == 200 else {}
            if resp_q.status_code == 200 and data_q.get("return") is True:
                logger.info(f"✓ Fast2SMS Quick SMS delivered to {mobile_10}: {data_q.get('message')}")
                return True
            else:
                logger.warning(f"Fast2SMS Quick SMS route failed: {resp_q.status_code} {resp_q.text}")
                return False

    except Exception as e:
        logger.error(f"Exception calling Fast2SMS API for {mobile_10}: {e}")
        return False
