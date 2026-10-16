#!/usr/bin/env bash
# ==============================================================================
# REBEL MART — AUTOMATED AWS EC2 ONE-CLICK PROVISIONING SCRIPT
# Target OS: Ubuntu 22.04 LTS / Ubuntu 24.04 LTS
# ==============================================================================

set -e

echo "======================================================================"
echo "🚀 STARTING REBEL MART AWS EC2 AUTOMATED SETUP"
echo "======================================================================"

# 1. Verify Sudo / Root
if [ "$EUID" -ne 0 ]; then
  echo "❌ Please run this script with sudo: sudo bash setup-ec2.sh"
  exit 1
fi

# 2. System Update & Dependencies
echo "📦 Updating system packages..."
apt-get update -y
apt-get upgrade -y
apt-get install -y curl git ufw ca-certificates gnupg lsb-release

# 3. Install Docker Engine & Docker Compose Plugin (Official Docker Repository)
if ! command -v docker &> /dev/null; then
  echo "🐳 Installing official Docker Engine..."
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg

  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
    $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  systemctl enable docker
  systemctl start docker
  echo "✅ Docker installed successfully."
else
  echo "✅ Docker is already installed."
fi

# 4. Configure UFW Firewall for AWS EC2 Security
echo "🛡️ Configuring host firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP Web'
ufw allow 443/tcp comment 'HTTPS SSL'
ufw --force enable
echo "✅ Firewall active on ports 22, 80, 443."

# 5. Set Up Project Directories & Permissions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "📂 Project root detected at: $PROJECT_ROOT"
mkdir -p "$PROJECT_ROOT/backend/uploads"
chmod -R 775 "$PROJECT_ROOT/backend/uploads"

# 6. Prepare Environment Configuration
if [ ! -f "$SCRIPT_DIR/.env.ec2" ]; then
  echo "⚠️ .env.ec2 not found. Generating from template..."
  cp "$SCRIPT_DIR/.env.ec2.template" "$SCRIPT_DIR/.env.ec2"
  # Generate a cryptographically secure JWT secret
  RANDOM_SECRET=$(openssl rand -hex 32)
  sed -i "s/replace_with_random_64_character_hex_string_for_jwt_auth/$RANDOM_SECRET/g" "$SCRIPT_DIR/.env.ec2"
  echo "✅ Created $SCRIPT_DIR/.env.ec2 with new random SECRET_KEY."
fi

# 7. Build & Start Docker Compose Stack
echo "🚢 Building and launching Rebel Mart multi-container stack..."
cd "$SCRIPT_DIR"
docker compose -f docker-compose.ec2.yml build
docker compose -f docker-compose.ec2.yml up -d

# 8. Setup Systemd Service for Auto-Restart on EC2 Reboot
echo "⚙️ Installing systemd auto-restart service..."
cat <<EOF > /etc/systemd/system/rebelmart.service
[Unit]
Description=Rebel Mart Official Application Stack
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$SCRIPT_DIR
ExecStart=/usr/bin/docker compose -f docker-compose.ec2.yml up -d
ExecStop=/usr/bin/docker compose -f docker-compose.ec2.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable rebelmart.service

# 9. Verification & Health Output
echo ""
echo "======================================================================"
echo "🎉 REBEL MART IS NOW RUNNING ON AWS EC2!"
echo "======================================================================"
echo "Check running containers: sudo docker compose -f docker-compose.ec2.yml ps"
echo "View live server logs:    sudo docker compose -f docker-compose.ec2.yml logs -f"
echo "Public Access (HTTP):     http://$(curl -s ifconfig.me)"
echo "API Documentation:        http://$(curl -s ifconfig.me)/docs"
echo "======================================================================"
