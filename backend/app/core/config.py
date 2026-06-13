from pydantic_settings import BaseSettings
from typing import List
import json


class Settings(BaseSettings):
    APP_NAME: str = "LegalOS"
    APP_ENV: str = "development"
    DEBUG: bool = True
    SECRET_KEY: str = "lagalos-development-secret-change-in-production-2025"
    ENCRYPTION_KEY: str = ""
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
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

    # Database
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/lagalos_db"
    REDIS_URL: str = "redis://localhost:6379/0"

    # JWT
    JWT_SECRET_KEY: str = "lagalos-jwt-secret-dev-2025"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # OpenAI
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-large"

    # AWS S3
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "ap-south-1"
    AWS_S3_BUCKET: str = "lagalos-documents"

    # Elasticsearch
    ELASTICSEARCH_URL: str = "http://localhost:9200"

    # Email
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"


settings = Settings()
