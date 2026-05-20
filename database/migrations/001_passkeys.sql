-- Passkeys (WebAuthn) for 2FA — run once on existing databases
USE wasiyya;

CREATE TABLE IF NOT EXISTS passkeys (
    id              CHAR(36) PRIMARY KEY,
    user_id         CHAR(36) NOT NULL,
    credential_id   VARCHAR(512) NOT NULL,
    public_key      TEXT NOT NULL,
    counter         BIGINT UNSIGNED NOT NULL DEFAULT 0,
    device_name     VARCHAR(255) DEFAULT 'جهاز',
    transports      VARCHAR(100) DEFAULT NULL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_used_at    DATETIME DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_passkey_credential (credential_id),
    INDEX idx_passkeys_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
