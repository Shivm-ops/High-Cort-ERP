import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from app.core.security import get_password_hash
print(get_password_hash("lagalos@2025"))
