# 🏢 Eğitim Kooperatifi Yönetim Sistemi

Modern, güvenli ve kullanıcı dostu kooperatif yönetim sistemi.

## 🌟 Özellikler

### 👥 Kullanıcı Yönetimi
- **Admin ve Üye rolleri** ile yetki yönetimi
- Güvenli kimlik doğrulama (JWT)
- Profil yönetimi ve güncelleme
- Excel ile toplu kullanıcı ekleme

### 🏢 Komisyon Sistemi
- Komisyon oluşturma ve yönetimi
- Üye atamaları ve rol yönetimi
- Komisyon linkleri ve dokümanları
- Katılım takibi

### 💰 Aidat Yönetimi
- Esnek aidat planları
- Otomatik vade hesaplama
- Ödeme takibi ve raporlama
- Gecikme cezası sistemi
- Excel raporları

### 📧 Mail Sistemi
- Toplu duyuru gönderimi
- Aidat hatırlatma mailleri
- Özelleştirilebilir mail şablonları
- Gönderim geçmişi ve istatistikler

### 📄 Doküman Yönetimi
- Güvenli dosya yükleme
- Kategori bazlı organizasyon
- Dosya paylaşımı ve erişim kontrolü

### 📊 Dashboard ve Raporlama
- Gerçek zamanlı istatistikler
- Grafik ve tablolar
- Excel export özelliği
- Aktivite takibi

### 📅 Takvim Sistemi
- Etkinlik planlama
- Toplantı takvimleri
- Hatırlatma sistemi

## 🛠️ Teknoloji Stack

### Backend
- **Node.js** + **TypeScript**
- **Express.js** framework
- **PostgreSQL** veritabanı
- **JWT** authentication
- **Nodemailer** mail sistemi
- **Multer** dosya yükleme

### Frontend
- **Next.js 15** + **TypeScript**
- **Tailwind CSS** styling
- **Heroicons** iconları
- **Axios** API client
- **React Hooks** state management

### DevOps
- **PM2** process manager
- **Nginx** reverse proxy
- **Ubuntu** server
- **SSL/TLS** güvenlik
- Otomatik backup sistemi

## 🚀 Hızlı Başlangıç

### 1. Repository'yi Klonlayın
```bash
git clone https://github.com/Kerimoski/kooperatif.git
cd kooperatif
```

### 2. Backend Kurulumu
```bash
cd backend
npm install
cp env.example .env
# .env dosyasını düzenleyin
npm run dev
```

### 3. Frontend Kurulumu
```bash
cd frontend
npm install
npm run dev
```

### 4. Veritabanı Kurulumu
```bash
# PostgreSQL kurulumu sonrası
psql -U postgres
CREATE DATABASE koop_db;
\q

# Migration'ları çalıştırın
cd database
psql -U postgres -d koop_db -f init.sql
```

## 🌐 Production Deployment

### Otomatik Deployment (Ubuntu/Debian)
```bash
wget https://raw.githubusercontent.com/Kerimoski/kooperatif/main/deploy.sh
chmod +x deploy.sh
sudo ./deploy.sh
```

### Manuel Deployment
Detaylı deployment rehberi için: [DEPLOYMENT.md](DEPLOYMENT.md)

## 📋 Environment Variables

### Backend (.env)
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=koop_db
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=24h

# Mail
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_app_password
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

## 🔒 Güvenlik

- JWT tabanlı kimlik doğrulama
- Rol bazlı yetki kontrolü
- SQL injection koruması
- XSS koruması
- CORS yapılandırması
- Rate limiting
- Secure headers

## 📚 API Dokümantasyonu

### Auth Endpoints
- `POST /api/auth/login` - Giriş yap
- `POST /api/auth/register` - Kayıt ol (Admin)
- `GET /api/auth/profile` - Profil bilgisi
- `POST /api/auth/change-password` - Şifre değiştir

### Dashboard Endpoints
- `GET /api/dashboard/stats` - İstatistikler
- `GET /api/dashboard/users` - Kullanıcı listesi

### Commission Endpoints
- `GET /api/commissions` - Komisyon listesi
- `POST /api/commissions` - Komisyon oluştur
- `PUT /api/commissions/:id` - Komisyon güncelle
- `DELETE /api/commissions/:id` - Komisyon sil

### Mail Endpoints
- `POST /api/mail/announcement` - Duyuru gönder
- `POST /api/mail/fee-reminders` - Aidat hatırlatması
- `GET /api/mail/history` - Mail geçmişi
- `GET /api/mail/stats` - Mail istatistikleri

### Membership Endpoints
- `GET /api/membership/plans` - Aidat planları
- `POST /api/membership/plans` - Plan oluştur
- `GET /api/membership/fees` - Aidatlar
- `POST /api/membership/fees` - Aidat oluştur
- `POST /api/membership/payments` - Ödeme kaydet

## 🔧 Development

### Backend Scripts
```bash
npm run dev      # Development server
npm run build    # TypeScript build
npm run start    # Production server
```

### Frontend Scripts
```bash
npm run dev      # Development server
npm run build    # Production build
npm run start    # Production server
npm run lint     # ESLint check
```

## 📊 Monitoring

### PM2 Commands
```bash
pm2 status              # Process durumu
pm2 logs kooperatif     # Logları görüntüle
pm2 restart kooperatif  # Restart
pm2 monit              # Monitoring dashboard
```

### Log Dosyaları
- Backend: `/var/www/kooperatif/backend/logs/`
- Nginx: `/var/log/nginx/`
- PostgreSQL: `/var/log/postgresql/`

## 🔄 Güncelleme

### Production Güncelleme
```bash
cd /var/www/kooperatif
./update.sh
```

### Development Güncelleme
```bash
git pull origin main
cd backend && npm install && npm run build
cd ../frontend && npm install && npm run build
```

## 💾 Backup

Otomatik backup sistemi günlük olarak çalışır:
- **Database backup**: `/var/backups/kooperatif/db_*.sql`
- **Files backup**: `/var/backups/kooperatif/files_*.tar.gz`
- **Retention**: 7 gün

Manuel backup:
```bash
/var/www/kooperatif/backup.sh
```

## 🐛 Troubleshooting

### Backend Issues
```bash
# Log kontrolü
pm2 logs kooperatif

# Restart
pm2 restart kooperatif

# Database connection test
psql -h localhost -U koop_user -d koop_production
```

### Frontend Issues
```bash
# Build errors
npm run build

# Clear cache
rm -rf .next node_modules
npm install
```

### Nginx Issues
```bash
# Config test
nginx -t

# Restart
systemctl restart nginx

# Log check
tail -f /var/log/nginx/error.log
```

## 🤝 Katkıda Bulunma

1. Repository'yi fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 📞 İletişim

**Proje Sahibi**: Kerimoski  
**GitHub**: [https://github.com/Kerimoski](https://github.com/Kerimoski)  
**Repository**: [https://github.com/Kerimoski/kooperatif](https://github.com/Kerimoski/kooperatif)

---

⭐ Projeyi beğendiyseniz star vermeyi unutmayın! 