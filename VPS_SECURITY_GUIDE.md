# VPS Security Guide - Ethiopian Maids Platform

## Overview

This guide walks you through securing your VPS after the credentials were exposed. Follow these steps **immediately**.

---

## Step 1: Change VPS Root Password (DO THIS NOW!)

Connect to your VPS and change the password:

```bash
ssh root@72.60.205.121
# Enter current password: 231987@HasuraVps

# Change password immediately
passwd root
# Enter new strong password (save it securely!)
```

**Generate a strong password:**
```bash
# Run this on VPS to generate a secure password
openssl rand -base64 24
```

---

## Step 2: Generate SSH Key (On Your LOCAL Machine)

Run these commands in **PowerShell on your Windows machine**:

```powershell
# Create SSH directory if it doesn't exist
mkdir -Force $env:USERPROFILE\.ssh

# Generate a new SSH key pair
ssh-keygen -t ed25519 -C "ethiopian-maids-vps" -f "$env:USERPROFILE\.ssh\id_ed25519_ethiopian_maids"

# View your public key (copy this for next step)
Get-Content "$env:USERPROFILE\.ssh\id_ed25519_ethiopian_maids.pub"
```

---

## Step 3: Add SSH Key to VPS

Connect to VPS and add your public key:

```bash
ssh root@72.60.205.121

# Create .ssh directory
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Add your public key (paste the key from Step 2)
nano ~/.ssh/authorized_keys
# Paste your public key, save with Ctrl+X, Y, Enter

chmod 600 ~/.ssh/authorized_keys
```

---

## Step 4: Test SSH Key Login

From your **local machine**, test the key login:

```powershell
ssh -i "$env:USERPROFILE\.ssh\id_ed25519_ethiopian_maids" root@72.60.205.121
```

If this works, proceed to Step 5. **If it fails, DO NOT proceed!**

---

## Step 5: Run Security Hardening Script

Upload and run the security script on your VPS:

```bash
# On VPS, download the script
curl -o /tmp/vps-security-hardening.sh https://raw.githubusercontent.com/YOUR_REPO/tools/vps-security-hardening.sh

# Or copy it manually
nano /tmp/vps-security-hardening.sh
# Paste the contents of tools/vps-security-hardening.sh

# Make executable and run
chmod +x /tmp/vps-security-hardening.sh
/tmp/vps-security-hardening.sh
```

---

## Step 6: Disable Password Authentication

**Only after SSH key login is confirmed working!**

```bash
# Edit SSH security config
nano /etc/ssh/sshd_config.d/99-security.conf

# Uncomment these lines:
PermitRootLogin no
PasswordAuthentication no

# Save and reload SSH
systemctl reload sshd
```

**Test in a new terminal before closing existing session!**

---

## Step 7: Update Local Configuration

Update your `.env.vps` file:

```ini
# VPS Connection (updated for SSH key)
VPS_HOST=72.60.205.121
VPS_USER=deploy
VPS_PASSWORD=
VPS_SSH_KEY_PATH=~/.ssh/id_ed25519_ethiopian_maids

# Deployment Paths
VPS_WEB_DIR=/var/www/ethiopian-maids
VPS_HASURA_DIR=/opt/ethiopian-maids-hasura

# SSH Port
VPS_SSH_PORT=22
```

---

## Security Checklist

| Task | Status |
|------|--------|
| Change root password | [ ] |
| Generate SSH key locally | [ ] |
| Add public key to VPS | [ ] |
| Test SSH key login | [ ] |
| Run security hardening script | [ ] |
| Create `deploy` user | [ ] |
| Disable password authentication | [ ] |
| Disable root login | [ ] |
| Update local `.env.vps` | [ ] |
| Test deployment with new credentials | [ ] |

---

## What the Security Script Does

1. **Creates `deploy` user** - Non-root user for deployments
2. **Configures UFW firewall** - Only ports 22, 80, 443 open
3. **Installs Fail2Ban** - Blocks brute force attacks
4. **Hardens SSH** - Strong ciphers, key-only auth
5. **Enables auto-updates** - Automatic security patches
6. **Sets proper permissions** - Secure file access

---

## Firewall Rules

After running the security script:

```
Port 22  (SSH)   - Open
Port 80  (HTTP)  - Open
Port 443 (HTTPS) - Open
All other ports  - Blocked
```

---

## Monitoring Commands

```bash
# Check who's banned by Fail2Ban
fail2ban-client status sshd

# View firewall rules
ufw status verbose

# Check recent logins
last -10

# Check failed login attempts
grep "Failed password" /var/log/auth.log | tail -20

# Monitor SSH in real-time
journalctl -u sshd -f
```

---

## Emergency Access

If you get locked out:

1. **Hostinger VPS Console** - Use the web-based VNC console in Hostinger panel
2. **Recovery Mode** - Boot into recovery mode from Hostinger panel
3. **Support** - Contact Hostinger support for emergency access

---

## Files Changed

| File | Purpose |
|------|---------|
| `.gitignore` | Added VPS files to ignore |
| `.env.vps` | Secure credential storage |
| `.env.vps.example` | Template for credentials |
| `deploy-to-vps.py` | Updated to use env vars |
| `tools/vps-security-hardening.sh` | Security hardening script |

---

## Quick Reference

```bash
# Connect with SSH key
ssh -i ~/.ssh/id_ed25519_ethiopian_maids deploy@72.60.205.121

# Deploy website
python deploy-to-vps.py

# Check VPS status
ssh deploy@72.60.205.121 "docker compose -f /opt/ethiopian-maids-hasura/docker-compose.yml ps"
```

---

**Created**: December 2025
**Security Level**: Production
