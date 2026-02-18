#!/bin/bash
# ============================================
# Ethiopian Maids - VPS Security Hardening Script
# ============================================
# Run this script on your VPS to secure it
# Usage: bash vps-security-hardening.sh
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "============================================"
echo "  Ethiopian Maids - VPS Security Hardening"
echo "============================================"
echo -e "${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root${NC}"
    exit 1
fi

# ============================================
# Step 1: Create deploy user (non-root)
# ============================================
echo -e "${YELLOW}Step 1: Creating deploy user...${NC}"

DEPLOY_USER="deploy"
if id "$DEPLOY_USER" &>/dev/null; then
    echo "User '$DEPLOY_USER' already exists"
else
    useradd -m -s /bin/bash "$DEPLOY_USER"
    echo "Created user: $DEPLOY_USER"
fi

# Add to sudo group
usermod -aG sudo "$DEPLOY_USER"
echo "Added $DEPLOY_USER to sudo group"

# ============================================
# Step 2: Setup SSH directory for deploy user
# ============================================
echo -e "${YELLOW}Step 2: Setting up SSH for deploy user...${NC}"

DEPLOY_SSH_DIR="/home/$DEPLOY_USER/.ssh"
mkdir -p "$DEPLOY_SSH_DIR"
touch "$DEPLOY_SSH_DIR/authorized_keys"
chmod 700 "$DEPLOY_SSH_DIR"
chmod 600 "$DEPLOY_SSH_DIR/authorized_keys"
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_SSH_DIR"

echo -e "${GREEN}SSH directory ready at: $DEPLOY_SSH_DIR${NC}"
echo "Add your public key to: $DEPLOY_SSH_DIR/authorized_keys"

# ============================================
# Step 3: Update system packages
# ============================================
echo -e "${YELLOW}Step 3: Updating system packages...${NC}"
apt update && apt upgrade -y

# ============================================
# Step 4: Install security tools
# ============================================
echo -e "${YELLOW}Step 4: Installing security tools...${NC}"
apt install -y \
    fail2ban \
    ufw \
    unattended-upgrades \
    logwatch \
    rkhunter

# ============================================
# Step 5: Configure UFW Firewall
# ============================================
echo -e "${YELLOW}Step 5: Configuring firewall...${NC}"

# Reset UFW
ufw --force reset

# Default policies
ufw default deny incoming
ufw default allow outgoing

# Allow SSH (important: do this before enabling!)
ufw allow 22/tcp comment 'SSH'

# Allow HTTP and HTTPS
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'

# Enable UFW
ufw --force enable

echo -e "${GREEN}Firewall configured!${NC}"
ufw status verbose

# ============================================
# Step 6: Configure Fail2Ban
# ============================================
echo -e "${YELLOW}Step 6: Configuring Fail2Ban...${NC}"

cat > /etc/fail2ban/jail.local << 'FAIL2BANEOF'
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5
destemail = root@localhost
sendername = Fail2Ban
mta = sendmail
action = %(action_)s

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 24h

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 5

[nginx-botsearch]
enabled = true
filter = nginx-botsearch
port = http,https
logpath = /var/log/nginx/access.log
maxretry = 2
FAIL2BANEOF

systemctl enable fail2ban
systemctl restart fail2ban

echo -e "${GREEN}Fail2Ban configured!${NC}"

# ============================================
# Step 7: Harden SSH Configuration
# ============================================
echo -e "${YELLOW}Step 7: Hardening SSH configuration...${NC}"

# Backup original config
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

# Create secure SSH config
cat > /etc/ssh/sshd_config.d/99-security.conf << 'SSHEOF'
# Ethiopian Maids - SSH Security Configuration

# Disable root login (after setting up deploy user with SSH key)
# Uncomment this AFTER you have tested SSH key login with deploy user
# PermitRootLogin no

# Use SSH key authentication
PubkeyAuthentication yes

# Disable password authentication (after SSH keys are set up)
# Uncomment this AFTER you have tested SSH key login
# PasswordAuthentication no

# Disable empty passwords
PermitEmptyPasswords no

# Limit authentication attempts
MaxAuthTries 3

# Disable X11 forwarding
X11Forwarding no

# Set idle timeout (15 minutes)
ClientAliveInterval 300
ClientAliveCountMax 3

# Disable agent forwarding
AllowAgentForwarding no

# Limit users who can SSH
# AllowUsers deploy

# Use strong ciphers only
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com,aes128-gcm@openssh.com,aes256-ctr,aes192-ctr,aes128-ctr

# Strong key exchange algorithms
KexAlgorithms curve25519-sha256,curve25519-sha256@libssh.org,diffie-hellman-group16-sha512,diffie-hellman-group18-sha512

# Strong MACs
MACs hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com,hmac-sha2-512,hmac-sha2-256
SSHEOF

