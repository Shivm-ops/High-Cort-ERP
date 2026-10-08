#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
#  Fastcase — Hostinger VPS Deployment Script
#  Run on a FRESH Ubuntu 22.04 VPS as root or sudo user
#  Usage:  chmod +x deploy-vps.sh && sudo ./deploy-vps.sh
# ─────────────────────────────────────────────────────────────────────────────

set -e

# ── CONFIG (EDIT THESE) ───────────────────────────────────────────────────────
DOMAIN="fastcase.in"              # ← Your actual domain from Hostinger
POSTGRES_PASSWORD="YourStrongPass1!" # ← Choose a strong DB password
SECRET_KEY="change-this-to-a-very-long-random-secret-key-min-32-chars"
JWT_SECRET="change-this-to-another-long-random-jwt-secret"
DEPLOY_DIR="/opt/fastcase"
REPO_DIR="$(pwd)"   # assumes script is run from project root
# ─────────────────────────────────────────────────────────────────────────────

echo "════════════════════════════════════════"
echo "  Fastcase VPS Deployment — $DOMAIN"
echo "════════════════════════════════════════"

# ── 1. System Update ──────────────────────────────────────────────────────────
echo "[1/8] Updating system..."
apt-get update -q && apt-get upgrade -y -q

# ── 2. Install Docker ─────────────────────────────────────────────────────────
echo "[2/8] Installing Docker..."
if ! command -v docker &>/dev/null; then
    curl -fsSL https://get.docker.com | sh
    usermod -aG docker $SUDO_USER || true
    systemctl enable docker
    systemctl start docker
    echo "  ✓ Docker installed"
else
    echo "  ✓ Docker already installed"
fi

# ── 3. Install Docker Compose (v2) ────────────────────────────────────────────
echo "[3/8] Installing Docker Compose..."
if ! docker compose version &>/dev/null; then
    COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep '"tag_name"' | cut -d '"' -f4)
    curl -SL "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-linux-x86_64" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    echo "  ✓ Docker Compose installed"
else
    echo "  ✓ Docker Compose already installed"
fi

# ── 4. Install Certbot ────────────────────────────────────────────────────────
echo "[4/8] Installing Certbot..."
apt-get install -y -q certbot
echo "  ✓ Certbot installed"

# ── 5. Configure Firewall ─────────────────────────────────────────────────────
echo "[5/8] Configuring firewall..."
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw --force enable
echo "  ✓ Firewall configured (22, 80, 443)"

# ── 6. Copy project files ─────────────────────────────────────────────────────
echo "[6/8] Setting up project directory..."
mkdir -p $DEPLOY_DIR
cp -r "$REPO_DIR"/. "$DEPLOY_DIR/"
cd "$DEPLOY_DIR"

# ── 7. Create environment files ───────────────────────────────────────────────
echo "[7/8] Creating environment files..."

# Create .env for docker-compose (root-level)
cat > "$DEPLOY_DIR/.env" << EOF
DOMAIN=$DOMAIN
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
EOF

# Patch nginx config with actual domain
sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" nginx/nginx.vps.conf

# Create backend production env file
cat > "$DEPLOY_DIR/backend/.env.production" << EOF
APP_NAME=Fastcase
APP_ENV=production
DEBUG=false
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
echo "  ✓ Environment files created"

# ── 8. Issue SSL Certificate via Certbot ──────────────────────────────────────
echo "[8/8] Issuing SSL certificates via Certbot..."
echo "  Make sure your DNS A records point to this VPS IP before continuing!"
echo ""

# Create certbot webroot dir
mkdir -p /var/www/certbot

# Temporarily start nginx on HTTP only (to validate ACME challenge)
# We use certbot standalone for initial issuance
certbot certonly \
    --standalone \
    --non-interactive \
    --agree-tos \
    --email "admin@fastcase.in" \
    -d "$DOMAIN" \
    -d "www.$DOMAIN" \
    -d "app.$DOMAIN" \
    -d "api.$DOMAIN" \
    -d "admin.$DOMAIN" \
    || echo "  ⚠ Certbot failed — you may need to run it manually after DNS is ready"

# Set up auto-renewal
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && docker compose -f $DEPLOY_DIR/docker-compose.vps.yml restart nginx") | crontab -

echo ""
echo "════════════════════════════════════════"
echo "  VPS Setup Complete!"
echo "════════════════════════════════════════"
echo ""
echo "  Next steps:"
echo "  1. cd $DEPLOY_DIR"
echo "  2. docker compose -f docker-compose.vps.yml up -d --build"
echo "  3. docker compose -f docker-compose.vps.yml exec backend python seed.py"
echo ""
echo "  URLs:"
echo "    https://$DOMAIN"
echo "    https://app.$DOMAIN"
echo "    https://admin.$DOMAIN"
echo "    https://api.$DOMAIN/api/docs"
echo ""
echo "  Default login: admin@fastcase.in / lagalos@2025"
echo ""
