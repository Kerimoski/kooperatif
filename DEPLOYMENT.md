# 🚀 VPS Deployment Rehberi

## 📋 Ön Hazırlıklar

### 1. VPS Gereksinimleri
- **OS**: Ubuntu 20.04+ / CentOS 8+
- **RAM**: En az 2GB (4GB önerilir)
- **Disk**: En az 20GB
- **CPU**: 2 core önerilir

### 2. Domain ve DNS
- Domain adı (örn: kooperatif.com)
- A record: domain → VPS IP
- Subdomain (opsiyonel): api.kooperatif.com → VPS IP

## 🛠️ Sunucu Kurulumu

### 1. Sunucuya Bağlanma
```bash
ssh root@VPS_IP
# veya
ssh user@VPS_IP
```

### 2. Sistem Güncellemesi
```bash
# Ubuntu/Debian
apt update && apt upgrade -y

# CentOS/RHEL
yum update -y
```

### 3. Gerekli Paketleri Kurma
```bash
# Node.js 18+ kurulumu
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# Git, Nginx, PM2
apt install -y git nginx
npm install -g pm2

# PostgreSQL kurulumu
apt install -y postgresql postgresql-contrib
```

### 4. PostgreSQL Ayarları
```bash
# PostgreSQL kullanıcısına geç
sudo -u postgres psql

# Veritabanı ve kullanıcı oluştur
CREATE DATABASE koop_production;
CREATE USER koop_user WITH PASSWORD 'güçlü_parola_123';
GRANT ALL PRIVILEGES ON DATABASE koop_production TO koop_user;
\q
```

## 📁 Proje Deploy İşlemi

### 1. Proje Dizini Oluşturma
```bash
mkdir -p /var/www/kooperatif
cd /var/www/kooperatif
```

### 2. Git Clone
```bash
# GitHub'dan clone
git clone https://github.com/username/koop.git .

# veya dosyaları SCP ile yükle
# scp -r ./koop root@VPS_IP:/var/www/kooperatif/
```

### 3. Backend Kurulumu
```bash
cd backend

# Dependencies yükle
npm ci --production

# Production .env oluştur
cp env.example .env.production
```

### 4. Production Environment Variables
```bash
# .env.production dosyasını düzenle
nano .env.production
```

```env
# Sunucu Konfigürasyonu
NODE_ENV=production
PORT=5001

# PostgreSQL (Production)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=koop_production
DB_USER=koop_user
DB_PASSWORD=güçlü_parola_123

# JWT (Güçlü secret key)
JWT_SECRET=super-secure-production-jwt-key-change-this-123456789
JWT_EXPIRE=24h

# CORS (Domain adresi)
CORS_ORIGIN=https://kooperatif.com

# Mail Konfigürasyonu
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=bilgi@renkliorman.k12.tr
MAIL_PASS=gmail_app_password
MAIL_FROM_NAME=Eğitim Kooperatifi
```

### 5. Database Migration
```bash
# Database tablolarını oluştur
psql -h localhost -U koop_user -d koop_production -f ../database/init.sql
psql -h localhost -U koop_user -d koop_production -f ../database/migrations/*.sql
```

### 6. Frontend Build
```bash
cd ../frontend

# Dependencies yükle
npm ci

# Production build
npm run build
```

