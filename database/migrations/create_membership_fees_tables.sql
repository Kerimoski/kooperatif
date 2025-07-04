-- Aidat Takip Sistemi - Database Migration
-- Çalışma tarihi: 2025-06-16

-- Aidat Planları Tablosu
CREATE TABLE IF NOT EXISTS membership_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    period_months INTEGER NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Aidat Faturaları Tablosu
CREATE TABLE IF NOT EXISTS membership_fees (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    plan_id INTEGER REFERENCES membership_plans(id),
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    paid_date TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
    late_fee DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ödeme İşlemleri Tablosu
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    membership_fee_id INTEGER REFERENCES membership_fees(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'bank_transfer',
    transaction_id VARCHAR(100),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_by INTEGER REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Aidat Hatırlatmaları Tablosu
CREATE TABLE IF NOT EXISTS fee_reminders (
    id SERIAL PRIMARY KEY,
    membership_fee_id INTEGER REFERENCES membership_fees(id) ON DELETE CASCADE,
    reminder_type VARCHAR(20) DEFAULT 'email',
    sent_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'opened'))
);

-- Trigger'lar
CREATE OR REPLACE FUNCTION update_membership_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Membership plans trigger
DROP TRIGGER IF EXISTS update_membership_plans_updated_at ON membership_plans;
CREATE TRIGGER update_membership_plans_updated_at 
    BEFORE UPDATE ON membership_plans 
    FOR EACH ROW EXECUTE FUNCTION update_membership_updated_at();

-- Membership fees trigger
DROP TRIGGER IF EXISTS update_membership_fees_updated_at ON membership_fees;
CREATE TRIGGER update_membership_fees_updated_at 
    BEFORE UPDATE ON membership_fees 
    FOR EACH ROW EXECUTE FUNCTION update_membership_updated_at();

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_membership_fees_user ON membership_fees(user_id);
CREATE INDEX IF NOT EXISTS idx_membership_fees_status ON membership_fees(status);
CREATE INDEX IF NOT EXISTS idx_membership_fees_due_date ON membership_fees(due_date);
CREATE INDEX IF NOT EXISTS idx_payments_fee_id ON payments(membership_fee_id);
CREATE INDEX IF NOT EXISTS idx_fee_reminders_fee_id ON fee_reminders(membership_fee_id);

-- Örnek aidat planları
INSERT INTO membership_plans (name, amount, period_months, description, created_by) VALUES
('Standart Üyelik', 100.00, 1, 'Aylık standart üyelik aidatı', 1),
('3 Aylık Üyelik', 280.00, 3, '3 aylık üyelik aidatı (%7 indirim)', 1),
('6 Aylık Üyelik', 540.00, 6, '6 aylık üyelik aidatı (%10 indirim)', 1),
('Yıllık Üyelik', 1000.00, 12, 'Yıllık üyelik aidatı (%17 indirim)', 1),
('Öğrenci Üyeliği', 50.00, 1, 'Öğrenciler için indirimli aylık aidat', 1)
ON CONFLICT DO NOTHING; 