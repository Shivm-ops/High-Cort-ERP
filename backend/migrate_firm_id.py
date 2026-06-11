"""
migrate_firm_id.py
==================
Adds firm_id, created_by_id, updated_by_id columns to all tenant-bound tables.
Safe to run multiple times (checks if column exists first).
"""

import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app.core.config import settings
from sqlalchemy import create_engine, text

engine = create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {})

MIGRATIONS = [
    # clients table
    "ALTER TABLE clients ADD COLUMN firm_id TEXT REFERENCES firms(id)",
    "ALTER TABLE clients ADD COLUMN created_by_id TEXT REFERENCES users(id)",
    "ALTER TABLE clients ADD COLUMN updated_by_id TEXT REFERENCES users(id)",
    # cases table
    "ALTER TABLE cases ADD COLUMN firm_id TEXT REFERENCES firms(id)",
    "ALTER TABLE cases ADD COLUMN created_by_id TEXT REFERENCES users(id)",
    "ALTER TABLE cases ADD COLUMN updated_by_id TEXT REFERENCES users(id)",
    # drafts table
    "ALTER TABLE drafts ADD COLUMN firm_id TEXT REFERENCES firms(id)",
    # case_laws table
    "ALTER TABLE case_laws ADD COLUMN firm_id TEXT REFERENCES firms(id)",
    "ALTER TABLE case_laws ADD COLUMN created_by_id TEXT REFERENCES users(id)",
]

def column_exists(conn, table, column):
    result = conn.execute(text(f"PRAGMA table_info({table})"))
    cols = [row[1] for row in result]
    return column in cols

with engine.connect() as conn:
    for stmt in MIGRATIONS:
        # Parse table and column from ALTER TABLE statement
        parts = stmt.split()
        table = parts[2]
        col = parts[5]
        if column_exists(conn, table, col):
            print(f"  ⏭  SKIP  {table}.{col} already exists")
        else:
            try:
                conn.execute(text(stmt))
                conn.commit()
                print(f"  ✅ ADDED {table}.{col}")
            except Exception as e:
                print(f"  ❌ ERROR {table}.{col}: {e}")

    # Backfill: link existing clients and cases to the first/only admin user's firm
    print("\n🔧 Backfilling firm_id for existing records (using admin user's firm)...")
    # Find the super admin or first active user with a firm
    admin = conn.execute(text(
        "SELECT id, firm_id FROM users WHERE firm_id IS NOT NULL LIMIT 1"
    )).fetchone()

    if admin:
        admin_id, firm_id = admin
        for table in ["clients", "cases", "drafts", "case_laws"]:
            try:
                result = conn.execute(text(
                    f"UPDATE {table} SET firm_id = :fid WHERE firm_id IS NULL"
                ), {"fid": str(firm_id)})
                conn.commit()
                print(f"  ✅ Backfilled {result.rowcount} rows in {table}")
            except Exception as e:
                print(f"  ❌ Error backfilling {table}: {e}")
    else:
        print("  ⚠  No user with firm found — skipping backfill. Create a firm and user first.")

print("\n✅ Migration complete.")
