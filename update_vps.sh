#!/bin/bash

# Renkli output için
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 BBOM Eğitim Kooperatifi VPS Güncelleme${NC}"
echo -e "${BLUE}=========================================${NC}"

# VPS bilgileri
VPS_IP="104.247.173.29"
VPS_USER="root"
APP_DIR="/var/www/kooperatif"

echo -e "${YELLOW}📦 Local değişiklikleri GitHub'a push ediliyor...${NC}"
git add .
git commit -m "Default admin eklendi ve login sorunları düzeltildi"
git push origin main

echo -e "${YELLOW}🔄 VPS'ye bağlanılıyor ve güncelleme yapılıyor...${NC}"

ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP << 'EOF'
    set -e
    
    echo "📁 Uygulama dizinine gidiliyor..."
    cd /var/www/kooperatif
    
    echo "⬇️ Son değişiklikler GitHub'dan çekiliyor..."
    git pull origin main
    
    echo "🔧 Backend güncelleniyor..."
    cd backend
    npm install --production
    npm run build
    
    echo "🗃️ Default admin oluşturuluyor..."
    # PM2'yi yeniden başlat
    pm2 delete kooperatif-backend || true
    pm2 start ecosystem.config.js
    
    echo "📊 PM2 durumu:"
    pm2 status
    
    echo "✅ Backend güncelleme tamamlandı!"
    
    echo "🎨 Frontend güncelleniyor..."
    cd ../frontend
    npm install
    npm run build
    
    echo "🔄 Nginx yeniden başlatılıyor..."
    systemctl reload nginx
    
    echo "✅ Güncelleme tamamlandı!"
EOF

echo -e "${GREEN}🎉 VPS güncelleme başarıyla tamamlandı!${NC}"
echo -e "${BLUE}🌐 Site: https://koop.bbomizmir.org${NC}"
echo -e "${BLUE}👤 Admin: admin@koop.org | admin123${NC}" 