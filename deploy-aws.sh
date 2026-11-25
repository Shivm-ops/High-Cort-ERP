#!/bin/bash
set -e

# ─── Fastcase AWS Deployment Script ──────────────────────────────────────────
# Run this on a fresh Ubuntu 22.04 LTS EC2 instance.
# Usage: bash deploy-aws.sh

echo "==> [1/4] Installing Docker and system prerequisites..."
apt-get update -y
apt-get install -y docker.io docker-compose-plugin git curl
systemctl enable docker
systemctl start docker

echo "==> [2/4] Setting up 4GB swap space to prevent build OOM..."
if [ ! -f /swapfile ]; then
    fallocate -l 4G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    if ! grep -q "/swapfile" /etc/fstab; then
        echo '/swapfile none swap sw 0 0' >> /etc/fstab
    fi
    echo "  Swap created and enabled successfully."
else
    echo "  Swapfile already exists. Ensuring swapon is active..."
    swapon /swapfile 2>/dev/null || true
fi

echo "==> [3/4] Preparing environment files..."
if [ ! -f backend/.env.aws ] && [ -f backend/.env.aws.example ]; then
    cp backend/.env.aws.example backend/.env.aws
    echo "  Created backend/.env.aws from template."
fi

if [ ! -f .env.aws ]; then
    cat << 'EOF' > .env.aws
SERVER_IP=$(curl -s ifconfig.me)
POSTGRES_PASSWORD=fastcase_secure_aws_pass_2026
EOF
    echo "  Created default .env.aws."
fi

echo "==> [4/4] Ready to deploy Fastcase on AWS."
echo "To build and start the containers, run:"
echo "  export SERVER_IP=\$(curl -s ifconfig.me)"
echo "  export POSTGRES_PASSWORD=change_this_strong_password"
echo "  docker compose -f docker-compose.aws.yml up -d --build"
echo ""
echo "Services will be accessible at:"
echo "  - Marketing Website: http://\$SERVER_IP"
echo "  - ERP Application:   http://\$SERVER_IP:3000"
echo "  - Backend REST API:  http://\$SERVER_IP:8000/docs"
