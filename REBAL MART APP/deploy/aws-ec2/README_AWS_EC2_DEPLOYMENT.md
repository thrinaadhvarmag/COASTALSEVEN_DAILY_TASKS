# 🚀 AWS EC2 Production Deployment Guide for Rebel Mart

This guide contains everything you need to deploy **Rebel Mart** onto an **AWS EC2 (Elastic Compute Cloud)** virtual server with full SSL, reverse proxy, PostgreSQL, Redis, and automated updates.

> [!NOTE]
> These configuration files are prepared for **future AWS EC2 deployment**. They do **not** affect your current live deployment on **Vercel** (`https://rebel-mart.vercel.app`) and **Render** (`https://rebel-mart-api.onrender.com`).

---

## 🏗️ Architecture Overview on AWS EC2

```
                       [ Internet Users ]
                               │
                       Port 80 / 443 (HTTPS)
                               ▼
         ┌──────────────────────────────────────────────┐
         │              AWS EC2 Instance                │
         │                                              │
         │   ┌──────────────────────────────────────┐   │
         │   │   Nginx Reverse Proxy & SSL Router   │   │
         │   └──────┬────────────────────┬──────────┘   │
         │          │                    │              │
         │     /api, /ws, /uploads       / (SPA)        │
         │          ▼                    ▼              │
         │   ┌──────────────┐     ┌──────────────┐      │
         │   │ FastAPI App  │     │ React SPA    │      │
         │   │ (Port 8000)  │     │ (Port 80)    │      │
         │   └──────┬───────┘     └──────────────┘      │
         │          │                                   │
         │     ┌────┴────────────┐                      │
         │     ▼                 ▼                      │
         │ ┌────────────┐  ┌───────────┐                │
         │ │ PostgreSQL │  │  Redis 7  │                │
         │ │ (Port 5432)│  │ (Port 6379│                │
         │ └────────────┘  └───────────┘                │
         └──────────────────────────────────────────────┘
```

---

## 📋 Step 1: Launch Your AWS EC2 Instance

1. Log into your [AWS Management Console](https://console.aws.amazon.com/ec2).
2. Go to **EC2 Dashboard** → Click **Launch instance**.
3. **Name**: `rebel-mart-production`
4. **Application and OS Images (AMI)**:
   - Select **Ubuntu** → Choose **Ubuntu Server 24.04 LTS (HVM)**, 64-bit (x86).
5. **Instance Type**:
   - Recommended: **`t3.small`** (2 vCPU, 2 GB RAM) or **`t3.medium`** (2 vCPU, 4 GB RAM).
6. **Key pair (login)**:
   - Create a new key pair or choose an existing one (e.g. `rebelmart-key.pem`). Download and keep it safe!
7. **Network settings (Security Group)**:
   - Create a security group with the following rules:
     | Type | Protocol | Port Range | Source | Description |
     |---|---|---|---|---|
     | **SSH** | TCP | 22 | `My IP` (or `0.0.0.0/0`) | Secure Terminal Access |
     | **HTTP** | TCP | 80 | `0.0.0.0/0` | Web Traffic |
     | **HTTPS** | TCP | 443 | `0.0.0.0/0` | Secure SSL Web Traffic |
8. **Configure Storage**:
   - Set size to **25 GiB** or **30 GiB** (General Purpose SSD gp3).
9. Click **Launch instance**.

---

## 🌐 Step 2: Assign an Elastic IP (Recommended)

1. Under **Network & Security** in the EC2 sidebar, click **Elastic IPs**.
2. Click **Allocate Elastic IP address** → **Allocate**.
3. Select the allocated IP → Click **Actions** → **Associate Elastic IP address**.
4. Select your `rebel-mart-production` instance and associate it.
   *(This ensures your IP never changes when the instance restarts).*

---

## 💻 Step 3: Connect to Your EC2 Instance

Open terminal or PowerShell on your computer:

```bash
# Set key permissions (macOS / Linux)
chmod 400 rebelmart-key.pem

# Connect to the instance
ssh -i rebelmart-key.pem ubuntu@YOUR_EC2_ELASTIC_IP
```

---

## 🚀 Step 4: Clone the Repo & Run One-Click Setup

Once connected to your EC2 instance:

```bash
# 1. Clone the repository
git clone https://github.com/thrinaadhvarmag/COASTALSEVEN_DAILY_TASKS.git
cd "COASTALSEVEN_DAILY_TASKS/REBAL MART APP/deploy/aws-ec2"

# 2. Configure production secrets
cp .env.ec2.template .env.ec2
nano .env.ec2
# (Fill in your RESEND_API_KEY, JWT secret, database password, etc.)

# 3. Run the automated setup script
sudo bash setup-ec2.sh
```

The script will automatically:
- Install Docker CE and Docker Compose.
- Configure UFW firewall for ports 22, 80, and 443.
- Build and start all 5 containers (Proxy, Frontend, Backend, PostgreSQL, Redis).
- Install a `systemd` auto-start service so containers restart automatically on server boot.

---

## 🔒 Step 5: Enable Free Let's Encrypt SSL (HTTPS)

Once your custom domain (e.g. `rebelmart.com`) points to your EC2 Elastic IP in DNS (A record):

```bash
# Request your free SSL certificate
sudo docker compose -f docker-compose.ec2.yml run --rm certbot certonly --webroot --webroot-path=/var/www/certbot -d yourdomain.com -d www.yourdomain.com
```

The `certbot` container will automatically renew your certificates every 12 hours in the background.

---

## 🛠️ Maintenance & Useful Commands

| Task | Command (run inside `deploy/aws-ec2/`) |
|---|---|
| **View Running Containers** | `sudo docker compose -f docker-compose.ec2.yml ps` |
| **Check Live Backend Logs** | `sudo docker compose -f docker-compose.ec2.yml logs -f backend` |
| **Check Live Proxy Logs** | `sudo docker compose -f docker-compose.ec2.yml logs -f reverse-proxy` |
| **Restart Stack** | `sudo docker compose -f docker-compose.ec2.yml restart` |
| **Stop Stack** | `sudo docker compose -f docker-compose.ec2.yml down` |
| **Deploy New Git Code** | `sudo bash deploy-update.sh` |
| **Database Backup** | `sudo docker exec -t rebelmart_postgres pg_dump -U postgres rebelmart > backup_$(date +%F).sql` |

---

## 📂 File Summary in `deploy/aws-ec2/`

- `docker-compose.ec2.yml`: Production Docker composition for all services.
- `nginx.ec2.conf`: Reverse proxy routing `/api`, `/ws`, `/uploads`, and frontend SPA.
- `.env.ec2.template`: Environment variable template for secrets.
- `setup-ec2.sh`: One-click setup script for Ubuntu EC2.
- `deploy-update.sh`: Zero-downtime rolling update script.
- `rebelmart.service`: Linux systemd unit for automatic recovery on reboot.
- `README_AWS_EC2_DEPLOYMENT.md`: This guide.
