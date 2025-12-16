# Ethiopian Maids Platform - Hasura VPS Migration Guide

## Complete Migration from Hasura Cloud to Self-Hosted on Hostinger VPS

**Estimated Time**: 2-3 hours
**Difficulty**: Medium
**Cost Savings**: ~$200/month → ~$6/month (97% reduction)

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Phase 1: Hostinger VPS Setup](#2-phase-1-hostinger-vps-setup)
3. [Phase 2: Install Required Software](#3-phase-2-install-required-software)
4. [Phase 3: Deploy Hasura Stack](#4-phase-3-deploy-hasura-stack)
5. [Phase 4: Configure SSL & Domain](#5-phase-4-configure-ssl--domain)
6. [Phase 5: Export from Hasura Cloud](#6-phase-5-export-from-hasura-cloud)
7. [Phase 6: Import to Self-Hosted](#7-phase-6-import-to-self-hosted)
8. [Phase 7: Update Your Application](#8-phase-7-update-your-application)
9. [Phase 8: Testing Checklist](#9-phase-8-testing-checklist)
10. [Phase 9: Go Live](#10-phase-9-go-live)
11. [Maintenance & Backups](#11-maintenance--backups)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Prerequisites

### What You Need Before Starting

- [ ] Hostinger VPS account (KVM 1 plan recommended - $5.99/mo)
- [ ] Domain name (or use Hostinger's free subdomain)
- [ ] SSH client (Terminal on Mac/Linux, or PuTTY on Windows)
- [ ] Your current Hasura Cloud admin secret
- [ ] Node.js installed locally (for Hasura CLI)
- [ ] 2-3 hours of uninterrupted time

### Install Hasura CLI Locally (Windows)

```powershell
# Open PowerShell as Administrator
npm install -g hasura-cli

# Verify installation
hasura version
```

---

## 2. Phase 1: Hostinger VPS Setup

### Step 1.1: Purchase VPS

1. Go to [Hostinger VPS](https://www.hostinger.com/vps-hosting)
2. Select **KVM 1** plan ($5.99/month)
   - 4GB RAM
   - 1 vCPU
   - 50GB NVMe SSD
   - 4TB Bandwidth
3. Choose **Ubuntu 22.04 LTS** as OS
4. Set a strong root password
5. Complete purchase

### Step 1.2: Get Your VPS Details

After setup, note down:
- **IP Address**: `xxx.xxx.xxx.xxx`
- **Root Password**: (the one you set)
- **SSH Port**: Usually `22`

### Step 1.3: Connect to VPS

```bash
# From your local terminal (Mac/Linux) or PowerShell (Windows)
ssh root@YOUR_VPS_IP

# Accept the fingerprint by typing 'yes'
# Enter your root password
```

---

## 3. Phase 2: Install Required Software

### Run These Commands on Your VPS

```bash
# ============================================
# STEP 2.1: Update System
# ============================================
apt update && apt upgrade -y

# ============================================
# STEP 2.2: Install Docker
# ============================================
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Verify Docker installation
docker --version
# Should show: Docker version 24.x.x or higher

# ============================================
# STEP 2.3: Install Docker Compose
# ============================================
apt install docker-compose-plugin -y

# Verify Docker Compose
docker compose version
# Should show: Docker Compose version v2.x.x

# ============================================
# STEP 2.4: Install Nginx
# ============================================
apt install nginx -y

# ============================================
# STEP 2.5: Install Certbot (for free SSL)
# ============================================
apt install certbot python3-certbot-nginx -y

# ============================================
# STEP 2.6: Install useful tools
# ============================================
apt install htop nano ufw -y

# ============================================
# STEP 2.7: Configure Firewall
# ============================================
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# Check firewall status
ufw status
```

---

## 4. Phase 3: Deploy Hasura Stack

### Step 3.1: Create Project Directory

```bash
mkdir -p /opt/ethiopian-maids-hasura
cd /opt/ethiopian-maids-hasura
```

### Step 3.2: Create Docker Compose File

```bash
cat > docker-compose.yml << 'DOCKEREOF'
version: '3.8'

services:
  # ==========================================
  # PostgreSQL Database
  # ==========================================
  postgres:
    image: postgres:15-alpine
    container_name: ethiomaids_postgres
    restart: always
    ports:
      - "127.0.0.1:5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: hasura
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ethiopian_maids
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U hasura -d ethiopian_maids"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ==========================================
  # Hasura GraphQL Engine
  # ==========================================
  hasura:
    image: hasura/graphql-engine:v2.36.0
    container_name: ethiomaids_hasura
    restart: always
    ports:
      - "127.0.0.1:8080:8080"
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      # Database Connection
      HASURA_GRAPHQL_DATABASE_URL: postgres://hasura:${POSTGRES_PASSWORD}@postgres:5432/ethiopian_maids

      # Admin & Security
      HASURA_GRAPHQL_ADMIN_SECRET: ${HASURA_ADMIN_SECRET}
      HASURA_GRAPHQL_ENABLE_CONSOLE: "true"
      HASURA_GRAPHQL_DEV_MODE: "false"

      # Firebase JWT Authentication
      HASURA_GRAPHQL_JWT_SECRET: |
        {
          "type": "RS256",
          "jwk_url": "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
          "audience": "${FIREBASE_PROJECT_ID}",
          "issuer": "https://securetoken.google.com/${FIREBASE_PROJECT_ID}"
        }

      # Unauthorized Role (for public queries)
      HASURA_GRAPHQL_UNAUTHORIZED_ROLE: anonymous

      # Performance & Connections
      HASURA_GRAPHQL_PG_CONNECTIONS: 50
      HASURA_GRAPHQL_WS_READ_COOKIE: "false"

      # Logging (reduce in production)
      HASURA_GRAPHQL_ENABLED_LOG_TYPES: "startup, http-log, webhook-log, websocket-log"

      # CORS - Update with your domains
      HASURA_GRAPHQL_CORS_DOMAIN: "https://ethiopianmaids.com,https://www.ethiopianmaids.com,http://localhost:5173,http://localhost:3000"

      # Enable experimental features
      HASURA_GRAPHQL_ENABLE_REMOTE_SCHEMA_PERMISSIONS: "true"
      HASURA_GRAPHQL_ENABLE_ALLOWLIST: "false"

    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/healthz"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

volumes:
  postgres_data:
    driver: local

networks:
  default:
    name: ethiopian_maids_network
DOCKEREOF
```

### Step 3.3: Create Environment File

**IMPORTANT**: Replace the placeholder values with your actual secrets!

```bash
cat > .env << 'ENVEOF'
# ==========================================
# Ethiopian Maids - Hasura VPS Configuration
# ==========================================

# PostgreSQL Password (generate a strong one)
POSTGRES_PASSWORD=REPLACE_WITH_STRONG_PASSWORD_32_CHARS

# Hasura Admin Secret (generate a strong one)
HASURA_ADMIN_SECRET=REPLACE_WITH_YOUR_NEW_ADMIN_SECRET

# Your Firebase Project ID (from your current .env)
FIREBASE_PROJECT_ID=REPLACE_WITH_YOUR_FIREBASE_PROJECT_ID
ENVEOF

# Generate strong passwords (run this and copy the outputs)
echo "=== GENERATE THESE PASSWORDS ==="
echo "POSTGRES_PASSWORD: $(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)"
echo "HASURA_ADMIN_SECRET: $(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)"
echo "================================="
```

### Step 3.4: Edit Environment File with Real Values

```bash
nano .env
# Replace the placeholder values with:
# 1. Generated POSTGRES_PASSWORD
# 2. Generated HASURA_ADMIN_SECRET
# 3. Your actual FIREBASE_PROJECT_ID (e.g., "ethiopian-maids-app")
# Press Ctrl+X, then Y, then Enter to save
```

### Step 3.5: Start Hasura Stack

```bash
cd /opt/ethiopian-maids-hasura

# Pull images
docker compose pull

# Start services
docker compose up -d

# Check status
docker compose ps

# View logs (wait for "server started")
docker compose logs -f hasura

# Press Ctrl+C to exit logs when you see:
# {"level":"info","msg":"starting API server"}
```

### Step 3.6: Verify Hasura is Running

```bash
# Test health endpoint
curl http://localhost:8080/healthz
# Should return: OK

# Test GraphQL endpoint
curl http://localhost:8080/v1/graphql \
  -H "Content-Type: application/json" \
  -H "x-hasura-admin-secret: YOUR_ADMIN_SECRET" \
  -d '{"query": "{ __typename }"}'
# Should return: {"data":{"__typename":"query_root"}}
```

---

## 5. Phase 4: Configure SSL & Domain

### Step 4.1: Point Domain to VPS

In your domain registrar (or Hostinger DNS):
1. Create an **A Record**:
   - **Name**: `hasura` (or `api`)
   - **Value**: `YOUR_VPS_IP`
   - **TTL**: 300

Wait 5-10 minutes for DNS propagation.

### Step 4.2: Configure Nginx

```bash
cat > /etc/nginx/sites-available/hasura << 'NGINXEOF'
# Ethiopian Maids - Hasura GraphQL Reverse Proxy
# Optimized for WebSocket subscriptions

upstream hasura {
    server 127.0.0.1:8080;
    keepalive 64;
}

server {
    listen 80;
    server_name hasura.yourdomain.com;  # CHANGE THIS

    # Redirect HTTP to HTTPS (after SSL is set up)
    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name hasura.yourdomain.com;  # CHANGE THIS

    # SSL configuration will be added by Certbot

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/hasura_access.log;
    error_log /var/log/nginx/hasura_error.log;

    # Increase timeouts for WebSocket connections
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 3600s;  # 1 hour for subscriptions

    location / {
        proxy_pass http://hasura;
        proxy_http_version 1.1;

        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Forward headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;

        # Buffer settings
        proxy_buffering off;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }

    # Health check endpoint
    location /healthz {
        proxy_pass http://hasura/healthz;
        proxy_http_version 1.1;
        access_log off;
    }
}
NGINXEOF
```

### Step 4.3: Update Domain in Nginx Config

```bash
# Replace 'hasura.yourdomain.com' with your actual domain
nano /etc/nginx/sites-available/hasura
# Press Ctrl+X, Y, Enter to save
```

### Step 4.4: Enable Site

```bash
# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Enable Hasura site
ln -sf /etc/nginx/sites-available/hasura /etc/nginx/sites-enabled/

# Test nginx configuration
nginx -t

# Reload nginx
systemctl reload nginx
```

### Step 4.5: Get Free SSL Certificate

```bash
# Get SSL certificate (replace with your domain)
certbot --nginx -d hasura.yourdomain.com

# Follow prompts:
# - Enter email for renewal notices
# - Agree to terms
# - Choose to redirect HTTP to HTTPS (recommended)

# Verify auto-renewal is set up
certbot renew --dry-run
```

### Step 4.6: Verify HTTPS Works

```bash
# Test HTTPS endpoint
curl https://hasura.yourdomain.com/healthz
# Should return: OK

# Test in browser
# Go to: https://hasura.yourdomain.com/console
# Login with your HASURA_ADMIN_SECRET
```

---

## 6. Phase 5: Export from Hasura Cloud

### Run These Commands on Your LOCAL Machine (Windows PowerShell)

```powershell
# Navigate to your project
cd C:\Users\umera\OneDrive\Documents\ethiopian-maids-monorepo

# Create migration directory
mkdir hasura-migration
cd hasura-migration

# Initialize Hasura project
hasura init ethiopian-maids --endpoint https://ethio-maids-01.hasura.app --admin-secret YOUR_CURRENT_CLOUD_SECRET

cd ethiopian-maids

# Export current metadata
hasura metadata export

# Create migration from existing database
hasura migrate create "init" --from-server --database-name default

# Export seeds (sample data) - optional
hasura seeds create initial_data --from-table profiles --database-name default
hasura seeds create initial_data --from-table maid_profiles --database-name default
```

### Verify Export

```powershell
# Check exported files
dir metadata
dir migrations

# You should see:
# metadata/
#   ├── actions.graphql
#   ├── actions.yaml
#   ├── allow_list.yaml
#   ├── cron_triggers.yaml
#   ├── databases/
#   ├── query_collections.yaml
#   ├── remote_schemas.yaml
#   ├── rest_endpoints.yaml
#   └── version.yaml
# migrations/
#   └── default/
#       └── XXXXXXXXXX_init/
#           ├── up.sql
#           └── down.sql
```

---

## 7. Phase 6: Import to Self-Hosted

### Step 6.1: Update Hasura Config

```powershell
# Still in hasura-migration/ethiopian-maids directory

# Edit config.yaml to point to new server
notepad config.yaml
```

Update the file:
```yaml
version: 3
endpoint: https://hasura.yourdomain.com
admin_secret: YOUR_NEW_VPS_ADMIN_SECRET
metadata_directory: metadata
actions:
  kind: synchronous
  handler_webhook_baseurl: http://localhost:3000
```

### Step 6.2: Apply Migrations

```powershell
# Apply database migrations (creates all tables)
hasura migrate apply --database-name default

# Check migration status
hasura migrate status --database-name default
```

### Step 6.3: Apply Metadata

```powershell
# Apply all metadata (permissions, relationships, etc.)
hasura metadata apply

# Reload metadata to ensure it's applied
hasura metadata reload

# Check for inconsistencies
hasura metadata inconsistency list
# Should return: "no inconsistent objects found"
```

### Step 6.4: Verify in Console

1. Open browser: `https://hasura.yourdomain.com/console`
2. Enter your admin secret
3. Go to **Data** tab - verify all tables exist
4. Go to **API** tab - test a simple query:

```graphql
query TestQuery {
  profiles_aggregate {
    aggregate {
      count
    }
  }
}
```

---

## 8. Phase 7: Update Your Application

### Step 7.1: Update Environment Variables

Edit your `.env` file in the project root:

```bash
# OLD VALUES (comment these out)
# VITE_HASURA_GRAPHQL_ENDPOINT=https://ethio-maids-01.hasura.app/v1/graphql
# VITE_HASURA_WS_ENDPOINT=wss://ethio-maids-01.hasura.app/v1/graphql

# NEW VALUES
VITE_HASURA_GRAPHQL_ENDPOINT=https://hasura.yourdomain.com/v1/graphql
VITE_HASURA_WS_ENDPOINT=wss://hasura.yourdomain.com/v1/graphql
HASURA_ADMIN_SECRET=YOUR_NEW_VPS_ADMIN_SECRET
```

### Step 7.2: Update Codegen Config

Edit `codegen.yml`:

```yaml
schema:
  - https://hasura.yourdomain.com/v1/graphql:
      headers:
        x-hasura-admin-secret: ${HASURA_ADMIN_SECRET}
```

### Step 7.3: Regenerate Types

```powershell
cd C:\Users\umera\OneDrive\Documents\ethiopian-maids-monorepo

# Regenerate GraphQL types
pnpm codegen
```

### Step 7.4: Test Locally

```powershell
# Start development server
pnpm dev

# Test in browser:
# 1. Login should work (Firebase Auth)
# 2. Dashboard should load data
# 3. Real-time notifications should work
# 4. Chat/messaging should work
```

---

## 9. Phase 8: Testing Checklist

### Critical Features to Test

| Feature | How to Test | Expected Result |
|---------|-------------|-----------------|
| **Login/Signup** | Create new account | User created, redirected to dashboard |
| **Profile Loading** | View any profile | Data loads, no errors |
| **Real-time Notifications** | Send a notification | Badge updates instantly |
| **Chat/Messaging** | Send a message | Message appears for recipient |
| **Job Listings** | View jobs page | Jobs load with filters |
| **Bookings** | Create a booking | Booking saved, confirmation shown |
| **Admin Dashboard** | Login as admin | Stats load, subscriptions work |
| **Search** | Search for maids | Results return correctly |
| **File Uploads** | Upload profile photo | Photo saves to Firebase Storage |

### Test Subscriptions (32 Active)

Open browser console and verify no WebSocket errors:
```javascript
// In browser console
// Should NOT see: WebSocket connection failed
// Should see: Connected to wss://hasura.yourdomain.com/...
```

---

## 10. Phase 9: Go Live

### Step 9.1: Migrate Production Data

```bash
# SSH to VPS
ssh root@YOUR_VPS_IP

# Connect to PostgreSQL
docker exec -it ethiomaids_postgres psql -U hasura -d ethiopian_maids

# Inside psql, verify tables
\dt
# Should list all your tables

\q
# Exit psql
```

### Step 9.2: Update Production Environment

For your deployed apps (Vercel, Netlify, etc.):
1. Go to your hosting dashboard
2. Update environment variables:
   - `VITE_HASURA_GRAPHQL_ENDPOINT=https://hasura.yourdomain.com/v1/graphql`
   - `VITE_HASURA_WS_ENDPOINT=wss://hasura.yourdomain.com/v1/graphql`
3. Trigger a new deployment

### Step 9.3: DNS Cutover

If migrating from Hasura Cloud with existing users:
1. Deploy with new endpoints
2. Monitor error rates
3. Keep Hasura Cloud running for 24-48 hours as fallback
4. Once stable, cancel Hasura Cloud subscription

---

## 11. Maintenance & Backups

### Automated Daily Backups

```bash
# Create backup script
cat > /opt/ethiopian-maids-hasura/backup.sh << 'BACKUPEOF'
#!/bin/bash
BACKUP_DIR="/opt/ethiopian-maids-hasura/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup PostgreSQL
docker exec ethiomaids_postgres pg_dump -U hasura ethiopian_maids | gzip > $BACKUP_DIR/db_$TIMESTAMP.sql.gz

# Backup Hasura metadata
cd /opt/ethiopian-maids-hasura
docker exec ethiomaids_hasura hasura-cli metadata export --admin-secret $HASURA_ADMIN_SECRET 2>/dev/null || true

# Keep only last 7 days
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/db_$TIMESTAMP.sql.gz"
BACKUPEOF

chmod +x /opt/ethiopian-maids-hasura/backup.sh

# Schedule daily backup at 3 AM
(crontab -l 2>/dev/null; echo "0 3 * * * /opt/ethiopian-maids-hasura/backup.sh >> /var/log/hasura_backup.log 2>&1") | crontab -
```

### Update Hasura (When Needed)

```bash
cd /opt/ethiopian-maids-hasura

# Backup first!
./backup.sh

# Pull new version
docker compose pull

# Restart with new version
docker compose up -d

# Check logs
docker compose logs -f hasura
```

### Monitor Disk Space

```bash
# Check disk usage
df -h

# Check Docker disk usage
docker system df

# Clean up old Docker images
docker system prune -a --volumes
```

---

## 12. Troubleshooting

### Problem: Hasura Won't Start

```bash
# Check logs
docker compose logs hasura

# Common issues:
# 1. Wrong admin secret format
# 2. PostgreSQL not ready
# 3. Firebase project ID incorrect
```

### Problem: WebSocket Subscriptions Not Working

```bash
# Check nginx config
nginx -t

# Ensure WebSocket headers are correct
# Check for proxy_set_header Upgrade $http_upgrade;

# Test WebSocket
wscat -c wss://hasura.yourdomain.com/v1/graphql
```

### Problem: SSL Certificate Issues

```bash
# Renew certificate manually
certbot renew

# Check certificate status
certbot certificates
```

### Problem: Database Connection Failed

```bash
# Check PostgreSQL is running
docker compose ps

# Check PostgreSQL logs
docker compose logs postgres

# Test connection
docker exec -it ethiomaids_postgres psql -U hasura -d ethiopian_maids -c "SELECT 1"
```

### Problem: Out of Memory

```bash
# Check memory usage
free -h
docker stats

# Add swap if needed
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

---

## Quick Reference Commands

```bash
# Start all services
docker compose up -d

# Stop all services
docker compose down

# View logs
docker compose logs -f

# Restart Hasura only
docker compose restart hasura

# Enter PostgreSQL
docker exec -it ethiomaids_postgres psql -U hasura -d ethiopian_maids

# Backup database
docker exec ethiomaids_postgres pg_dump -U hasura ethiopian_maids > backup.sql

# Restore database
cat backup.sql | docker exec -i ethiomaids_postgres psql -U hasura -d ethiopian_maids

# Check resource usage
htop
docker stats
```

---

## Cost Summary

| Item | Monthly Cost |
|------|-------------|
| Hostinger VPS KVM 1 | $5.99 |
| Domain (if needed) | $0-1 |
| SSL Certificate | $0 (Let's Encrypt) |
| **Total** | **~$6/month** |
| Previous (Hasura Cloud) | ~$200/month |
| **Savings** | **~$194/month (97%)** |

---

## Support & Resources

- Hasura Documentation: https://hasura.io/docs
- Docker Documentation: https://docs.docker.com
- Nginx Documentation: https://nginx.org/en/docs/
- Let's Encrypt: https://letsencrypt.org/docs/

---

**Created**: December 2025
**Project**: Ethiopian Maids Platform
**Migration Target**: Hasura Cloud → Self-Hosted on Hostinger VPS
