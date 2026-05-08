-- =============================================
-- Wasiyya Database Schema - MySQL/MariaDB Version
-- Import via phpMyAdmin or: mysql -u root wasiyya < schema_mysql.sql
-- =============================================

CREATE DATABASE IF NOT EXISTS wasiyya CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE wasiyya;

-- =============================================
-- 1. Users
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id              CHAR(36) PRIMARY KEY,
    full_name       VARCHAR(255) NOT NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    password        VARCHAR(500) NOT NULL,
    role            ENUM('admin', 'user', 'manager') DEFAULT 'user',
    two_fa_secret   VARCHAR(255) DEFAULT NULL,
    two_fa_enabled  TINYINT(1) DEFAULT 0,
    oauth_provider  VARCHAR(50) DEFAULT NULL,
    oauth_id        VARCHAR(255) DEFAULT NULL,
    last_checkin    DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active       TINYINT(1) DEFAULT 1,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- 2. Wills
-- =============================================
CREATE TABLE IF NOT EXISTS wills (
    id                      CHAR(36) PRIMARY KEY,
    user_id                 CHAR(36) NOT NULL,
    title                   VARCHAR(255) NOT NULL,
    description             TEXT,
    checkin_interval_days   INT DEFAULT 30,
    grace_period_days       INT DEFAULT 7,
    status                  ENUM('active', 'triggered', 'expired') DEFAULT 'active',
    triggered_at            DATETIME DEFAULT NULL,
    created_at              DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- 3. Assets
-- =============================================
CREATE TABLE IF NOT EXISTS assets (
    id          CHAR(36) PRIMARY KEY,
    will_id     CHAR(36) NOT NULL,
    asset_type  ENUM('account', 'bank', 'password', 'info', 'note') NOT NULL,
    title       VARCHAR(255) NOT NULL,
    content     TEXT NOT NULL,
    iv          VARCHAR(255) DEFAULT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (will_id) REFERENCES wills(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- 4. Documents
-- =============================================
CREATE TABLE IF NOT EXISTS documents (
    id              CHAR(36) PRIMARY KEY,
    will_id         CHAR(36) NOT NULL,
    original_name   VARCHAR(255) NOT NULL,
    stored_name     VARCHAR(255) NOT NULL,
    stored_path     VARCHAR(500) NOT NULL,
    file_size       BIGINT NOT NULL,
    mime_type       VARCHAR(100) NOT NULL,
    sha256_hash     VARCHAR(64) DEFAULT NULL,
    signature       TEXT DEFAULT NULL,
    iv              VARCHAR(255) DEFAULT NULL,
    uploaded_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (will_id) REFERENCES wills(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- 5. Beneficiaries
-- =============================================
CREATE TABLE IF NOT EXISTS beneficiaries (
    id              CHAR(36) PRIMARY KEY,
    will_id         CHAR(36) NOT NULL,
    name            VARCHAR(255) NOT NULL,
    email           VARCHAR(255) NOT NULL,
    phone           VARCHAR(50),
    relationship    VARCHAR(100),
    access_token    VARCHAR(500) DEFAULT NULL,
    token_expires   DATETIME DEFAULT NULL,
    notified_at     DATETIME DEFAULT NULL,
    accessed_at     DATETIME DEFAULT NULL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (will_id) REFERENCES wills(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- 6. Audit Logs
-- =============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id          CHAR(36) PRIMARY KEY,
    user_id     CHAR(36),
    action      VARCHAR(255) NOT NULL,
    details     TEXT,
    ip_address  VARCHAR(50),
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- 7. Checkin Notifications
-- =============================================
CREATE TABLE IF NOT EXISTS checkin_notifications (
    id                  CHAR(36) PRIMARY KEY,
    user_id             CHAR(36) NOT NULL,
    notification_type   ENUM('warning', 'final_warning', 'triggered'),
    sent_at             DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- Indexes
-- =============================================
CREATE INDEX idx_users_email         ON users(email);
CREATE INDEX idx_wills_user_id       ON wills(user_id);
CREATE INDEX idx_wills_status        ON wills(status);
CREATE INDEX idx_assets_will_id      ON assets(will_id);
CREATE INDEX idx_documents_will_id   ON documents(will_id);
CREATE INDEX idx_beneficiaries_will  ON beneficiaries(will_id);
CREATE INDEX idx_audit_user_id       ON audit_logs(user_id);

-- =============================================
-- Seed Data
-- =============================================
INSERT IGNORE INTO users (id, full_name, email, password, role) VALUES
(UUID(), 'Admin',          'admin@wasiyya.com',   'Admin@123',   'admin'),
(UUID(), 'عمر عبدالعال',   'user@wasiyya.com',    'User@123',    'user'),
(UUID(), 'أحمد علي',       'manager@wasiyya.com', 'Manager@123', 'manager');
