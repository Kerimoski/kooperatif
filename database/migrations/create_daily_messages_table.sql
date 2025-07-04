-- Günlük mesajlar tablosu
CREATE TABLE IF NOT EXISTS daily_messages (
    id SERIAL PRIMARY KEY,
    message TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_daily_messages_active ON daily_messages(is_active);
CREATE INDEX IF NOT EXISTS idx_daily_messages_order ON daily_messages(display_order);
CREATE INDEX IF NOT EXISTS idx_daily_messages_created_by ON daily_messages(created_by);

-- Trigger: Updated_at alanını otomatik güncelle
DROP TRIGGER IF EXISTS update_daily_messages_updated_at ON daily_messages;
CREATE TRIGGER update_daily_messages_updated_at 
    BEFORE UPDATE ON daily_messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Mesaj uzunluğu kontrolü için constraint
ALTER TABLE daily_messages ADD CONSTRAINT check_message_length CHECK (char_length(message) <= 500 AND char_length(message) > 0);

-- Varsayılan örnek mesajlar
INSERT INTO daily_messages (message, display_order, created_by, is_active) VALUES
('Kooperatifimize hoş geldiniz! Üyelik sürecinizle ilgili sorularınız için iletişime geçebilirsiniz.', 1, 1, true),
('Aylık toplantımız her ayın ilk Cumartesi günü saat 14:00''da gerçekleşmektedir.', 2, 1, true),
('Komisyon çalışmalarına katılım için profil sayfanızdan başvurabilirsiniz.', 3, 1, true)
ON CONFLICT DO NOTHING; 