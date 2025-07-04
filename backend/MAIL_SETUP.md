# Mail Sistemi Kurulum Rehberi

## Genel Bakış

Kooperatif yönetim sistemine entegre edilmiş kapsamlı mail sistemi. Duyuru gönderme, aidat hatırlatmaları ve mail geçmişi takibi özelliklerini içerir.

## Özellikler

### 🔧 Backend Özellikler
- **Duyuru Gönderme**: Tüm ortaklara veya seçili ortaklara duyuru maili
- **Aidat Hatırlatmaları**: Otomatik aidat hatırlatma sistemi
- **Mail Geçmişi**: Gönderilen tüm maillerin loglanması
- **İstatistikler**: Mail gönderim başarı oranları ve istatistikler
- **HTML Template**: Profesyonel mail şablonları
- **Hata Yönetimi**: Başarısız gönderimler için hata loglama

### 🎨 Frontend Özellikler
- **Admin Dashboard Entegrasyonu**: Ana admin panelinde mail sistemi kartı
- **Üç Sekmeli Arayüz**: Mail Gönder, Geçmiş, İstatistikler
- **Kullanıcı Seçimi**: Hedef ortak seçim sistemi
- **Real-time Feedback**: Gönderim sonuçları ve ilerleme takibi
- **Responsive Design**: Mobil uyumlu tasarım

## Kurulum Adımları

### 1. Backend Paket Kurulumu
```bash
cd backend
npm install nodemailer @types/nodemailer
```

### 2. Database Migration
```sql
-- Mail sistemi tablolarını oluştur
psql -d your_database -f database/migrations/create_mail_system_tables.sql
```

### 3. Environment Variables (.env)
```bash
# Mail SMTP Ayarları
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password
```

#### Gmail App Password Oluşturma:
1. Google hesabına giriş yap
2. Hesap Ayarları > Güvenlik
3. 2 Adımlı Doğrulama'yı etkinleştir
4. Uygulama Parolaları > Mail için parola oluştur
5. Oluşturulan parolayı `MAIL_PASS`'e ekle

### 4. Diğer Mail Sağlayıcıları

#### Outlook/Hotmail:
```bash
MAIL_HOST=smtp-mail.outlook.com
MAIL_PORT=587
```

#### Yahoo Mail:
```bash
MAIL_HOST=smtp.mail.yahoo.com
MAIL_PORT=587
```

#### Özel SMTP:
```bash
MAIL_HOST=your-smtp-server.com
MAIL_PORT=587
MAIL_USER=your-email@domain.com
MAIL_PASS=your-password
```

## API Endpoints

### Mail Gönderme
```http
POST /api/mail/announcement
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "subject": "Önemli Duyuru",
  "message": "Duyuru mesajı buraya gelir...",
  "target_users": [1, 2, 3], // opsiyonel, boş bırakılırsa tüm kullanıcılara
  "sender_name": "Kooperatif Yönetimi"
}
```

### Aidat Hatırlatması
```http
POST /api/mail/fee-reminders
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "days_before": 7,
  "include_overdue": true
}
```

### Mail Geçmişi
```http
GET /api/mail/history?page=1&limit=50&mail_type=announcement&status=sent
Authorization: Bearer {admin_token}
```

### Mail İstatistikleri
```http
GET /api/mail/stats
Authorization: Bearer {admin_token}
```

## Database Tabloları

### mail_logs
- `id`: Primary key
- `sender_id`: Gönderen kullanıcı ID
- `recipient_email`: Alıcı email
- `subject`: Mail konusu
- `message`: Mail içeriği
- `status`: Durum (pending, sent, failed)
- `mail_type`: Mail tipi (announcement, fee_reminder)
- `sent_at`: Gönderim tarihi
- `error_message`: Hata mesajı (varsa)

### fee_reminders
- `id`: Primary key
- `membership_fee_id`: Aidat ID
- `reminder_type`: Hatırlatma tipi (email)
- `sent_date`: Gönderim tarihi
- `status`: Durum

### mail_templates (gelecekte kullanım için)
- Özelleştirilebilir mail şablonları
- Değişken sistemi
- Multi-language desteği hazırlığı

## Frontend Kullanımı

### Admin Dashboard'dan Erişim
1. Admin paneline giriş yap
2. "Mail Sistemi" kartına tıkla
3. Üç sekmeden birini seç:
   - **Mail Gönder**: Yeni duyuru veya hatırlatma
   - **Mail Geçmişi**: Gönderilen maillerin listesi
   - **İstatistikler**: Başarı oranları ve sayısal veriler

### Duyuru Gönderme
1. "Mail Gönder" sekmesini aç
2. Gönderen adı, konu ve mesajı yaz
3. Hedef ortakları seç (boş bırakırsan hepsine gider)
4. "Duyuru Gönder" butonuna tıkla

### Aidat Hatırlatması
1. "Mail Gönder" sekmesindeki "Aidat Hatırlatması" bölümünü kullan
2. Kaç gün öncesinden hatırlatma gönderileceğini seç
3. Gecikmiş aidatları dahil et seçeneğini işaretle
4. "Hatırlatma Gönder" butonuna tıkla

### Aidat Sayfasından Hızlı Erişim
- Aidat Yönetimi sayfasındaki "Hatırlatma Gönder" butonu artık mail sistemi kullanıyor
- Tek tıkla tüm gecikmiş ve yaklaşan aidatlar için mail gönderir

## Güvenlik

- Tüm mail işlemleri admin yetkisi gerektirir
- Mail gönderim logları tutulur
- Hata mesajları güvenli şekilde loglanır
- Rate limiting önerilir (üretim ortamında)

## Test Etme

### 1. Mail Ayarlarını Test Et
```bash
# Backend dizininde test scripti çalıştır
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});
transporter.verify((error, success) => {
  if (error) console.log('❌ Mail ayarları hatalı:', error);
  else console.log('✅ Mail ayarları doğru!');
});
"
```

### 2. Test Duyurusu Gönder
Admin panelinden kendine test maili gönder.

## Sorun Giderme

### Yaygın Hatalar

#### "Authentication failed"
- Gmail App Password doğru mu?
- 2FA etkin mi?
- Environment variables doğru set edilmiş mi?

#### "Connection timeout"
- SMTP host ve port doğru mu?
- Firewall SMTP portunu engelliyor mu?
- VPN kullanıyorsan devre dışı bırak

#### "Mail gönderildi ama ulaşmıyor"
- Spam klasörünü kontrol et
- Mail adreslerinin doğru olduğunu kontrol et
- Mail logs tablosundaki hata mesajlarını incele

### Log Kontrolü
```sql
-- Son 100 mail log'unu görüntüle
SELECT * FROM mail_logs ORDER BY created_at DESC LIMIT 100;

-- Başarısız gönderimler
SELECT * FROM mail_logs WHERE status = 'failed' ORDER BY created_at DESC;

-- İstatistikler
SELECT 
  mail_type,
  status,
  COUNT(*) as count 
FROM mail_logs 
GROUP BY mail_type, status;
```

## Gelecek Geliştirmeler

- [ ] SMS entegrasyonu
- [ ] Push notification
- [ ] Mail template editörü
- [ ] Toplu mail gönderim kuyruğu
- [ ] Mail delivery status tracking
- [ ] Unsubscribe sistemi
- [ ] Mail analytics ve açılma oranları

## Destek

Sorunlar için:
1. Backend console loglarını kontrol et
2. Database mail_logs tablosunu incele
3. SMTP ayarlarını test et
4. Issue oluştur veya yöneticiye başvur 