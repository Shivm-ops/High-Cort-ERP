#!/bin/bash
# LegalOS Database Backup Script
# Schedule this via cron: 0 2 * * * /path/to/backend/scripts/backup.sh

set -e

BACKUP_DIR="/var/backups/lagalos"
DB_NAME="lagalos"
DB_USER="postgres"
DATE=$(date +"%Y%m%d_%H%M%S")
FILENAME="$BACKUP_DIR/lagalos_backup_$DATE.sql.gz"

# Create backup dir if not exists
mkdir -p "$BACKUP_DIR"

echo "Starting database backup for $DB_NAME..."

# Dump and compress
pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$FILENAME"

echo "Backup created successfully: $FILENAME"

# Optional: Sync to S3
# aws s3 cp "$FILENAME" s3://lagalos-db-backups/

# Cleanup backups older than 30 days
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +30 -exec rm {} \;

echo "Backup process completed."
