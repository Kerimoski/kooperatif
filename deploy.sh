#!/bin/bash

# 🚀 Kooperatif VPS Deployment Script

set -e  # Exit on any error

echo "🚀 Kooperatif VPS Deployment Script"
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/var/www/kooperatif"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
DB_NAME="koop_production"
DB_USER="koop_user"

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root or with sudo
if [[ $EUID -ne 0 ]]; then
   print_error "Bu script sudo ile çalıştırılmalıdır"
   exit 1
fi

print_status "Deployment başlıyor..."

# 1. System Update
print_status "Sistem güncellemesi yapılıyor..."
apt update && apt upgrade -y

# 2. Install required packages
print_status "Gerekli paketler kuruluyor..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs git nginx postgresql postgresql-contrib ufw

# Install PM2 globally
npm install -g pm2

# 3. PostgreSQL Setup
print_status "PostgreSQL ayarlanıyor..."
systemctl enable postgresql
systemctl start postgresql

# Create database and user (if not exists)
sudo -u postgres psql << EOF
SELECT 'CREATE DATABASE $DB_NAME' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec
DO \$\$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = '$DB_USER') THEN
      CREATE USER $DB_USER WITH PASSWORD 'strong_password_change_this';
   END IF;
END
\$\$;
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
EOF

print_success "PostgreSQL kurulumu tamamlandı"

# 4. Create project directory
print_status "Proje dizini oluşturuluyor..."
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

