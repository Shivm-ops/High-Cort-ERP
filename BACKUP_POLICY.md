# LegalOS Backup Policy

## Objective
Ensure all firm data, documents, and audit logs are secure, versioned, and recoverable in the event of hardware failure, accidental deletion, or disaster.

## 1. Database Backups (PostgreSQL)

### Schedule
- **Continuous / Write-Ahead Logs (WAL)**: Enabled in PostgreSQL for Point-In-Time-Recovery (PITR) with an RPO (Recovery Point Objective) of 5 minutes.
- **Daily Full Backups**: Automated `pg_dump` runs daily at 02:00 AM IST.

### Retention Policy
- Daily backups retained for 30 days.
- Weekly backups (Sunday) retained for 3 months.
- Monthly backups retained for 1 year.

### Implementation Command
```bash
# Example backup script (run via cron)
pg_dump -U postgres -h localhost -d lagalos_db -F c -f /backups/lagalos_db_$(date +\%F).dump
```

## 2. Document Storage (S3 / MinIO)

### Versioning
- S3 Bucket Versioning must be **ENABLED**. This protects against accidental overwrites or malicious deletions of documents.

### Cross-Region Replication (CRR)
- For disaster recovery, documents should be replicated to a secondary AWS region (e.g., `ap-south-2` if primary is `ap-south-1`).

## 3. Restoration Testing (Disaster Recovery)

Backups are only as good as the ability to restore them.

### Weekly Verification
- Every Sunday, a scheduled script must restore the latest daily backup to a staging database to verify integrity.

```bash
# Example restoration command
pg_restore -U postgres -h staging-db-host -d lagalos_staging_db -1 /backups/lagalos_db_latest.dump
```

## 4. Encryption
- **At Rest**: PostgreSQL volume encryption enabled (e.g., AWS EBS encryption). S3 bucket encryption enabled (SSE-S3 or SSE-KMS).
- **In Transit**: All backups transferred over TLS/SSL to offsite storage.
