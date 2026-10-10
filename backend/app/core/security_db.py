from cryptography.fernet import Fernet, InvalidToken
from sqlalchemy_utils.types.encrypted.encrypted_type import FernetEngine as BaseFernetEngine
import os
import logging
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

# Persistent 32 url-safe base64-encoded key for development
DEFAULT_DEV_KEY = "k1cT7yG-QxV8_W9zL1mN3oP5qR7sT9uV1wX3yZ5aB7c="
ENCRYPTION_KEY = os.environ.get("ENCRYPTION_KEY", DEFAULT_DEV_KEY)


class SafeFernetEngine(BaseFernetEngine):
    """Resilient Fernet engine that handles corrupted or mismatched encryption keys without crashing."""
    def decrypt(self, value):
        if not value:
            return ""
        try:
            return super().decrypt(value)
        except (InvalidToken, Exception) as e:
            logger.warning(f"Decryption failed for encrypted field: {e}")
            return ""

FernetEngine = SafeFernetEngine

