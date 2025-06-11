# BBOM Eğitim Kooperatifi Yönetim Sistemi

## 📋 Proje Hakkında

BBOM (Başka Bir Okul Mümkün) Eğitim Kooperatifi için geliştirilmiş modern, kullanıcı dostu yönetim sistemidir. Kooperatif üyelerinin komisyonlara katılımını, belge yönetimini ve takvim etkinliklerini kolaylaştırır.

## ✨ Özellikler

### 🔐 Kimlik Doğrulama & Yetkilendirme
- JWT tabanlı güvenli giriş sistemi
- Admin ve üye rolü ayrımı
- Güvenli şifre hash'leme

### 👥 Komisyon Yönetimi
- Komisyon oluşturma ve düzenleme
- Üye katılımı takibi
- Katılım durumu yönetimi
- İstatistikler ve raporlama

### 📄 Belge Yönetimi
- Kooperatif belgelerinin merkezi yönetimi
- Anasözleşme, tutanaklar ve önemli belgeler
- Güvenli dosya yükleme ve indirme
- Belge kategorilendirme

### 📅 Takvim Sistemi
- Google Calendar benzeri arayüz
- Etkinlik, duyuru, toplantı ve eğitim yönetimi
- Renk kodlaması ile kategorilendirme
- Responsive tasarım

### 🎨 Modern UI/UX
- Tailwind CSS ile responsive tasarım
- Gradient arka planlar ve animasyonlar
- Heroicons ile profesyonel ikonlar
- Mobile-first yaklaşım

## 🚀 Teknoloji Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **PostgreSQL** - Veritabanı
- **JWT** - Authentication
- **bcrypt** - Password hashing

### Frontend
- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling
- **Heroicons** - Icons
- **React Hooks** - State management

## 🔧 Kurulum

### Gereksinimler
- Node.js (v18+)
- PostgreSQL (v13+)
- npm veya yarn

### Adım Adım Kurulum

1. **Repository'yi klonlayın**
```bash
git clone https://github.com/Kerimoski/koop.git
cd koop
```

2. **PostgreSQL veritabanını hazırlayın**
```bash
# PostgreSQL'e bağlanın ve veritabanını oluşturun
createdb koop_db

# Veritabanı yapısını oluşturun
psql koop_db -f database/init.sql
psql koop_db -f database/migrations/create_calendar_events_table.sql
psql koop_db -f database/migrations/add_color_to_calendar_events.sql
```

3. **Backend kurulumu**
```bash
cd backend
npm install

# Environment variables (.env dosyası oluşturun)
cp .env.example .env
# .env dosyasını düzenleyin

# Sunucuyu başlatın
npm run dev
```

4. **Frontend kurulumu**
```bash
cd frontend
npm install

# Development sunucusunu başlatın
npm run dev
```

## 🔑 Giriş Bilgileri

**Admin Hesabı:**
- Email: `erdurunabdulkerim@gmail.com`
- Şifre: `52900061216Kk.`

## 🌐 Deployment

### Backend (Port 5001)
```bash
cd backend
npm run build
npm start
```

### Frontend (Port 3000)
```bash
cd frontend
npm run build
npm start
```

## 📁 Proje Yapısı

```
koop/
├── backend/                 # Backend API
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Auth & validation
│   │   ├── models/          # Data models
│   │   ├── routes/          # API routes
│   │   └── utils/           # Helper functions
│   └── package.json
├── frontend/                # Frontend React app
│   ├── src/
│   │   ├── app/             # Next.js app directory
│   │   ├── components/      # Reusable components
│   │   ├── hooks/           # Custom hooks
│   │   ├── lib/             # Utilities & API
│   │   └── types/           # TypeScript types
│   └── package.json
├── database/                # Database files
│   ├── init.sql             # Initial schema
│   └── migrations/          # Database migrations
└── README.md
```

## 🛡️ Güvenlik

- JWT token tabanlı authentication
- bcrypt ile şifre hash'leme
- SQL injection koruması
- CORS yapılandırması
- Input validasyon

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📝 Lisans

Bu proje BBOM Eğitim Kooperatifi için özel olarak geliştirilmiştir.

## 📞 İletişim

**Geliştirici:** Abdulkerim Erdurun
**Email:** erdurunabdulkerim@gmail.com

---

© 2025 BBOM Eğitim Kooperatifi. Tüm hakları saklıdır. 