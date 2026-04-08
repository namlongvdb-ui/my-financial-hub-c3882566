-- ============================================
-- KHỞI TẠO CƠ SỞ DỮ LIỆU - PostgreSQL 18
-- Máy chủ: 10.24.16.77
-- ============================================

-- Tạo database (chạy với quyền postgres)
-- CREATE DATABASE tai_chinh_cong_doan ENCODING 'UTF8' LC_COLLATE 'vi_VN.UTF-8' LC_CTYPE 'vi_VN.UTF-8';

-- Tạo user
-- CREATE USER finance_admin WITH PASSWORD 'YOUR_STRONG_PASSWORD';
-- GRANT ALL PRIVILEGES ON DATABASE union_finance TO finance_admin;

-- ============================================
-- ENUM TYPES
-- ============================================
CREATE TYPE app_role AS ENUM ('admin', 'lanh_dao', 'nguoi_lap', 'ke_toan', 'phu_trach_dia_ban');
CREATE TYPE voucher_type AS ENUM ('thu', 'chi', 'tham-hoi', 'de-nghi');
CREATE TYPE gender_type AS ENUM ('nam', 'nu');

-- ============================================
-- BẢNG USERS (thay thế auth.users của Supabase)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BẢNG PROFILES
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT,
    username TEXT,
    assigned_area TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- ============================================
-- BẢNG USER_ROLES
-- ============================================
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, role)
);

-- ============================================
-- BẢNG TRANSACTIONS (chứng từ)
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    voucher_no VARCHAR(20) NOT NULL,
    type voucher_type NOT NULL,
    amount NUMERIC(15,0) NOT NULL DEFAULT 0,
    description TEXT,
    person_name TEXT,
    department TEXT,
    account_code VARCHAR(20),
    approver TEXT,
    attachments INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    year INTEGER NOT NULL,
    -- Extra fields for tham-hoi
    recipient_name TEXT,
    reason TEXT,
    -- Extra fields for de-nghi
    bank_account TEXT,
    bank_account_name TEXT,
    bank_name TEXT,
    times TEXT
);

CREATE INDEX idx_transactions_year ON transactions(year);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_voucher_no ON transactions(voucher_no);

-- ============================================
-- BẢNG DIGITAL_SIGNATURES
-- ============================================
CREATE TABLE IF NOT EXISTS digital_signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    public_key TEXT NOT NULL,
    encrypted_private_key TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT NOT NULL
);

-- ============================================
-- BẢNG VOUCHER_SIGNATURES
-- ============================================
CREATE TABLE IF NOT EXISTS voucher_signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voucher_id TEXT NOT NULL,
    voucher_type TEXT NOT NULL,
    signer_id UUID NOT NULL REFERENCES users(id),
    signature TEXT NOT NULL,
    data_hash TEXT NOT NULL,
    signed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(voucher_id, voucher_type, signer_id)
);

-- ============================================
-- BẢNG PENDING_VOUCHERS
-- ============================================
CREATE TABLE IF NOT EXISTS pending_vouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voucher_id TEXT NOT NULL,
    voucher_type TEXT NOT NULL,
    voucher_data JSONB NOT NULL,
    status TEXT DEFAULT 'pending',
    created_by TEXT NOT NULL,
    signed_at TIMESTAMPTZ,
    printed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BẢNG NOTIFICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    related_voucher_id TEXT,
    related_voucher_type TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BẢNG STAFF (cán bộ - đoàn viên)
-- ============================================
CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    department TEXT,
    position TEXT,
    birth_date DATE,
    gender gender_type DEFAULT 'nam',
    salary_coefficient NUMERIC(5,2) DEFAULT 0,
    position_coefficient NUMERIC(5,2) DEFAULT 0,
    regional_salary NUMERIC(15,0) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BẢNG TRANSFER_HISTORY (lịch sử điều chuyển)
-- ============================================
CREATE TABLE IF NOT EXISTS transfer_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    staff_name TEXT NOT NULL,
    from_department TEXT,
    to_department TEXT,
    type VARCHAR(10) DEFAULT 'move',
    date DATE,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BẢNG ORG_SETTINGS (cài đặt tổ chức)
-- ============================================
CREATE TABLE IF NOT EXISTS org_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BẢNG YEAR_DATA (dữ liệu năm tài chính)
-- ============================================
CREATE TABLE IF NOT EXISTS year_data (
    id SERIAL PRIMARY KEY,
    year INTEGER UNIQUE NOT NULL,
    opening_balance NUMERIC(15,0) DEFAULT 0,
    closing_balance NUMERIC(15,0) DEFAULT 0,
    is_closed BOOLEAN DEFAULT false,
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BẢNG STAFF_SETTINGS
-- ============================================
CREATE TABLE IF NOT EXISTS staff_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL
);

-- Insert default staff settings
INSERT INTO staff_settings (key, value) VALUES ('baseSalary', '2340000') ON CONFLICT DO NOTHING;

-- ============================================
-- TẠO TÀI KHOẢN ADMIN MẶC ĐỊNH
-- Username: admin / Mật khẩu: admin123
-- bcrypt hash của "admin123" với salt rounds = 10
-- ============================================
DO $$
DECLARE
    admin_id UUID;
    admin_hash TEXT := '$2b$10$Eg34iRgi.GrzZO5sl2ps8.nabaVj6KtvkhKUdPnlvTWMVUAlf4L7O';
BEGIN
    -- Kiểm tra xem đã có admin chưa
    IF NOT EXISTS (SELECT 1 FROM user_roles WHERE role = 'admin') THEN
        admin_id := gen_random_uuid();
        
        INSERT INTO users (id, email, username, password_hash, is_active)
        VALUES (admin_id, 'admin@app.local', 'admin', admin_hash, true);
        
        INSERT INTO profiles (user_id, full_name, email, username)
        VALUES (admin_id, 'Administrator', 'admin@app.local', 'admin');
        
        INSERT INTO user_roles (user_id, role)
        VALUES (admin_id, 'admin');
        
        RAISE NOTICE 'Tài khoản admin đã được tạo thành công!';
    ELSE
        RAISE NOTICE 'Admin đã tồn tại, bỏ qua.';
    END IF;
END $$;

-- ============================================
-- FUNCTION: has_role
-- ============================================
CREATE OR REPLACE FUNCTION has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = _user_id AND role = _role
    )
$$;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO finance_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO finance_admin;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO finance_admin;
