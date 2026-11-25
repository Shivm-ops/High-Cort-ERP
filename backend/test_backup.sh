#!/bin/bash
set -e

DB_NAME="${DB_NAME:-fastcase_db}"
DB_USER="${DB_USER:-fastcase}"
PG_BIN="${PG_BIN:-/opt/homebrew/opt/postgresql@18/bin}"

echo "Starting PostgreSQL Backup & Disaster Recovery Test..."
echo "1. Dumping database to ${DB_NAME}_backup.dump"
$PG_BIN/pg_dump -U "$DB_USER" -d "$DB_NAME" -F c -f "${DB_NAME}_backup.dump"

echo "2. Dropping active database to simulate disaster..."
$PG_BIN/psql -U "$DB_USER" -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME';"
$PG_BIN/dropdb -U "$DB_USER" "$DB_NAME"

echo "3. Recreating empty database..."
$PG_BIN/createdb -O "$DB_USER" "$DB_NAME"

echo "4. Restoring database from backup..."
$PG_BIN/pg_restore -U "$DB_USER" -d "$DB_NAME" -1 "${DB_NAME}_backup.dump"

echo "5. Verifying restoration..."
$PG_BIN/psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT count(*) as cases_recovered FROM cases;"
$PG_BIN/psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT count(*) as clients_recovered FROM clients;"

echo "Backup & Restore Test: SUCCESS"
