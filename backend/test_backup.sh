#!/bin/bash
set -e

echo "Starting PostgreSQL Backup & Disaster Recovery Test..."
echo "1. Dumping database to lagalos_db_backup.sql"
/opt/homebrew/opt/postgresql@18/bin/pg_dump -U lagalos -d lagalos_db -F c -f lagalos_db_backup.dump

echo "2. Dropping active database to simulate disaster..."
/opt/homebrew/opt/postgresql@18/bin/psql -U lagalos -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'lagalos_db';"
/opt/homebrew/opt/postgresql@18/bin/dropdb -U lagalos lagalos_db

echo "3. Recreating empty database..."
/opt/homebrew/opt/postgresql@18/bin/createdb -O lagalos lagalos_db

echo "4. Restoring database from backup..."
/opt/homebrew/opt/postgresql@18/bin/pg_restore -U lagalos -d lagalos_db -1 lagalos_db_backup.dump

echo "5. Verifying restoration..."
/opt/homebrew/opt/postgresql@18/bin/psql -U lagalos -d lagalos_db -c "SELECT count(*) as cases_recovered FROM cases;"
/opt/homebrew/opt/postgresql@18/bin/psql -U lagalos -d lagalos_db -c "SELECT count(*) as clients_recovered FROM clients;"

echo "Backup & Restore Test: SUCCESS"
