# VPS Deployment Guide — Fastcase on Hostinger

## Prerequisites
- Hostinger VPS with **Ubuntu 22.04 LTS** (KVM2 or higher recommended — 4GB RAM min)
- Domain purchased from Hostinger

---

## Step 1 — Point Your Domain DNS to Your VPS

In **Hostinger hPanel → Domains → DNS Zone**, add these **A records**:

| Name | Type | Value |
|------|------|-------|
| `@` | A | `YOUR_VPS_IP` |
| `www` | A | `YOUR_VPS_IP` |
| `app` | A | `YOUR_VPS_IP` |
| `api` | A | `YOUR_VPS_IP` |
| `admin` | A | `YOUR_VPS_IP` |

> ⚠️ DNS propagation takes **5–30 minutes**. Do NOT proceed to SSL until DNS is live.

---

## Step 2 — Connect to Your VPS via SSH

In Hostinger hPanel → VPS → SSH Access, find your IP, then run from your local terminal:

```bash
ssh root@YOUR_VPS_IP
```

---

## Step 3 — Upload Project Files to VPS

On your **local machine**, run:

```bash
# Upload the project folder to VPS
scp -r "C:\Users\Admin\Downloads\high-cortERP\High-Cort-ERP" root@YOUR_VPS_IP:/opt/fastcase
```

Or use **FileZilla / WinSCP** (SFTP to `YOUR_VPS_IP`, port 22) and drag the folder to `/opt/fastcase`.

---

## Step 4 — Edit deploy-vps.sh with Your Details

On the VPS, open the deploy script and edit the config section:

```bash
cd /opt/fastcase
nano deploy-vps.sh
```

Change these values at the top:
```bash
DOMAIN="fastcase.in"           # your actual domain e.g. fastcase.in
POSTGRES_PASSWORD="StrongPass1!"  # strong unique password
SECRET_KEY="your-64-char-random-secret"
JWT_SECRET="another-64-char-random-secret"
```

---

## Step 5 — Run the Deployment Script

```bash
chmod +x deploy-vps.sh
sudo ./deploy-vps.sh
```

This script:
- Installs Docker & Docker Compose
- Installs Certbot (SSL)
- Configures UFW firewall
- Creates all environment files
- Issues SSL certificates for all 5 subdomains
- Sets up automatic SSL renewal (cron)

---

## Step 6 — Start the Application

```bash
cd /opt/fastcase
docker compose -f docker-compose.vps.yml up -d --build
```

Wait for all containers to become healthy:
```bash
docker compose -f docker-compose.vps.yml ps
```

---

## Step 7 — Initialize the Database

Run this **only once** after the first deployment:

```bash
docker compose -f docker-compose.vps.yml exec backend python seed.py
```

---

## Step 8 — Verify Everything is Running

| URL | Expected |
|-----|----------|
| `https://YOUR_DOMAIN` / `https://www.YOUR_DOMAIN` | **User Portal** (ERP workspace & login) |
| `https://admin.YOUR_DOMAIN` | **Superadmin Portal** |
| `https://api.YOUR_DOMAIN/health` | `{"status":"healthy"}` |
| `https://api.YOUR_DOMAIN/api/docs` | Swagger API docs |

---

## Login Credentials (after seed)

| Field | Value |
|-------|-------|
| **Email** | `admin@fastcase.in` |
| **Password** | `lagalos@2025` |

> ⚠️ Change these in production after first login!

---

## Useful Commands on VPS

```bash
# View all running containers
docker compose -f docker-compose.vps.yml ps

# View backend logs live
docker compose -f docker-compose.vps.yml logs -f backend

# Restart a service
docker compose -f docker-compose.vps.yml restart backend

# Update the app (after code changes)
cd /opt/fastcase
git pull  # or re-upload files
docker compose -f docker-compose.vps.yml up -d --build

# Renew SSL manually
certbot renew
docker compose -f docker-compose.vps.yml restart nginx
```

---

## Troubleshooting

**SSL cert fails?**
- Make sure DNS A records are pointing to the VPS
- Test with: `nslookup app.fastcase.in`

**Backend won't start?**
- Check logs: `docker compose -f docker-compose.vps.yml logs backend --tail 50`

**Port 80/443 in use?**
- Run: `sudo lsof -i :80` and kill whatever is occupying it

**Out of memory?**
- Upgrade to at least 4GB RAM VPS on Hostinger
- Elasticsearch is disabled to save RAM