# Test SSH config
sshd -t && echo -e "${GREEN}SSH configuration valid${NC}" || echo -e "${RED}SSH configuration error!${NC}"

# Reload SSH (don't restart to avoid locking yourself out)
systemctl reload sshd

# ============================================
# Step 8: Configure automatic security updates
# ============================================
echo -e "${YELLOW}Step 8: Configuring automatic security updates...${NC}"

cat > /etc/apt/apt.conf.d/50unattended-upgrades << 'UPDATEEOF'
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}";
    "${distro_id}:${distro_codename}-security";
    "${distro_id}ESMApps:${distro_codename}-apps-security";
    "${distro_id}ESM:${distro_codename}-infra-security";
};

Unattended-Upgrade::Package-Blacklist {
};

Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::MinimalSteps "true";
Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";
Unattended-Upgrade::Remove-New-Unused-Dependencies "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
UPDATEEOF

cat > /etc/apt/apt.conf.d/20auto-upgrades << 'AUTOEOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
AUTOEOF

echo -e "${GREEN}Automatic security updates configured!${NC}"

# ============================================
# Step 9: Set proper file permissions
# ============================================
echo -e "${YELLOW}Step 9: Setting file permissions...${NC}"

# Secure home directories
chmod 700 /root
chmod 700 /home/*

# Secure SSH files
chmod 600 /etc/ssh/sshd_config

# Secure cron
chmod 700 /etc/cron.d
chmod 700 /etc/cron.daily
chmod 700 /etc/cron.hourly
chmod 700 /etc/cron.weekly
chmod 700 /etc/cron.monthly

echo -e "${GREEN}File permissions secured!${NC}"

# ============================================
# Step 10: Configure log rotation
# ============================================
echo -e "${YELLOW}Step 10: Configuring log rotation...${NC}"

cat > /etc/logrotate.d/ethiopian-maids << 'LOGEOF'
/var/log/nginx/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 $(cat /var/run/nginx.pid)
    endscript
}

/var/log/hasura_backup.log {
    weekly
    missingok
    rotate 4
    compress
    notifempty
}
LOGEOF

echo -e "${GREEN}Log rotation configured!${NC}"

# ============================================
# Step 11: Give deploy user access to web directories
# ============================================
echo -e "${YELLOW}Step 11: Setting up deploy user permissions...${NC}"

# Create web directory if not exists
mkdir -p /var/www/ethiopian-maids
chown -R "$DEPLOY_USER:www-data" /var/www/ethiopian-maids
chmod -R 775 /var/www/ethiopian-maids

# Allow deploy user to reload nginx
echo "$DEPLOY_USER ALL=(ALL) NOPASSWD: /bin/systemctl reload nginx" >> /etc/sudoers.d/deploy
chmod 440 /etc/sudoers.d/deploy

echo -e "${GREEN}Deploy user permissions configured!${NC}"

# ============================================
# Complete!
# ============================================
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  SECURITY HARDENING COMPLETE!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "============================================"
echo ""
echo "1. Generate SSH key on your LOCAL machine:"
echo "   ssh-keygen -t ed25519 -C 'ethiopian-maids-vps' -f ~/.ssh/id_ed25519_ethiopian_maids"
echo ""
echo "2. Copy your public key to the VPS:"
echo "   ssh-copy-id -i ~/.ssh/id_ed25519_ethiopian_maids.pub deploy@$(hostname -I | awk '{print $1}')"
echo ""
echo "3. Test SSH key login:"
echo "   ssh -i ~/.ssh/id_ed25519_ethiopian_maids deploy@$(hostname -I | awk '{print $1}')"
echo ""
echo "4. Once SSH key works, disable password auth:"
echo "   Edit /etc/ssh/sshd_config.d/99-security.conf"
echo "   Uncomment: PasswordAuthentication no"
echo "   Uncomment: PermitRootLogin no"
echo "   Run: systemctl reload sshd"
echo ""
echo "5. CHANGE THE ROOT PASSWORD:"
echo "   passwd root"
echo ""
echo "6. Update .env.vps with new SSH key path:"
echo "   VPS_SSH_KEY_PATH=~/.ssh/id_ed25519_ethiopian_maids"
echo "   VPS_USER=deploy"
echo ""
echo -e "${YELLOW}IMPORTANT: Test SSH key login BEFORE disabling password auth!${NC}"
echo ""
echo -e "${BLUE}Security Tools Installed:${NC}"
echo "  - Fail2Ban: Blocks brute force attacks"
echo "  - UFW: Firewall (ports 22, 80, 443 open)"
echo "  - Unattended-upgrades: Automatic security updates"
echo "  - Logwatch: Log monitoring"
echo ""
echo -e "${BLUE}Useful Commands:${NC}"
echo "  fail2ban-client status          # View banned IPs"
echo "  ufw status                      # View firewall rules"
echo "  journalctl -u sshd -f           # Monitor SSH logs"
echo "  lastlog                         # View last logins"
echo ""
