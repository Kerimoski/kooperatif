-- Eğitim Kooperatifi Veritabanı Şeması

-- Kullanıcılar tablosu
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Komisyonlar tablosu
CREATE TABLE IF NOT EXISTS commissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    max_members INTEGER DEFAULT 10,
    current_members INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Komisyon üyeleri tablosu
CREATE TABLE IF NOT EXISTS commission_members (
    id SERIAL PRIMARY KEY,
    commission_id INTEGER REFERENCES commissions(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(commission_id, user_id)
);

-- Belgeler tablosu
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    category VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL,
    uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Takvim etkinlikleri tablosu
CREATE TABLE IF NOT EXISTS calendar_events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('duyuru', 'etkinlik', 'toplanti', 'egitim', 'diger')),
    start_date DATE NOT NULL,
    end_date DATE,
    start_time TIME,
    end_time TIME,
    is_all_day BOOLEAN DEFAULT false,
    location VARCHAR(255),
    color VARCHAR(20) DEFAULT 'blue',
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger: Updated_at alanını otomatik güncelle
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Users tablosu için trigger
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Commissions tablosu için trigger  
DROP TRIGGER IF EXISTS update_commissions_updated_at ON commissions;
CREATE TRIGGER update_commissions_updated_at 
    BEFORE UPDATE ON commissions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Calendar events tablosu için trigger
DROP TRIGGER IF EXISTS update_calendar_events_updated_at ON calendar_events;
CREATE TRIGGER update_calendar_events_updated_at 
    BEFORE UPDATE ON calendar_events 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Komisyon üye sayısını otomatik güncelle
CREATE OR REPLACE FUNCTION update_commission_member_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Yeni üye ekleme
    IF TG_OP = 'INSERT' THEN
        UPDATE commissions 
        SET current_members = current_members + 1 
        WHERE id = NEW.commission_id;
        RETURN NEW;
    END IF;
    
    -- Üye çıkarma
    IF TG_OP = 'DELETE' THEN
        UPDATE commissions 
        SET current_members = current_members - 1 
        WHERE id = OLD.commission_id;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS commission_member_count_trigger ON commission_members;
CREATE TRIGGER commission_member_count_trigger
    AFTER INSERT OR DELETE ON commission_members
    FOR EACH ROW EXECUTE FUNCTION update_commission_member_count();

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_commissions_active ON commissions(is_active);
CREATE INDEX IF NOT EXISTS idx_commission_members_commission ON commission_members(commission_id);
CREATE INDEX IF NOT EXISTS idx_commission_members_user ON commission_members(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events(start_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events(event_type);
CREATE INDEX IF NOT EXISTS idx_calendar_events_created_by ON calendar_events(created_by);

-- Varsayılan admin kullanıcısı (şifre: admin123)
INSERT INTO users (email, password, first_name, last_name, role, is_active) 
VALUES (
    'admin@koop.org', 
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewjyxjS5.ZjQjjG.',
    'Admin',
    'Kullanıcısı',
    'admin',
    true
) ON CONFLICT (email) DO NOTHING;

-- Örnek komisyon
INSERT INTO commissions (name, description, max_members, created_by)
VALUES (
    'Eğitim Komisyonu',
    'Kooperatif üyelerinin eğitim faaliyetlerini planlayan ve yürüten komisyon',
    15,
    1
) ON CONFLICT DO NOTHING; 

-- Mail sistemi tablolarını dahil et
-- Mail logları tablosu
CREATE TABLE IF NOT EXISTS mail_logs (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER REFERENCES users(id),
  recipient_email VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMP,
  error_message TEXT,
  mail_type VARCHAR(50) DEFAULT 'announcement' CHECK (mail_type IN ('announcement', 'fee_reminder', 'notification')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mail logs için indeksler
CREATE INDEX IF NOT EXISTS idx_mail_logs_recipient ON mail_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_mail_logs_type ON mail_logs(mail_type);
CREATE INDEX IF NOT EXISTS idx_mail_logs_status ON mail_logs(status);
CREATE INDEX IF NOT EXISTS idx_mail_logs_sent_at ON mail_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_mail_logs_created_at ON mail_logs(created_at);

-- Aidat hatırlatma tablosu
CREATE TABLE IF NOT EXISTS fee_reminders (
  id SERIAL PRIMARY KEY,
  membership_fee_id INTEGER REFERENCES membership_fees(id) ON DELETE CASCADE,
  reminder_type VARCHAR(20) DEFAULT 'email' CHECK (reminder_type IN ('email', 'sms', 'notification')),
  sent_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending')),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fee reminders için indeksler
CREATE INDEX IF NOT EXISTS idx_fee_reminders_fee_id ON fee_reminders(membership_fee_id);
CREATE INDEX IF NOT EXISTS idx_fee_reminders_type ON fee_reminders(reminder_type);
CREATE INDEX IF NOT EXISTS idx_fee_reminders_sent_date ON fee_reminders(sent_date); 