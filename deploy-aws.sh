#!/bin/bash
set -e

# ─── LegalOS AWS Emergency Deployment Script ─────────────────────────────────
# Run this on a fresh Ubuntu 22.04 EC2 instance.
# Usage: bash deploy-aws.sh

echo "==> Installing Docker..."
apt-get update -y
apt-get install -y docker.io docker-compose-plugin git
systemctl enable docker
systemctl start docker

echo "==> Setting up 4GB swap (reduces t3.small OOM risk)..."
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

echo "==> Cloning repo..."
# Replace with your actual git repo URL
# git clone https://github.com/yourname/advocate-erp.git /opt/advocate-erp
# cd /opt/advocate-erp

echo "==> Copy .env.aws and backend/.env.aws then run:"
echo "    SERVER_IP=<your-ec2-ip> POSTGRES_PASSWORD=<strong-password> \\"
echo "    docker compose -f docker-compose.aws.yml up -d --build"
