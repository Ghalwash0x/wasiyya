-- =============================================
-- Wasiyya Database Schema - Phase 1
-- =============================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- 1. Users
-- =============================================
CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name           VARCHAR(255) NOT NULL,
    email               VARCHAR(255) UNIQUE NOT NULL,
    password            VARCHAR(500) NOT NULL,
    role                VARCHAR(20) DEFAULT 'user'
                        CHECK (role IN ('admin', 'user', 'manager')),
    two_fa_secret       VARCHAR(255) DEFAULT NULL,
    two_fa_enabled      BOOLEAN DEFAULT FALSE,
    oauth_provider      VARCHAR(50) DEFAULT NULL,
    oauth_id            VARCHAR(255) DEFAULT NULL,
    last_checkin        TIMESTAMP DEFAULT NOW(),
    is_active           BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- 2. Wills
-- =============================================
CREATE TABLE wills (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title                   VARCHAR(255) NOT NULL,
    description             TEXT,
    checkin_interval_days   INT DEFAULT 30,
    grace_period_days       INT DEFAULT 7,
    status                  VARCHAR(20) DEFAULT 'active'
                            CHECK (status IN ('active', 'triggered', 'expired')),
    triggered_at            TIMESTAMP DEFAULT NULL,
    created_at              TIMESTAMP DEFAULT NOW(),
    updated_at              TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- 3. Assets
-- =============================================
CREATE TABLE assets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    will_id         UUID NOT NULL REFERENCES wills(id) ON DELETE CASCADE,
    asset_type      VARCHAR(30) NOT NULL
                    CHECK (asset_type IN ('account', 'bank', 'password', 'info', 'note')),
    title           VARCHAR(255) NOT NULL,
    content         TEXT NOT NULL,
    iv              VARCHAR(255) DEFAULT NULL,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- 4. Documents
-- =============================================
CREATE TABLE documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    will_id         UUID NOT NULL REFERENCES wills(id) ON DELETE CASCADE,
    original_name   VARCHAR(255) NOT NULL,
    stored_name     VARCHAR(255) NOT NULL,
    stored_path     VARCHAR(500) NOT NULL,
    file_size       BIGINT NOT NULL,
    mime_type       VARCHAR(100) NOT NULL,
    sha256_hash     VARCHAR(64) DEFAULT NULL,
    signature       TEXT DEFAULT NULL,
    iv              VARCHAR(255) DEFAULT NULL,
    uploaded_at     TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- 5. Beneficiaries
-- =============================================
CREATE TABLE beneficiaries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    will_id         UUID NOT NULL REFERENCES wills(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    email           VARCHAR(255) NOT NULL,
    phone           VARCHAR(50),
    relationship    VARCHAR(100),
    access_token    VARCHAR(500) DEFAULT NULL,
    token_expires   TIMESTAMP DEFAULT NULL,
    notified_at     TIMESTAMP DEFAULT NULL,
    accessed_at     TIMESTAMP DEFAULT NULL,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- 6. Audit Logs
-- =============================================
CREATE TABLE audit_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    action      VARCHAR(255) NOT NULL,
    details     TEXT,
    ip_address  VARCHAR(50),
    created_at  TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- 7. Checkin Notifications
-- =============================================
CREATE TABLE checkin_notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(30)
                    CHECK (notification_type IN ('warning', 'final_warning', 'triggered')),
    sent_at         TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- Indexes
-- =============================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_wills_user_id ON wills(user_id);
CREATE INDEX idx_wills_status ON wills(status);
CREATE INDEX idx_assets_will_id ON assets(will_id);
CREATE INDEX idx_documents_will_id ON documents(will_id);
CREATE INDEX idx_beneficiaries_will_id ON beneficiaries(will_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);

-- =============================================
-- Seed Data
-- =============================================
INSERT INTO users (full_name, email, password, role) VALUES
('Admin', 'admin@wasiyya.com', 'Admin@123', 'admin');

INSERT INTO users (full_name, email, password, role) VALUES
('محمد أحمد', 'user@wasiyya.com', 'User@123', 'user');

INSERT INTO users (full_name, email, password, role) VALUES
('أحمد علي', 'manager@wasiyya.com', 'Manager@123', 'manager');
