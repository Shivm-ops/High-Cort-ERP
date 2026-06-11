"""LegalOS — India's AI Legal Operating System
FastAPI Application Entry Point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
import logging

from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1 import router as api_v1_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 LegalOS API starting up...")
    Base.metadata.create_all(bind=engine)
    logger.info("✅ Database tables created/verified")
    yield
    logger.info("🛑 LegalOS API shutting down...")


app = FastAPI(
    title="LegalOS API",
    description="India's AI-powered Legal Operating System — REST API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API router
app.include_router(api_v1_router, prefix="/api/v1")


@app.get("/")
async def root():
    return {
        "name": "LegalOS API",
        "version": "1.0.0",
        "description": "India's AI Legal Operating System",
        "docs": "/api/docs",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "lagalos-api"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
