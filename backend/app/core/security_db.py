from cryptography.fernet import Fernet
import os
from dotenv import load_dotenv

load_dotenv()

# We need a 32 url-safe base64-encoded byte string for Fernet
# In production, this should be a properly generated KMS key.
ENCRYPTION_KEY = os.environ.get("ENCRYPTION_KEY", Fernet.generate_key().decode())
