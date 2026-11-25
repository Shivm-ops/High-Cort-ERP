#!/bin/bash
# Fastcase Database Backup Script
# Schedule this via cron: 0 2 * * * /path/to/backend/scripts/backup.sh

set -e

BACKUP_DIR="${BACKUP_DIR:-/var/backups/fastcase}"
DB_NAME="${DB_NAME:-fastcase_db}"
DB_USER="${DB_USER:-postgres}"
DATE=$(date +"%Y%m%d_%H%M%S")
FILENAME="$BACKUP_DIR/fastcase_backup_$DATE.sql.gz"

# Create backup dir if not exists
mkdir -p "$BACKUP_DIR"

echo "Starting database backup for $DB_NAME..."

# Dump and compress
pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$FILENAME"

echo "Backup created successfully: $FILENAME"

# Optional: Sync to S3
# aws s3 cp "$FILENAME" s3://fastcase-db-backups/

# Cleanup backups older than 30 days
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +30 -exec rm {} \;

echo "Backup process completed."
