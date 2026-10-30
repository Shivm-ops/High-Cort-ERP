"""Fastcase — REST API
FastAPI Application Entry Point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware
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
                conn.rollback()
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
                conn.rollback()
                logger.warning(f"⚠️ Index notice: {e}")

        # Ensure reminder_sent exists on hearings table
        try:
            conn.execute(text("ALTER TABLE hearings ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE"))
            conn.commit()
            logger.info("✅ Verified reminder_sent column in hearings table")
        except Exception as e:
            conn.rollback()
            logger.warning(f"⚠️ Notice on hearings.reminder_sent: {e}")

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

import asyncio

async def _hearing_reminder_cron_worker():
    """Background task running periodically to dispatch upcoming hearing reminders."""
    from datetime import date, timedelta
    from sqlalchemy.orm import joinedload
    from app.core.database import SessionLocal
    from app.models.hearing import Hearing, HearingStatus
    from app.models.case import Case
    from app.services.email_service import send_court_hearing_email

    # Initial delay on startup before running first check
    await asyncio.sleep(30)
    while True:
        try:
            tomorrow = date.today() + timedelta(days=1)
            with SessionLocal() as db:
                upcoming = (
                    db.query(Hearing)
                    .options(joinedload(Hearing.case).joinedload(Case.client))
                    .filter(
                        Hearing.hearing_date == tomorrow,
                        Hearing.status == HearingStatus.SCHEDULED,
                        Hearing.reminder_sent == False,
                    )
                    .all()
                )
                for h in upcoming:
                    case = h.case
                    if case and case.client and case.client.email:
                        firm_name = "Fastcase Chambers"
                        if hasattr(case, "firm") and case.firm and hasattr(case.firm, "name"):
                            firm_name = case.firm.name
                        try:
                            await send_court_hearing_email(
                                to_email=case.client.email,
                                client_name=case.client.name or "Valued Client",
                                case_title=case.title or "Legal Matter",
                                case_no=case.case_no or "N/A",
                                hearing_date=h.hearing_date.isoformat(),
                                hearing_time=str(h.hearing_time) if h.hearing_time else None,
                                court=h.court or case.court or "Hon'ble Court",
                                courtroom=h.courtroom,
                                judge=h.judge,
                                purpose=h.purpose,
                                notes=h.notes,
                                advocate_name="Legal Counsel",
                                firm_name=firm_name,
                                notice_type="reminder",
                            )
                            h.reminder_sent = True
                        except Exception as e:
                            logger.error(f"Error in automatic hearing reminder worker for hearing {h.id}: {e}")
                db.commit()
        except asyncio.CancelledError:
            break
        except Exception as exc:
            logger.error(f"Error in periodic hearing reminder worker: {exc}")

        # Check every 4 hours
        try:
            await asyncio.sleep(14400)
        except asyncio.CancelledError:
            break


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Fastcase API starting up...")
    Base.metadata.create_all(bind=engine)
    try:
        run_db_migrations()
    except Exception as e:
        logger.error(f"❌ Failed to run database migrations: {e}")
    try:
        from app.services.template_seeds import seed_master_templates
        from app.core.database import SessionLocal
        with SessionLocal() as db_session:
            seed_master_templates(db_session)
    except Exception as e:
        logger.warning(f"⚠️ Template seeding notice: {e}")
    logger.info("✅ Database tables created/verified")

    # Start periodic court hearing reminder worker
    reminder_task = asyncio.create_task(_hearing_reminder_cron_worker())
    logger.info("📅 Automated Court Date Reminder worker started")

    yield

    reminder_task.cancel()
    try:
        await reminder_task
    except (asyncio.CancelledError, Exception):
        pass
    logger.info("🛑 Fastcase API shutting down...")


app = FastAPI(
    title="Fastcase API",
    description="Fastcase REST API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# CORS — allow the root domain, its subdomains (incl. firm tenant subdomains), localhost, 127.0.0.1, and direct IPs
import re as _re
_domain_re = _re.escape((settings.DOMAIN or "fastcase.in").strip().lower())
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.all_allowed_origins(),
    allow_origin_regex=rf"^https?://(([a-z0-9-]+\.)*{_domain_re}|localhost(:\d+)?|127\.0\.0\.1(:\d+)?|(\d{{1,3}}\.){{3}}\d{{1,3}}(:\d+)?)$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API router
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.include_router(api_v1_router, prefix="/api/v1")


@app.get("/")
async def root():
    return {
        "name": "Fastcase API",
        "version": "1.0.0",
        "description": "Fastcase REST API",
        "docs": "/api/docs",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "fastcase-api"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
