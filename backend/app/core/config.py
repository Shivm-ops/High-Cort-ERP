from pydantic_settings import BaseSettings
from typing import List
import json


class Settings(BaseSettings):
    APP_NAME: str = "Fastcase"
    APP_ENV: str = "development"
    DEBUG: bool = True
    SECRET_KEY: str = "fastcase-development-secret-change-in-production-2025"
    DOMAIN: str = "fastcase.in"
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://139.59.73.77",
        "http://139.59.73.77:3000",
        "http://139.59.73.77:3001",
        "http://139.59.73.77:3002",
        "http://43.204.229.196",
        "http://43.204.229.196:3000",
        "http://15.206.205.114",
        "http://15.206.205.114:3000",
        "http://15.206.205.114:3001",
        "http://15.206.205.114:3002",
        "http://fastcase.in",
        "http://www.fastcase.in",
        "http://app.fastcase.in",
        "http://admin.fastcase.in",
        "http://api.fastcase.in",
        "https://fastcase.in",
        "https://www.fastcase.in",
        "https://app.fastcase.in",
        "https://admin.fastcase.in",
        "https://api.fastcase.in",
    ]

    def all_allowed_origins(self) -> List[str]:
        origins = list(self.ALLOWED_ORIGINS)
        domain = (self.DOMAIN or "").strip().lower()
        if domain:
            for proto in ("http://", "https://"):
                for prefix in ("", "www.", "app.", "admin.", "api."):
                    origin = f"{proto}{prefix}{domain}"
                    if origin not in origins:
                        origins.append(origin)
        return origins

    # Database
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/fastcase_db"
    REDIS_URL: str = "redis://localhost:6379/0"

    # JWT
    JWT_SECRET_KEY: str = "fastcase-jwt-secret-dev-2025"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # OpenAI
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-large"

    # Storage (AWS S3 / DigitalOcean Spaces)
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "ap-south-1"
    AWS_S3_BUCKET: str = "fastcase-documents"

    # Elasticsearch
    ELASTICSEARCH_URL: str = "http://localhost:9200"

    # Email — Azure Communication Services
    AZURE_COMMUNICATION_CONNECTION_STRING: str = ""
    AZURE_EMAIL_FROM_ADDRESS: str = "noreply@fastcase.in"
    AZURE_EMAIL_FROM_NAME: str = "Fastcase ERP"

    # Email — SMTP (Amazon SES / Gmail / Mailtrap / Custom SMTP)
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "noreply@fastcase.in"
    SMTP_FROM_NAME: str = "Fastcase ERP"
    SMTP_USE_TLS: bool = True

    # Admin Notifications
    ADMIN_EMAIL: str = "admin@fastcase.in"

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"


settings = Settings()
