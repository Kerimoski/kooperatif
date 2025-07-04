-- Mail sistemi için gerekli tablolar

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

-- Mail template tablosu (gelecekte özelleştirilebilir şablonlar için)
CREATE TABLE IF NOT EXISTS mail_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  template_type VARCHAR(50) NOT NULL CHECK (template_type IN ('announcement', 'fee_reminder', 'welcome', 'notification')),
  subject_template VARCHAR(500) NOT NULL,
  body_template TEXT NOT NULL,
  variables TEXT, -- JSON formatında değişken listesi
  is_active BOOLEAN DEFAULT true,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mail templates için indeksler
CREATE INDEX IF NOT EXISTS idx_mail_templates_type ON mail_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_mail_templates_active ON mail_templates(is_active);

-- Varsayılan mail şablonları
INSERT INTO mail_templates (name, template_type, subject_template, body_template, variables, created_by) VALUES 
('default_announcement', 'announcement', '{subject}', '{message}', '["subject", "message", "sender_name"]', 1),
('default_fee_reminder', 'fee_reminder', '{fee_type} Aidat Hatırlatması', 'Merhaba {user_name}, {plan_name} aidatınızın vadesi {due_date} tarihinde dolacaktır. Lütfen ödemenizi zamanında yapınız.', '["user_name", "plan_name", "due_date", "fee_type", "amount"]', 1)
ON CONFLICT (name) DO NOTHING;

-- Mail ayarları tablosu
CREATE TABLE IF NOT EXISTS mail_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT,
  description TEXT,
  updated_by INTEGER REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Varsayılan mail ayarları
INSERT INTO mail_settings (setting_key, setting_value, description, updated_by) VALUES 
('smtp_host', 'smtp.gmail.com', 'SMTP sunucu adresi', 1),
('smtp_port', '587', 'SMTP port numarası', 1),
('smtp_secure', 'false', 'SMTP güvenli bağlantı (true/false)', 1),
('from_email', 'noreply@koop.com', 'Gönderen email adresi', 1),
('from_name', 'Kooperatif Yönetimi', 'Gönderen adı', 1),
('auto_reminder_enabled', 'true', 'Otomatik hatırlatma aktif mi', 1),
('reminder_days_before', '7', 'Kaç gün öncesinden hatırlatma gönderilsin', 1)
ON CONFLICT (setting_key) DO NOTHING; 