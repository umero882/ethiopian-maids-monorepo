#!/bin/bash
set -e

echo "🚀 Ethiopian Maids — Deploy Script"
cd /opt/ethiopian-maids-monorepo

echo "📥 Pulling latest..."
git pull origin main

echo "📦 Installing deps..."
pnpm install --frozen-lockfile

echo "🔨 Building..."
npx nx build web --configuration=production

echo "💾 Backing up current site..."
BACKUP="/var/www/ethiopianmaids.backup.$(date +%Y%m%d_%H%M%S)"
cp -r /var/www/ethiopianmaids "$BACKUP"

echo "🚀 Deploying..."
rsync -a --delete dist/apps/web/ /var/www/ethiopianmaids/
chown -R www-data:www-data /var/www/ethiopianmaids/

echo "🧹 Cleaning old backups (keep 2)..."
ls -dt /var/www/ethiopianmaids.backup.* | tail -n +3 | xargs rm -rf 2>/dev/null

echo "✅ Deploy complete! $(date)"
