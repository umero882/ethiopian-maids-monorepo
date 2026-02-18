#!/bin/bash
# ============================================
# Ethiopian Maids - Hasura VPS Setup Script
# ============================================
# Run this script on your Hostinger VPS
# Usage: bash vps-setup.sh
# ============================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "============================================"
echo "  Ethiopian Maids - Hasura VPS Setup"
echo "============================================"
echo -e "${NC}"

# ============================================
# Step 1: Collect Configuration
# ============================================
echo -e "${YELLOW}Step 1: Configuration${NC}"
echo ""

read -p "Enter your domain for Hasura (e.g., hasura.yourdomain.com): " HASURA_DOMAIN
read -p "Enter your Firebase Project ID: " FIREBASE_PROJECT_ID
read -p "Enter your email for SSL certificate: " SSL_EMAIL

# Generate secure passwords
POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)
HASURA_ADMIN_SECRET=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)

echo ""
echo -e "${GREEN}Generated Credentials (SAVE THESE!):${NC}"
echo "============================================"
echo -e "POSTGRES_PASSWORD: ${YELLOW}$POSTGRES_PASSWORD${NC}"
echo -e "HASURA_ADMIN_SECRET: ${YELLOW}$HASURA_ADMIN_SECRET${NC}"
echo "============================================"
echo ""
read -p "Have you saved these credentials? (yes/no): " SAVED
if [ "$SAVED" != "yes" ]; then
    echo -e "${RED}Please save the credentials before continuing!${NC}"
    exit 1
fi

# ============================================
# Step 2: Update System
# ============================================
echo -e "${YELLOW}Step 2: Updating system...${NC}"
apt update && apt upgrade -y

# ============================================
# Step 3: Install Docker
# ============================================
echo -e "${YELLOW}Step 3: Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
else
    echo "Docker already installed"
fi

# Install Docker Compose plugin
apt install docker-compose-plugin -y

# ============================================
# Step 4: Install Nginx & Certbot
# ============================================
echo -e "${YELLOW}Step 4: Installing Nginx & Certbot...${NC}"
apt install nginx certbot python3-certbot-nginx -y

# ============================================
# Step 5: Install useful tools
# ============================================
echo -e "${YELLOW}Step 5: Installing utilities...${NC}"
apt install htop nano ufw curl -y

# ============================================
# Step 6: Configure Firewall
# ============================================
echo -e "${YELLOW}Step 6: Configuring firewall...${NC}"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# ============================================
# Step 7: Create Hasura Directory
# ============================================
echo -e "${YELLOW}Step 7: Setting up Hasura...${NC}"
mkdir -p /opt/ethiopian-maids-hasura
cd /opt/ethiopian-maids-hasura

# ============================================
# Step 8: Create Docker Compose File
# ============================================
cat > docker-compose.yml << 'DOCKEREOF'
version: '3.8'

services:
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
      HASURA_GRAPHQL_DATABASE_URL: postgres://hasura:${POSTGRES_PASSWORD}@postgres:5432/ethiopian_maids
      HASURA_GRAPHQL_ADMIN_SECRET: ${HASURA_ADMIN_SECRET}
      HASURA_GRAPHQL_ENABLE_CONSOLE: "true"
      HASURA_GRAPHQL_DEV_MODE: "false"
      HASURA_GRAPHQL_JWT_SECRET: '{"type":"RS256","jwk_url":"https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com","audience":"${FIREBASE_PROJECT_ID}","issuer":"https://securetoken.google.com/${FIREBASE_PROJECT_ID}","claims_namespace":"https://hasura.io/jwt/claims","claims_format":"json"}'
      HASURA_GRAPHQL_UNAUTHORIZED_ROLE: anonymous
      HASURA_GRAPHQL_PG_CONNECTIONS: 50
      HASURA_GRAPHQL_ENABLED_LOG_TYPES: "startup, http-log, webhook-log, websocket-log"
      HASURA_GRAPHQL_CORS_DOMAIN: "*"
      HASURA_GRAPHQL_ENABLE_REMOTE_SCHEMA_PERMISSIONS: "true"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/healthz"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

volumes:
  postgres_data:
DOCKEREOF

# ============================================
# Step 9: Create Environment File
# ============================================
cat > .env << ENVEOF
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
HASURA_ADMIN_SECRET=$HASURA_ADMIN_SECRET
FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID
ENVEOF

# ============================================
# Step 10: Start Docker Services
# ============================================
echo -e "${YELLOW}Step 10: Starting Hasura...${NC}"
docker compose pull
docker compose up -d

echo "Waiting for Hasura to start..."
sleep 30

