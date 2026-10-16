#!/usr/bin/env bash
# ==============================================================================
# REBEL MART — ONE-COMMAND ROLLING UPDATE SCRIPT FOR AWS EC2
# Usage: sudo bash deploy-update.sh
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "🔄 Pulling latest changes from GitHub main branch..."
cd "$PROJECT_ROOT"
git pull origin main

echo "🔨 Rebuilding and restarting containers..."
cd "$SCRIPT_DIR"
docker compose -f docker-compose.ec2.yml build backend frontend
docker compose -f docker-compose.ec2.yml up -d --no-deps backend frontend

echo "🧹 Cleaning up dangling build images to save disk space..."
docker image prune -f

echo "✅ Update complete! All services running cleanly."
docker compose -f docker-compose.ec2.yml ps