# 5. Clone or update project
if [ ! -d ".git" ]; then
    print_status "Proje dosyaları kopyalanıyor..."
    # If running locally, copy current directory
    if [ -f "/Users/kerimoski/Desktop/koop/package.json" ]; then
        cp -r /Users/kerimoski/Desktop/koop/* .
        cp /Users/kerimoski/Desktop/koop/.gitignore . 2>/dev/null || true
    else
        print_warning "Git repository URL'ini manuel olarak eklemelisiniz"
        print_warning "Örnek: git clone https://github.com/username/koop.git ."
    fi
fi

# 6. Backend Setup
print_status "Backend kuruluyor..."
cd $BACKEND_DIR

# Install dependencies
npm ci --production

# Create production env file
if [ ! -f ".env.production" ]; then
    cp env.example .env.production
    print_warning ".env.production dosyasını manuel olarak düzenlemeyi unutmayın!"
fi

# Build TypeScript
npm run build

# Create logs directory
mkdir -p logs

# 7. Database Migration
print_status "Veritabanı migration'ları çalıştırılıyor..."
if [ -f "../database/init.sql" ]; then
    PGPASSWORD='strong_password_change_this' psql -h localhost -U $DB_USER -d $DB_NAME -f ../database/init.sql || print_warning "init.sql zaten çalıştırılmış olabilir"
fi

if [ -d "../database/migrations" ]; then
    for migration in ../database/migrations/*.sql; do
        if [ -f "$migration" ]; then
            print_status "Migration çalıştırılıyor: $(basename $migration)"
            PGPASSWORD='strong_password_change_this' psql -h localhost -U $DB_USER -d $DB_NAME -f "$migration" || print_warning "$(basename $migration) zaten çalıştırılmış olabilir"
        fi
    done
fi

print_success "Database migration'ları tamamlandı"

# 8. Frontend Build
print_status "Frontend build ediliyor..."
cd $FRONTEND_DIR

npm ci
npm run build

print_success "Frontend build tamamlandı"

# 9. PM2 Setup
print_status "PM2 ile backend başlatılıyor..."
cd $BACKEND_DIR

# Stop existing PM2 process if running
pm2 stop koop-backend 2>/dev/null || true
pm2 delete koop-backend 2>/dev/null || true

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

print_success "Backend PM2 ile başlatıldı"

# 10. Nginx Configuration
print_status "Nginx ayarlanıyor..."

# Backup existing default config
if [ -f "/etc/nginx/sites-enabled/default" ]; then
    mv /etc/nginx/sites-enabled/default /etc/nginx/sites-enabled/default.backup
fi

# Create new nginx config
cat > /etc/nginx/sites-available/kooperatif << 'EOF'
server {
    listen 80;
    server_name _;

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

# Enable the site
ln -sf /etc/nginx/sites-available/kooperatif /etc/nginx/sites-enabled/

# Test nginx config
nginx -t

# Start nginx
systemctl enable nginx
systemctl restart nginx

print_success "Nginx konfigürasyonu tamamlandı"

# 11. Firewall Setup
print_status "Firewall ayarlanıyor..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable

print_success "Firewall ayarlandı"

# 12. Create update script
print_status "Update script oluşturuluyor..."
cat > $PROJECT_DIR/update.sh << 'EOF'
#!/bin/bash
cd /var/www/kooperatif

echo "🔄 Güncelleme başlıyor..."

# Pull latest changes (if git repo)
if [ -d ".git" ]; then
    git pull origin main
fi

# Backend update
cd backend
npm ci --production
npm run build
pm2 restart koop-backend

# Frontend update
cd ../frontend
npm ci
npm run build

# Reload nginx
systemctl reload nginx

echo "✅ Güncelleme tamamlandı!"
echo "🌍 Site: http://$(curl -s ifconfig.me)"
EOF

chmod +x $PROJECT_DIR/update.sh

# 13. Create backup script
print_status "Backup script oluşturuluyor..."
cat > $PROJECT_DIR/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/kooperatif"

mkdir -p $BACKUP_DIR

echo "📦 Backup başlıyor..."

# Database backup
PGPASSWORD='strong_password_change_this' pg_dump -h localhost -U koop_user koop_production > $BACKUP_DIR/db_$DATE.sql

# Files backup
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /var/www/kooperatif --exclude=node_modules --exclude=.git

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "✅ Backup completed: $DATE"
EOF

chmod +x $PROJECT_DIR/backup.sh

# Add to crontab for daily backup
(crontab -l 2>/dev/null; echo "0 3 * * * $PROJECT_DIR/backup.sh >> /var/log/backup.log 2>&1") | crontab -

print_success "Backup sistemi kuruldu"

# 14. Final checks
print_status "Final kontroller yapılıyor..."

# Check if backend is running
sleep 5
if curl -s http://localhost:5001/api/health > /dev/null; then
    print_success "Backend başarıyla çalışıyor!"
else
    print_error "Backend çalışmıyor! pm2 logs koop-backend ile kontrol edin"
fi

# Check if nginx is serving
if curl -s http://localhost > /dev/null; then
    print_success "Nginx başarıyla çalışıyor!"
else
    print_error "Nginx çalışmıyor! systemctl status nginx ile kontrol edin"
fi

print_success "🎉 Deployment tamamlandı!"
echo ""
echo "==============================================="
echo "📝 ÖNEMLİ: Aşağıdaki adımları manuel olarak yapın:"
echo "==============================================="
echo ""
echo "1. 🔐 Environment variables'ları güncelleyin:"
echo "   nano $BACKEND_DIR/.env.production"
echo ""
echo "2. 📧 Mail ayarlarını yapın:"
echo "   - MAIL_USER: Gmail adresiniz"
echo "   - MAIL_PASS: Gmail App Password"
echo ""
echo "3. 🔑 JWT secret'ı değiştirin:"
echo "   - JWT_SECRET: Güçlü bir secret key"
echo ""
echo "4. 🗄️ Database şifresini güncelleyin:"
echo "   - DB_PASSWORD: PostgreSQL kullanıcı şifresi"
echo ""
echo "5. 🌐 Domain varsa Nginx config'i güncelleyin:"
echo "   nano /etc/nginx/sites-available/kooperatif"
echo ""
echo "6. 🔄 Değişiklikleri uygulamak için:"
echo "   $PROJECT_DIR/update.sh"
echo ""
echo "==============================================="
echo "🌍 Site adresi: http://$(curl -s ifconfig.me)"
echo "🔧 Backend logs: pm2 logs koop-backend"
echo "📊 PM2 status: pm2 status"
echo "🔄 Update: $PROJECT_DIR/update.sh"
echo "💾 Backup: $PROJECT_DIR/backup.sh"
echo "===============================================" 