# Fastcase ERP — DigitalOcean Deployment Guide

This guide walks you through deploying **Fastcase ERP** to a **DigitalOcean Droplet** using Docker Compose, Nginx reverse proxy, and automated Let's Encrypt SSL certificates.

---

## 1. Prerequisites

1. **DigitalOcean Account**: [digitalocean.com](https://cloud.digitalocean.com/)
2. **Droplet Sizing Recommendation**:
   - **OS**: Ubuntu 22.04 LTS or 24.04 LTS (x64)
   - **Size**: **Basic Droplet** (Regular or Premium AMD/Intel)
   - **RAM**: Minimum **4 GB RAM** (e.g. 2 vCPUs / 4GB RAM — $24/mo) to accommodate building frontend containers (Next.js), running PostgreSQL, Redis, and FastAPI.
   - **Authentication**: SSH Key (recommended) or Password
3. **Domain Name**:
   - Registered domain (e.g., from Namecheap, GoDaddy, Cloudflare, etc.).

---

## 2. Point DNS Records to Your DigitalOcean Droplet IP

In your domain's DNS management panel (or DigitalOcean Networking > Domains), create the following **A Records** pointing to your Droplet's Public IPv4 address (`YOUR_DROPLET_IP`):

| Type | Host / Name | Value / Points to | TTL |
|------|-------------|-------------------|-----|
| `A`  | `@`         | `YOUR_DROPLET_IP` | 300 / Auto |
| `A`  | `www`       | `YOUR_DROPLET_IP` | 300 / Auto |
| `A`  | `app`       | `YOUR_DROPLET_IP` | 300 / Auto |
| `A`  | `api`       | `YOUR_DROPLET_IP` | 300 / Auto |
| `A`  | `admin`     | `YOUR_DROPLET_IP` | 300 / Auto |

> ⏳ DNS changes may take **5–15 minutes** to propagate. Verify with:
> ```bash
> ping app.yourdomain.com
> ```

---

## 3. Upload Code to DigitalOcean Droplet

### Option A: Via SCP / SFTP (From Local PowerShell)
```powershell
# Run from your local machine:
scp -r "c:\Users\Admin\Downloads\high-cortERP\High-Cort-ERP" root@YOUR_DROPLET_IP:/opt/fastcase
```
*(Or use WinSCP / FileZilla to connect via SFTP port 22 and copy the folder to `/opt/fastcase`)*

### Option B: Via Git (If stored in GitHub / GitLab)
SSH into your droplet:
```bash
ssh root@YOUR_DROPLET_IP
mkdir -p /opt/fastcase
git clone <YOUR_GIT_REPO_URL> /opt/fastcase
cd /opt/fastcase
```

---

## 4. Run Automated Setup on DigitalOcean

Connect to your Droplet:
```bash
ssh root@YOUR_DROPLET_IP
cd /opt/fastcase
```

Edit your configuration in `deploy-digitalocean.sh` (or `nano deploy-digitalocean.sh`):
```bash
nano deploy-digitalocean.sh
```
Set your domain and database credentials:
```bash
DOMAIN="yourdomain.com"
POSTGRES_PASSWORD="YourStrongPasswordHere"
```

Make the script executable and execute it:
```bash
chmod +x deploy-digitalocean.sh
sudo ./deploy-digitalocean.sh
```

This script automatically:
1. Configures 2GB swap memory (prevents out-of-memory errors during build).
2. Installs Docker Engine and Docker Compose.
3. Sets up the UFW firewall (allowing SSH port 22, HTTP port 80, and HTTPS port 443).
4. Generates `.env` and `backend/.env.production`.
5. Requests Let's Encrypt SSL certificates for all your subdomains via Certbot.
6. Sets up automatic SSL renewal via cron.

---

## 5. Build and Start the Application

Once the script finishes:
```bash
cd /opt/fastcase
docker compose -f docker-compose.vps.yml up -d --build
```

Monitor container health:
```bash
docker compose -f docker-compose.vps.yml ps
```

---

## 6. Seed the Database (First-Time Only)

Populate default roles, superadmin user, and default settings:
```bash
docker compose -f docker-compose.vps.yml exec backend python seed.py
```

---

## 7. Access Your Services

| Service | Public URL | Description |
|---------|------------|-------------|
| **Marketing Website** | `https://yourdomain.com` | Public landing page |
| **Advocate ERP Portal**| `https://app.yourdomain.com` | Law firm / Advocate ERP dashboard |
| **Superadmin Portal** | `https://admin.yourdomain.com` | Fastcase Platform Superadmin |
| **Backend REST API**  | `https://api.yourdomain.com/health` | Health Check API |
| **API Documentation** | `https://api.yourdomain.com/api/docs` | Interactive Swagger API docs |

### Default Credentials (Seed Data):
- **Email**: `admin@yourdomain.com` (or `admin@fastcase.in`)
- **Password**: `lagalos@2025`
> ⚠️ **Important:** Change passwords immediately upon initial login.

---

## 8. Common Maintenance Commands

- **Check logs for a specific service**:
  ```bash
  docker compose -f docker-compose.vps.yml logs -f backend
  ```
- **Restart any service**:
  ```bash
  docker compose -f docker-compose.vps.yml restart backend nginx
  ```
- **Stop all services**:
  ```bash
  docker compose -f docker-compose.vps.yml down
  ```
- **Deploy updates / new code**:
  ```bash
  git pull
  docker compose -f docker-compose.vps.yml up -d --build
  ```
