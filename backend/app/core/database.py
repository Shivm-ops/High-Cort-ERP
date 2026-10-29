from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}
kwargs = (
    {}
    if settings.DATABASE_URL.startswith("sqlite")
    else {
        "pool_size": 20,
        "max_overflow": 20,
        "pool_recycle": 300,
        "pool_timeout": 30,
        "pool_pre_ping": True,
    }
)

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    **kwargs
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
