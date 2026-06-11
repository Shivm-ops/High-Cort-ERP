from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
hash = "$2b$12$qdcnu8EbNfHFoophgpfOseBjrEQH9TLlD2G9zw4IOmCG5asCeIgc2"
pwd = "lagalos@2025"
print("Match:", pwd_context.verify(pwd, hash))