# Check if Hasura is running
if curl -s http://localhost:8080/healthz | grep -q "OK"; then
    echo -e "${GREEN}Hasura is running!${NC}"
else
    echo -e "${RED}Hasura may still be starting. Check logs with: docker compose logs -f hasura${NC}"
fi

# ============================================
# Step 11: Configure Nginx
# ============================================
echo -e "${YELLOW}Step 11: Configuring Nginx...${NC}"
cat > /etc/nginx/sites-available/hasura << NGINXEOF
upstream hasura {
    server 127.0.0.1:8080;
    keepalive 64;
}

server {
    listen 80;
    server_name $HASURA_DOMAIN;

    location / {
        proxy_pass http://hasura;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 3600s;
        proxy_buffering off;
    }

    location /healthz {
        proxy_pass http://hasura/healthz;
        proxy_http_version 1.1;
        access_log off;
    }
}
NGINXEOF

rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/hasura /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# ============================================
# Step 12: Setup SSL (if domain is ready)
# ============================================
echo -e "${YELLOW}Step 12: Setting up SSL...${NC}"
echo ""
read -p "Is your domain ($HASURA_DOMAIN) already pointing to this server's IP? (yes/no): " DNS_READY

if [ "$DNS_READY" == "yes" ]; then
    certbot --nginx -d $HASURA_DOMAIN --non-interactive --agree-tos -m $SSL_EMAIL
    echo -e "${GREEN}SSL certificate installed!${NC}"
else
    echo -e "${YELLOW}Skipping SSL setup. Run this command after DNS is configured:${NC}"
    echo "certbot --nginx -d $HASURA_DOMAIN"
fi

# ============================================
# Step 13: Setup Backup Script
# ============================================
echo -e "${YELLOW}Step 13: Setting up backups...${NC}"
mkdir -p /opt/ethiopian-maids-hasura/backups

cat > /opt/ethiopian-maids-hasura/backup.sh << 'BACKUPEOF'
#!/bin/bash
BACKUP_DIR="/opt/ethiopian-maids-hasura/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
docker exec ethiomaids_postgres pg_dump -U hasura ethiopian_maids | gzip > $BACKUP_DIR/db_$TIMESTAMP.sql.gz
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete
echo "Backup completed: $BACKUP_DIR/db_$TIMESTAMP.sql.gz"
BACKUPEOF

chmod +x /opt/ethiopian-maids-hasura/backup.sh

# Schedule daily backup
(crontab -l 2>/dev/null; echo "0 3 * * * /opt/ethiopian-maids-hasura/backup.sh >> /var/log/hasura_backup.log 2>&1") | crontab -

# ============================================
# Step 14: Setup Swap (for memory management)
# ============================================
echo -e "${YELLOW}Step 14: Setting up swap...${NC}"
if [ ! -f /swapfile ]; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    echo -e "${GREEN}2GB swap added${NC}"
else
    echo "Swap already configured"
fi

# ============================================
# Complete!
# ============================================
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  SETUP COMPLETE!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "${BLUE}Your Hasura Configuration:${NC}"
echo "============================================"
echo -e "Domain: ${YELLOW}https://$HASURA_DOMAIN${NC}"
echo -e "Console: ${YELLOW}https://$HASURA_DOMAIN/console${NC}"
echo -e "GraphQL: ${YELLOW}https://$HASURA_DOMAIN/v1/graphql${NC}"
echo -e "WebSocket: ${YELLOW}wss://$HASURA_DOMAIN/v1/graphql${NC}"
echo ""
echo -e "Admin Secret: ${YELLOW}$HASURA_ADMIN_SECRET${NC}"
echo "============================================"
echo ""
echo -e "${BLUE}Update your .env file with:${NC}"
echo "VITE_HASURA_GRAPHQL_ENDPOINT=https://$HASURA_DOMAIN/v1/graphql"
echo "VITE_HASURA_WS_ENDPOINT=wss://$HASURA_DOMAIN/v1/graphql"
echo "HASURA_ADMIN_SECRET=$HASURA_ADMIN_SECRET"
echo ""
echo -e "${BLUE}Useful Commands:${NC}"
echo "  View logs:     docker compose logs -f hasura"
echo "  Restart:       docker compose restart"
echo "  Backup now:    /opt/ethiopian-maids-hasura/backup.sh"
echo "  Check status:  docker compose ps"
echo ""
echo -e "${GREEN}Next Step: Import your Hasura Cloud metadata${NC}"
echo "See: HASURA_VPS_MIGRATION_GUIDE.md Phase 6"
echo ""