### 7. PM2 ile Backend'i Başlatma
```bash
cd ../backend

# PM2 ecosystem dosyası oluştur
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'koop-backend',
    script: 'src/index.ts',
    interpreter: 'node',
    interpreter_args: '--loader ts-node/esm',
    env: {
      NODE_ENV: 'production',
      PORT: 5001
    },
    env_file: '.env.production',
    instances: 2,
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
EOF

# Log klasörü oluştur
mkdir -p logs

# PM2 ile başlat
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 🌐 Nginx Konfigürasyonu

### 1. Nginx Site Konfigürasyonu
```bash
cat > /etc/nginx/sites-available/kooperatif << 'EOF'
server {
    listen 80;
    server_name kooperatif.com www.kooperatif.com;

    # Frontend (Next.js static files)
    location / {
        root /var/www/kooperatif/frontend/out;
        try_files $uri $uri.html $uri/ =404;
        index index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API Backend
    location /api/ {
        proxy_pass http://localhost:5001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}
EOF

# Site'ı aktifleştir
ln -s /etc/nginx/sites-available/kooperatif /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default

# Nginx'i test et ve başlat
nginx -t
systemctl enable nginx
systemctl restart nginx
```

### 2. SSL Sertifikası (Let's Encrypt)
```bash
# Certbot kurulumu
apt install -y certbot python3-certbot-nginx

# SSL sertifikası al
certbot --nginx -d kooperatif.com -d www.kooperatif.com

# Otomatik yenileme
crontab -e
# Şu satırı ekle:
# 0 2 * * * /usr/bin/certbot renew --quiet
```

## 🔒 Güvenlik Ayarları

### 1. Firewall Konfigürasyonu
```bash
# UFW kurulumu ve ayarları
apt install -y ufw

# Temel kurallar
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 'Nginx Full'

# Firewall'ı aktifleştir
ufw enable
```

### 2. PostgreSQL Güvenlik
```bash
# PostgreSQL erişimini sadece localhost'a kısıtla
nano /etc/postgresql/12/main/pg_hba.conf

# Bu satırı bul ve düzenle:
# local   all             all                                     md5
# host    all             all             127.0.0.1/32            md5

# PostgreSQL'i yeniden başlat
systemctl restart postgresql
```

### 3. PM2 Security
```bash
# PM2 logrotate
pm2 install pm2-logrotate

# PM2 monitoring (opsiyonel)
pm2 set pm2:autodump true
```

## 📊 Monitoring ve Maintenance

### 1. Log Monitoring
```bash
# PM2 logs
pm2 logs

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# PostgreSQL logs
tail -f /var/log/postgresql/postgresql-12-main.log
```

### 2. Backup Script
```bash
cat > /var/www/kooperatif/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/kooperatif"

mkdir -p $BACKUP_DIR

# Database backup
pg_dump -h localhost -U koop_user koop_production > $BACKUP_DIR/db_$DATE.sql

# Files backup
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /var/www/kooperatif --exclude=node_modules

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /var/www/kooperatif/backup.sh

# Günlük backup (crontab)
crontab -e
# Şu satırı ekle:
# 0 3 * * * /var/www/kooperatif/backup.sh >> /var/log/backup.log 2>&1
```

## 🔄 Deploy Script

### 1. Update Script
```bash
cat > /var/www/kooperatif/deploy.sh << 'EOF'
#!/bin/bash
echo "🚀 Deployment başlıyor..."

cd /var/www/kooperatif

# Git pull
echo "📦 Kod güncelleniyor..."
git pull origin main

# Backend update
echo "🔧 Backend güncelleniyor..."
cd backend
npm ci --production
pm2 restart koop-backend

# Frontend build
echo "🎨 Frontend build ediliyor..."
cd ../frontend
npm ci
npm run build

# Nginx reload
echo "🌐 Nginx yeniden yükleniyor..."
nginx -s reload

echo "✅ Deployment tamamlandı!"
echo "🌍 Site: https://kooperatif.com"
echo "📊 Logs: pm2 logs"
EOF

chmod +x /var/www/kooperatif/deploy.sh
```

## ✅ Deployment Checklist

### Pre-deployment:
- [ ] VPS hazır ve erişilebilir
- [ ] Domain DNS ayarları yapıldı
- [ ] Mail ayarları test edildi
- [ ] Environment variables kontrol edildi

### Deployment:
- [ ] Sunucu paketleri kuruldu
- [ ] PostgreSQL ayarlandı
- [ ] Proje dosyaları yüklendi
- [ ] Backend PM2 ile başlatıldı
- [ ] Frontend build edildi
- [ ] Nginx konfigüre edildi

### Post-deployment:
- [ ] SSL sertifikası kuruldu
- [ ] Güvenlik ayarları yapıldı
- [ ] Backup sistemi kuruldu
- [ ] Monitoring aktif
- [ ] Site test edildi

## 🆘 Troubleshooting

### Backend başlamıyor:
```bash
pm2 logs koop-backend
pm2 restart koop-backend
```

### Database bağlantı hatası:
```bash
psql -h localhost -U koop_user -d koop_production
# .env.production'da şifre kontrolü
```

### Nginx 502 hatası:
```bash
# Backend'in çalıştığını kontrol et
curl http://localhost:5001/api/health
# Nginx loglarını kontrol et
tail -f /var/log/nginx/error.log
```

### SSL sorunları:
```bash
certbot certificates
certbot renew --dry-run
```

---

Bu rehberi takip ederek sitenizi production'a çıkarabilirsiniz! 🚀 