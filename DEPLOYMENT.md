# LegalOS Production Deployment Guide

## Prerequisites
- Server with Ubuntu 22.04 LTS or higher
- PostgreSQL 15+
- Redis 7+
- Node.js 18+
- Python 3.10+
- Nginx or Traefik
- AWS S3 bucket (or MinIO for self-hosted)

## 1. Database Setup
SQLite is **NOT** supported for production due to concurrency limits and UUID handling limitations.

1. Install PostgreSQL:
```bash
sudo apt update && sudo apt install postgresql postgresql-contrib
```
2. Create DB and User:
```sql
CREATE DATABASE lagalos_db;
CREATE USER lagalos_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE lagalos_db TO lagalos_user;
```

## 2. Backend Environment Variables
Create a `.env` file in the `backend/` directory:

```env
APP_ENV=production
DEBUG=False
SECRET_KEY=generate_a_very_long_random_string_here

DATABASE_URL=postgresql://lagalos_user:your_secure_password@localhost:5432/lagalos_db
REDIS_URL=redis://localhost:6379/0

JWT_SECRET_KEY=generate_another_long_random_string

AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=ap-south-1
AWS_S3_BUCKET=lagalos-production-docs
```

## 3. Running Backend Migrations
LegalOS uses Alembic (if enabled) or native SQLAlchemy initialization.
For Phase 2, initialize the schema:

```bash
source venv/bin/activate
pip install -r requirements.txt
python -c "from app.core.database import Base, engine; Base.metadata.create_all(bind=engine)"
python migrate_phase2.py
```

## 4. Running Backend with Gunicorn
Do not use `uvicorn --reload` in production.

```bash
pip install gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 127.0.0.1:8000
```

## 5. Frontend Environment Variables
Create `.env.production` in both `frontend/` and `admin/`:

```env
NEXT_PUBLIC_API_URL=https://api.lagalos.in/api/v1
```

## 6. Building Next.js Frontends
```bash
cd frontend
npm ci
npm run build
npm start -- -p 3000

cd ../admin
npm ci
npm run build
npm start -- -p 3001
```

## 7. Reverse Proxy (Nginx)
Configure Nginx to route traffic:
- `api.lagalos.in` -> `localhost:8000`
- `app.lagalos.in` -> `localhost:3000`
- `admin.lagalos.in` -> `localhost:3001`

Ensure SSL (Let's Encrypt / Certbot) is enabled for all domains.
