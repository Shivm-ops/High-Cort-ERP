#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
#  Fastcase ERP — DigitalOcean Droplet Automated Deployment Script
#  Target OS: Ubuntu 22.04 / 24.04 LTS (Recommended: 4GB RAM Droplet)
#  Usage: chmod +x deploy-digitalocean.sh && sudo ./deploy-digitalocean.sh
# ─────────────────────────────────────────────────────────────────────────────

set -e

# ── CONFIGURATION (MODIFY THESE BEFORE RUNNING) ──────────────────────────────
DOMAIN="fastcase.in"                      # Your registered domain
POSTGRES_PASSWORD="ChangeThisStrongPass1!" # Secure database password
SECRET_KEY="$(openssl rand -hex 32)"     # Auto-generated 64-char secret
JWT_SECRET="$(openssl rand -hex 32)"     # Auto-generated 64-char JWT secret
DEPLOY_DIR="/opt/fastcase"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# ─────────────────────────────────────────────────────────────────────────────

echo "=========================================================="
echo "  Deploying Fastcase ERP on DigitalOcean Droplet"
echo "  Target Domain: $DOMAIN"
echo "=========================================================="

# ── 1. System Updates & Prerequisites ────────────────────────────────────────
echo "[1/8] Updating package index..."
apt-get update -q
DEBIAN_FRONTEND=noninteractive apt-get upgrade -y -q

# ── 2. Setup Swap (Recommended for smooth Docker builds on VPS) ───────────────
echo "[2/8] Checking swap memory..."
if [ $(swapon --show | wc -l) -eq 0 ]; then
    echo "  Creating 2GB swap file to prevent OOM during builds..."
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    echo "  ✓ Swap enabled"
else
    echo "  ✓ Swap already active"
fi

# ── 3. Install Docker ─────────────────────────────────────────────────────────
echo "[3/8] Checking Docker installation..."
if ! command -v docker &>/dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    echo "  ✓ Docker installed"
else
    echo "  ✓ Docker already installed"
fi

# ── 4. Verify Docker Compose ──────────────────────────────────────────────────
echo "[4/8] Checking Docker Compose..."
if ! docker compose version &>/dev/null; then
    apt-get install -y -q docker-compose-plugin
    echo "  ✓ Docker Compose installed"
else
    echo "  ✓ Docker Compose available"
fi

# ── 5. Install Certbot & Configure UFW Firewall ───────────────────────────────
echo "[5/8] Configuring UFW Firewall and Certbot..."
apt-get install -y -q certbot ufw

ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
echo "  ✓ Firewall configured (Ports 22, 80, 443 open)"

# ── 6. Setup Directory & Files ────────────────────────────────────────────────
echo "[6/8] Synchronizing application files to $DEPLOY_DIR..."
mkdir -p "$DEPLOY_DIR"
if [ "$REPO_DIR" != "$DEPLOY_DIR" ]; then
    cp -r "$REPO_DIR"/. "$DEPLOY_DIR/"
fi
cd "$DEPLOY_DIR"

# ── 7. Generate Environment & Nginx Configs ───────────────────────────────────
echo "[7/8] Generating production environment configuration..."

cat > "$DEPLOY_DIR/.env" << EOF
DOMAIN=$DOMAIN
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
EOF

# Update domain in nginx configuration
sed -i "s/fastcase\.in/$DOMAIN/g" nginx/nginx.vps.conf
sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" nginx/nginx.vps.conf

cat > "$DEPLOY_DIR/backend/.env.production" << EOF
APP_NAME=Fastcase
APP_ENV=production
DEBUG=false
DOMAIN=$DOMAIN
SECRET_KEY=$SECRET_KEY
JWT_SECRET_KEY=$JWT_SECRET
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=120
REFRESH_TOKEN_EXPIRE_DAYS=7
REDIS_URL=redis://redis:6379/0
ELASTICSEARCH_URL=http://elasticsearch:9200
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
EOF

chmod 600 "$DEPLOY_DIR/backend/.env.production"
chmod 600 "$DEPLOY_DIR/.env"
echo "  ✓ Environment files generated"

# ── 8. Request SSL Certificates via Let's Encrypt ────────────────────────────
echo "[8/8] Requesting SSL certificates for domain: $DOMAIN and subdomains..."
mkdir -p /var/www/certbot

certbot certonly \
    --standalone \
    --non-interactive \
    --agree-tos \
    --email "admin@$DOMAIN" \
    -d "$DOMAIN" \
    -d "www.$DOMAIN" \
    -d "app.$DOMAIN" \
    -d "api.$DOMAIN" \
    -d "admin.$DOMAIN" \
    || echo "  ⚠ Notice: Certbot issuance failed or DNS is still propagating. You can rerun 'certbot certonly' once DNS propagates."

# Setup daily cron for SSL renewal
(crontab -l 2>/dev/null | grep -v 'certbot renew'; echo "0 3 * * * certbot renew --quiet && docker compose -f $DEPLOY_DIR/docker-compose.vps.yml restart nginx") | crontab -

echo ""
echo "=========================================================="
echo "  DigitalOcean Droplet Setup Complete!"
echo "=========================================================="
echo ""
echo "To build and start all containers in the background, run:"
echo "  cd $DEPLOY_DIR"
echo "  docker compose -f docker-compose.vps.yml up -d --build"
echo ""
echo "To initialize/seed the database:"
echo "  docker compose -f docker-compose.vps.yml exec backend python seed.py"
echo ""
echo "Your live endpoints will be:"
echo "  • Marketing / Landing:  https://$DOMAIN"
echo "  • Advocate ERP Portal:  https://app.$DOMAIN"
echo "  • Superadmin Portal:    https://admin.$DOMAIN"
echo "  • Backend API Docs:     https://api.$DOMAIN/api/docs"
echo "  • Backend Health:       https://api.$DOMAIN/health"
echo "=========================================================="
