"""
migrate_phase2.py
=================
Phase 2 migration: auth hardening + audit log columns.
Safe to run multiple times (checks column existence first).
"""

import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app.core.config import settings
from sqlalchemy import create_engine, text

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}
)

MIGRATIONS = [
    # User auth hardening
    "ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0 NOT NULL",
    "ALTER TABLE users ADD COLUMN locked_until TIMESTAMP",
    "ALTER TABLE users ADD COLUMN login_count INTEGER DEFAULT 0 NOT NULL",

    # Create audit_logs table
    """CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        firm_id TEXT REFERENCES firms(id) ON DELETE SET NULL,
        action TEXT NOT NULL,
        resource_type TEXT,
        resource_id TEXT,
        ip_address TEXT,
        user_agent TEXT,
        details TEXT,
        status TEXT DEFAULT 'success',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )""",
    "CREATE INDEX IF NOT EXISTS ix_audit_logs_firm_id ON audit_logs(firm_id)",
    "CREATE INDEX IF NOT EXISTS ix_audit_logs_action ON audit_logs(action)",
    "CREATE INDEX IF NOT EXISTS ix_audit_logs_created_at ON audit_logs(created_at)",
]

def column_exists(conn, table, column):
    try:
        result = conn.execute(text(f"PRAGMA table_info({table})"))
        return any(row[1] == column for row in result)
    except Exception:
        return False

def table_exists(conn, table):
    result = conn.execute(text(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=:t"
    ), {"t": table})
    return result.fetchone() is not None

with engine.connect() as conn:
    for stmt in MIGRATIONS:
        stmt_stripped = stmt.strip()

        # For CREATE TABLE / INDEX, just run it (IF NOT EXISTS handles idempotency)
        if stmt_stripped.upper().startswith(("CREATE TABLE", "CREATE INDEX")):
            try:
                conn.execute(text(stmt_stripped))
                conn.commit()
                first_word = stmt_stripped.split()[2] if "INDEX" in stmt_stripped.upper() else stmt_stripped.split()[5]
                print(f"  ✅ CREATED {first_word.strip('(')}")
            except Exception as e:
                print(f"  ⏭  SKIP (already exists or error): {e}")
            continue

        # For ALTER TABLE — check column first
        parts = stmt_stripped.split()
        table = parts[2]
        col = parts[5]
        if column_exists(conn, table, col):
            print(f"  ⏭  SKIP  {table}.{col} already exists")
        else:
            try:
                conn.execute(text(stmt_stripped))
                conn.commit()
                print(f"  ✅ ADDED {table}.{col}")
            except Exception as e:
                print(f"  ❌ ERROR {table}.{col}: {e}")

print("\n✅ Phase 2 migration complete.")
