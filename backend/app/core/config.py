from pydantic_settings import BaseSettings
from typing import List, Optional
import os


class Settings(BaseSettings):
    APP_NAME: str = "Fastcase"
    APP_ENV: str = "development"
    DEBUG: bool = True
    DOMAIN: str = "fastcase.in"
    SECRET_KEY: str = "supersecretkey"

    # Database
    DATABASE_URL: str = "postgresql+psycopg2://postgres:password@localhost:5432/lagalos_db"
    REDIS_URL: str = "redis://localhost:6379/0"

    # JWT
    JWT_SECRET_KEY: str = "jwtsecretkey"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "https://fastcase.in",
        "https://www.fastcase.in",
        "https://app.fastcase.in",
        "https://admin.fastcase.in",
    ]

    # OpenAI
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o"

    # AWS
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION: str = "ap-south-1"
    AWS_S3_BUCKET: str = "lagalos-documents"

    # Azure Blob Storage
    AZURE_STORAGE_CONNECTION_STRING: Optional[str] = None
    AZURE_CONTAINER_NAME: str = "documents"

    # Elasticsearch
    ELASTICSEARCH_URL: Optional[str] = None

    # Email — SMTP (Amazon SES / Gmail / Brevo / Custom SMTP)
    SMTP_HOST: str = ""
    SMTP_PORT: int = 2525
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "support@fastcase.in"
    SMTP_FROM_NAME: str = "Fastcase ERP"
    SMTP_USE_TLS: bool = True

    # Razorpay Payment Gateway
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    RAZORPAY_WEBHOOK_SECRET: str = ""

    # Admin Notifications
    ADMIN_EMAIL: str = "admin@fastcase.in"

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"


settings = Settings()
