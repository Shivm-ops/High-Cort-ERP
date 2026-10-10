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


def run_db_migrations():
    from sqlalchemy import text
    from sqlalchemy.exc import OperationalError, ProgrammingError
    
    columns = [
        ("ai_provider", "VARCHAR(50) DEFAULT 'platform'"),
        ("ai_api_key", "VARCHAR(500)"),
        ("ai_api_base", "VARCHAR(255)"),
        ("ai_model", "VARCHAR(100)"),
        ("website", "VARCHAR(255)"),
        ("subdomain", "VARCHAR(100)"),
        ("custom_domain", "VARCHAR(255)"),
    ]
    
    with engine.connect() as conn:
        for col_name, col_type in columns:
            try:
                conn.execute(text(f"ALTER TABLE firms ADD COLUMN {col_name} {col_type}"))
                conn.commit()
                logger.info(f"✅ Added column {col_name} to firms table")
            except (OperationalError, ProgrammingError) as e:
                err_msg = str(e).lower()
                if "duplicate column" in err_msg or "already exists" in err_msg or "duplicate" in err_msg:
                    logger.info(f"ℹ️ Column {col_name} already exists in firms table")
                else:
                    logger.warning(f"⚠️ Migration notice for {col_name}: {e}")
        for index_sql in [
            "CREATE UNIQUE INDEX IF NOT EXISTS ix_firms_subdomain ON firms (subdomain)",
            "CREATE UNIQUE INDEX IF NOT EXISTS ix_firms_custom_domain ON firms (custom_domain)",
        ]:
            try:
                conn.execute(text(index_sql))
                conn.commit()
            except Exception as e:
                logger.warning(f"⚠️ Index notice: {e}")

    _backfill_firm_subdomains()


def _backfill_firm_subdomains():
    from app.core.database import SessionLocal
    from app.models.firm import Firm
    from app.services.tenant_domain import ensure_firm_subdomain

    db = SessionLocal()
    try:
        firms = db.query(Firm).filter((Firm.subdomain.is_(None)) | (Firm.subdomain == "")).all()
        for firm in firms:
            ensure_firm_subdomain(db, firm)
        if firms:
            db.commit()
            logger.info(f"✅ Assigned subdomains to {len(firms)} existing firms")
    except Exception as e:
        db.rollback()
        logger.warning(f"⚠️ Subdomain backfill skipped: {e}")
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 LegalOS API starting up...")
    Base.metadata.create_all(bind=engine)
    try:
        run_db_migrations()
    except Exception as e:
        logger.error(f"❌ Failed to run database migrations: {e}")
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
    allow_origins=settings.all_allowed_origins(),
    allow_origin_regex=r"^https?://.*$",
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
