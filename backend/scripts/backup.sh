#!/bin/bash
# Fastcase Database Backup Script
# Schedule this via cron: 0 2 * * * /path/to/backend/scripts/backup.sh

set -euo pipefail
umask 077

BACKUP_DIR="${BACKUP_DIR:-/var/backups/fastcase}"
DB_NAME="${DB_NAME:-fastcase_db}"
DB_USER="${DB_USER:-postgres}"
DATE=$(date +"%Y%m%d_%H%M%S")
RAW_FILENAME="$BACKUP_DIR/fastcase_backup_$DATE.sql.gz"
ENC_FILENAME="${RAW_FILENAME}.enc"

# Create backup dir with owner-only permissions
mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

if [ "${REQUIRE_ENCRYPTION:-false}" = "true" ] && [ -z "${BACKUP_PASSPHRASE:-}" ]; then
    echo "ERROR: REQUIRE_ENCRYPTION=true but BACKUP_PASSPHRASE is not set." >&2
    exit 1
fi

echo "Starting database backup for $DB_NAME..."

if [ -n "${BACKUP_PASSPHRASE:-}" ]; then
    pg_dump -U "$DB_USER" "$DB_NAME" | gzip | openssl enc -aes-256-cbc -pbkdf2 -salt -pass env:BACKUP_PASSPHRASE -out "$ENC_FILENAME"
    chmod 600 "$ENC_FILENAME"
    echo "Encrypted backup created successfully: $ENC_FILENAME"
else
    pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$RAW_FILENAME"
    chmod 600 "$RAW_FILENAME"
    echo "Backup created successfully: $RAW_FILENAME"
fi

# Cleanup backups older than 30 days
find "$BACKUP_DIR" -type f \( -name "*.sql.gz" -o -name "*.sql.gz.enc" \) -mtime +30 -exec rm {} \;

echo "Backup process completed."
