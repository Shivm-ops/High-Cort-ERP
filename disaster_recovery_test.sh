#!/bin/bash
# disaster_recovery_test.sh
# Simulates a backup, database drop, and restore for LagalOS using SQLite (or PostgreSQL in prod)

echo "==============================================="
echo " LagalOS DISASTER RECOVERY & BACKUP SIMULATION   "
echo "==============================================="

DB_PATH="backend/lagalos.db"
BACKUP_PATH="backend/lagalos_backup_$(date +%s).sql"

echo "[1/4] Checking current database state..."
if [ ! -f "$DB_PATH" ]; then
    echo "ERROR: Database $DB_PATH not found. Run backend tests or migrations first."
    exit 1
fi
FILE_SIZE=$(wc -c < "$DB_PATH")
echo "      Current DB size: $FILE_SIZE bytes"

echo "[2/4] Simulating Daily Backup (Dumping database)..."
# Simulate pg_dump with sqlite3 dump
sqlite3 $DB_PATH .dump > $BACKUP_PATH
if [ $? -eq 0 ]; then
    echo "      ✅ Backup successful! Created: $BACKUP_PATH"
else
    echo "      ❌ Backup failed!"
    exit 1
fi

echo "[3/4] Simulating Catastrophic Data Loss..."
rm $DB_PATH
echo "      Database deleted! App is currently DOWN."
sleep 2

echo "[4/4] Executing Emergency Restoration..."
sqlite3 $DB_PATH < $BACKUP_PATH
if [ $? -eq 0 ]; then
    echo "      ✅ Restoration successful!"
else
    echo "      ❌ Restoration failed!"
    exit 1
fi

NEW_SIZE=$(wc -c < "$DB_PATH")
echo "      Restored DB size: $NEW_SIZE bytes"

echo "==============================================="
echo " DISASTER RECOVERY TEST: PASSED                "
echo "==============================================="
