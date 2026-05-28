<div align="center">

<h1>وصيّة — Wasiyya</h1>
<h3>Digital Inheritance & Electronic Will Management System</h3>

<p>
  A secure, full-stack web application that lets individuals store digital assets and documents as a formal will,
  then automatically delivers everything to designated heirs when the owner becomes inactive.
</p>

<p>
  <img src="https://img.shields.io/badge/Node.js-v20-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
  <img src="https://img.shields.io/badge/Express-4.18-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind" />
</p>

<p>
  <img src="https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" alt="JWT" />
  <img src="https://img.shields.io/badge/bcrypt-cost--12-4A90D9?style=for-the-badge" alt="bcrypt" />
  <img src="https://img.shields.io/badge/2FA-TOTP-6C63FF?style=for-the-badge" alt="2FA" />
  <img src="https://img.shields.io/badge/OAuth-Google%20%2B%20GitHub-EA4335?style=for-the-badge" alt="OAuth" />
  <img src="https://img.shields.io/badge/AES--256--GCM-Encrypted-22B573?style=for-the-badge" alt="AES-256" />
</p>

<p>
  <img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License" />
  <img src="https://img.shields.io/badge/version-4.0.0-indigo?style=flat-square" alt="Version" />
  <img src="https://img.shields.io/badge/Computer%20%26%20Data%20Science-2026-orange?style=flat-square" alt="Faculty" />
</p>

<p>
  <a href="#-getting-started"><strong>Quick Start</strong></a> ·
  <a href="CHANGELOG_UPDATES.md"><strong>Changelog</strong></a> ·
  <a href="#-api-reference"><strong>API Reference</strong></a> ·
  <a href="#-security"><strong>Security</strong></a> ·
  <a href="#-contributors"><strong>Contributors</strong></a>
</p>

</div>

---

## Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [Getting Started](#-getting-started)
- [Configuration](#-configuration)
- [API Reference](#-api-reference)
- [Security](#-security)
- [Dead Man's Switch](#-dead-mans-switch)
- [Email System](#-email-system)
- [Admin Panel](#-admin-panel)
- [Frontend & Routing](#-frontend--routing)
- [Testing](#-testing)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [Contributors](#-contributors)
- [Team](#-team)
- [Changelog](#-changelog)
- [License](#-license)

---

## 🌐 Overview

**Wasiyya** (وصيّة — Arabic for *will/testament*) solves a critical problem: when someone passes away or becomes incapacitated, vital digital information — bank accounts, passwords, crypto wallets, contracts — is often lost forever.

### How it works

1. A user registers, creates a will, and adds their sensitive digital assets and documents
2. They designate trustees (heirs) by name and email
3. The system monitors user activity via a **Dead Man's Switch** — the user must periodically confirm they are alive
4. If they fail to check in within the configured grace period, the will is automatically **triggered**
5. Every trustee receives a secure, time-limited email link granting access to the full will contents

### System Roles

| Role | Description |
|------|-------------|
| `user` — موصي | Creates and manages their own will, assets, documents, and trustees. Subject to the Dead Man's Switch. |
| `admin` — مدير النظام | Manages the platform: users, roles, audit logs, system stats. Never accesses will content or decrypted data (Zero-Trust). |
| `manager` — مراجع وثائق | Reviews and verifies document integrity across all users. Can run SHA-256 + RSA signature checks. Cannot download or read document content. |

---

## ✨ Features

### For Will Owners (موصي)

<details>
<summary><strong>🔐 Account & Authentication</strong></summary>

- Register with full name, email, and a strong password
- Password policy: 8+ characters, uppercase, digit, special character
- Passwords hashed with **bcrypt** (cost factor 12); legacy plaintext auto-migrated on first login
- JWT-based sessions (24-hour expiry)
- **Two-Factor Authentication (TOTP)** — compatible with Google Authenticator and Authy
- **OAuth login** — Sign in with Google or GitHub (existing accounts only — no auto-registration on login)
- **OAuth sign-up** — Register via Google or GitHub from `/register` (`?mode=register`); new emails go to `/register?oauth_token=…` to complete name and optional password, then the account is linked to the provider
- **2FA applies to OAuth login** — if the account has 2FA enabled, a TOTP code is required after provider authorization

</details>

<details>
<summary><strong>📜 Will Management</strong></summary>

- Create one digital will per account
- Configure a custom check-in interval and grace period
- Update will settings at any time
- Delete will (cascades to all assets, documents, beneficiaries)

</details>

<details>
<summary><strong>💼 Digital Assets</strong></summary>

Store structured records with the following types:

| Type | Use Case |
|------|----------|
| `account` | Social media, email, subscriptions |
| `bank` | Account numbers, IBAN, routing info |
| `password` | Passwords and PINs |
| `info` | General important information |
| `note` | Personal messages or instructions |

- **Content and title encrypted at rest** (AES-256-GCM) in MySQL — ciphertext stored with `ivHex:authTagHex` IV columns
- **Per-user encryption key** — derived from `AES_SECRET_KEY` + `userId`; only the account owner can decrypt via `GET /api/auth/wallet-key`
- **Client-side decryption** via Web Crypto API — plaintext never sent over the API, never stored unencrypted in the DB
- Assets without an `iv` column (`null`) were created before encryption was introduced; displayed as-is until re-saved

</details>

<details>
<summary><strong>📁 Document Storage</strong></summary>

- Upload: PDF, JPG, PNG, GIF, TXT, DOC, DOCX (max 10 MB)
- Files **encrypted at rest** using AES-256-GCM; transparently decrypted on download
- Each file is **SHA-256 hashed** and **RSA-2048 signed** at upload time
- **Integrity verification** — UI modal confirms hash match and signature validity
- Download and delete your own documents at any time

</details>

<details>
<summary><strong>👥 Beneficiary (Trustee) Management</strong></summary>

- Add trustees: full name, email, phone, relationship
- View all trustees and their access status
- Remove trustees at any time
- Secure access tokens generated only when the will is triggered

</details>

<details>
<summary><strong>✅ Dead Man's Switch</strong></summary>

- Real-time check-in status on the dashboard (elapsed time, remaining time, color-coded progress bar)
- "I'm OK" button available on every page
- Overdue warning banner across all user pages
- Automatic email warnings at configurable thresholds

</details>

### For Trustees / Heirs (وارث)

- Receive a secure email when the will is triggered
- Access link valid for **7 days** — no account required
- View the full will: title, description, all assets, all documents
- First-access timestamp is recorded

### For Admins (مدير النظام)

See the [Admin Panel](#-admin-panel) section for full details.

---

## 🛠️ Tech Stack

### Backend

| Package | Version | Purpose |
|---------|---------|---------|
| Node.js | v20 | Runtime |
| Express | ^4.18.2 | HTTP framework |
| mysql2 | ^3.22.3 | MySQL driver (Promise API) |
| jsonwebtoken | ^9.0.2 | JWT generation and verification |
| bcrypt | ^6.0.0 | Password hashing (cost factor 12) |
| speakeasy | ^2.0.0 | TOTP 2FA secret generation and verification |
| qrcode | ^1.5.4 | QR code data URLs for 2FA setup |
| passport | ^0.7.0 | OAuth authentication middleware |
| passport-google-oauth20 | ^2.0.0 | Google OAuth 2.0 strategy |
| passport-github2 | ^0.1.12 | GitHub OAuth strategy |
| express-session | ^1.19.0 | Session store (OAuth redirect cycle only) |
| nodemailer | ^6.9.7 | Email delivery (SMTP) |
| node-cron | ^3.0.3 | Dead Man's Switch scheduler |
| multer | ^1.4.5-lts.1 | Multipart file upload handling |
| uuid | ^9.0.1 | UUID v4 primary key generation |
| helmet | ^7.1.0 | HTTP security headers |
| cors | ^2.8.5 | Cross-Origin Resource Sharing |
| express-rate-limit | ^7.1.5 | Rate limiting (500 req / 15 min) |
| express-validator | ^7.0.1 | Input validation and sanitization |
| dotenv | ^16.3.1 | Environment variable loading |
| nodemon | ^3.0.2 | Dev auto-restart *(devDependency)* |

### Frontend

| Package | Version | Purpose |
|---------|---------|---------|
| React | ^18.2.0 | UI framework |
| react-router-dom | ^6.20.0 | Client-side routing |
| axios | ^1.6.0 | HTTP client with interceptors |
| Vite | ^5.0.0 | Build tool and dev server |
| Tailwind CSS | ^3.3.0 | Utility-first CSS framework |
| lucide-react | ^0.x | Icon library (sidebar, nav, buttons) |

### Infrastructure

| Tool | Purpose |
|------|---------|
| MySQL 8.0 | Relational database |
| XAMPP | Local MySQL server + phpMyAdmin |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│                                                             │
│   React 18 SPA (Vite)          Arabic RTL UI               │
│   ├── React Router v6          ├── Tailwind CSS             │
│   ├── AuthContext (JWT store)  ├── Sidebar (role-aware)     │
│   └── Axios API client         └── CheckinBanner            │
│                  http://localhost:3000                       │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST / JSON
                           │ Authorization: Bearer <JWT>
┌──────────────────────────▼──────────────────────────────────┐
│                        API LAYER                             │
│                                                             │
│   Express 4 — http://localhost:3001                         │
│   ├── Helmet        (security headers)                      │
│   ├── CORS          (FRONTEND_URL only)                     │
│   ├── Rate Limiter  (500 req / 15 min)                      │
│   ├── Passport      (Google + GitHub OAuth)                 │
│   ├── authenticate  (JWT verify → req.user)                 │
│   ├── authorize     (RBAC role check)                       │
│   └── Multer        (file uploads → /uploads)               │
│                                                             │
│   /api/auth    /api/wills       /api/assets                 │
│   /api/documents  /api/beneficiaries                        │
│   /api/checkin    /api/admin    /api/health                 │
└──────────┬───────────────────────────┬───────────┬──────────┘
           │                           │           │
  ┌────────▼───────┐        ┌──────────▼──┐  ┌────▼──────────┐
  │  MySQL Database │        │  /uploads/  │  │  node-cron    │
  │  (XAMPP :3306)  │        │  AES-256    │  │  Dead Man's   │
  │                 │        │  encrypted  │  │  Switch Cron  │
  │  users          │        │             │  │               │
  │  wills          │        └─────────────┘  │  * * * * *    │
  │  assets         │                         │  (test: /min) │
  │  documents      │        ┌─────────────┐  │  0 9 * * *    │
  │  beneficiaries  │        │  /certs/    │  │  (prod: 9am)  │
  │  audit_logs     │        │  RSA-2048   │  │               │
  │  checkin_notif  │        │  (auto-gen) │  └───────────────┘
  └─────────────────┘        └─────────────┘
```

### Request Lifecycle

```
Browser Request
    → Helmet / CORS / Rate Limiter
    → authenticate()   — verifies JWT, loads req.user from DB
    → authorize(roles) — checks req.user.role against allowed list
    → Controller       — business logic
    → pool.query()     — MySQL via mysql2
    → JSON Response    — { success, data } or { success, message }
```

---

## 📁 Project Structure

```
wasiyya/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js            # MySQL connection pool
│   │   │   └── multer.js              # File upload config (types, size limits)
│   │   │
│   │   ├── controllers/
│   │   │   ├── auth.controller.js     # register, login (bcrypt + 2FA), getMe, logout, getWalletKey
│   │   │   ├── twofa.controller.js    # 2FA setup, enable, verify, disable (TOTP)
│   │   │   ├── will.controller.js     # CRUD — wills
│   │   │   ├── asset.controller.js    # CRUD — assets (AES-256-GCM encrypt on write)
│   │   │   ├── document.controller.js # upload (encrypt + sign), download (decrypt), verify
│   │   │   ├── beneficiary.controller.js  # CRUD — trustees + public token access
│   │   │   ├── checkin.controller.js  # check-in submit + status
│   │   │   ├── admin.controller.js    # user management, audit logs, stats, test tools
│   │   │   └── manager.controller.js  # document metadata listing + integrity verification
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js     # JWT verification → req.user
│   │   │   ├── rbac.middleware.js     # Role-based access control
│   │   │   ├── passport.js            # Google + GitHub OAuth strategies
│   │   │   └── validate.middleware.js # express-validator error handler
│   │   │
│   │   ├── routes/
│   │   │   ├── auth.routes.js         # /login, /register, /2fa/*, /google, /github, /register/oauth
│   │   │   ├── will.routes.js
│   │   │   ├── asset.routes.js
│   │   │   ├── document.routes.js
│   │   │   ├── beneficiary.routes.js
│   │   │   ├── checkin.routes.js
│   │   │   ├── admin.routes.js
│   │   │   └── manager.routes.js      # /manager/documents, /manager/documents/:id/verify, /manager/stats
│   │   │
│   │   ├── services/
│   │   │   ├── checkin.service.js     # Dead Man's Switch cron + trigger logic
│   │   │   ├── email.service.js       # Gmail / Ethereal SMTP + HTML templates
│   │   │   ├── encryption.service.js  # AES-256-GCM encrypt/decrypt buffers
│   │   │   └── signature.service.js   # RSA-2048 keygen, SHA-256 hash, sign, verify
│   │   │
│   │   └── app.js                     # Express entry — middleware, routes, HTTPS
│   │
│   ├── uploads/                       # AES-256-GCM encrypted user files (gitignored)
│   ├── certs/                         # SSL certs + RSA-2048 keys (auto-generated, gitignored)
│   ├── .env                           # Local secrets (gitignored)
│   ├── .env.example                   # Environment variable template
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx              # Login form + 2FA step + OAuth redirect handler (auto-dismiss errors)
│   │   │   ├── Register.jsx           # Registration form + OAuth buttons + profile completion step
│   │   │   ├── Dashboard.jsx          # Stats cards + check-in progress bar + will overview
│   │   │   ├── MyWill.jsx             # Will creation and settings
│   │   │   ├── Assets.jsx             # Asset management (AES-256-GCM in-browser decrypt)
│   │   │   ├── Documents.jsx          # Upload / download / delete + integrity verify modal
│   │   │   ├── Beneficiaries.jsx      # Trustee management
│   │   │   ├── Verification.jsx       # Manual check-in page
│   │   │   ├── TwoFactorSetup.jsx     # 2FA enable / disable + QR code setup
│   │   │   ├── AdminPanel.jsx         # Admin panel (5 tabs — metadata only, no will content)
│   │   │   ├── ManagerPanel.jsx       # Document review panel (verify integrity, no download)
│   │   │   ├── AccessDenied.jsx       # 403 — unauthorized role redirect page
│   │   │   ├── NotFound.jsx           # 404 — page not found
│   │   │   └── BeneficiaryAccess.jsx  # Public trustee access page (no login required)
│   │   │
│   │   ├── components/
│   │   │   ├── Sidebar.jsx            # Role-aware navigation (4 roles, mobile-responsive, lucide icons)
│   │   │   ├── Navbar.jsx             # Top bar with hamburger toggle for mobile sidebar
│   │   │   ├── CheckinBanner.jsx      # Overdue warning banner (polls every 30s)
│   │   │   ├── ProtectedRoute.jsx     # Redirects unauthenticated users to /login
│   │   │   └── RoleRoute.jsx          # Shows AccessDenied for wrong-role access
│   │   │
│   │   ├── context/
│   │   │   ├── AuthContext.jsx        # JWT storage, user state, login/logout, registerOAuth()
│   │   │   └── SidebarContext.jsx     # Mobile sidebar open/close state + overlay
│   │   │
│   │   ├── services/
│   │   │   └── api.js                 # Axios instance — baseURL + auth header interceptor
│   │   │
│   │   ├── utils/
│   │   │   └── assetCrypto.js         # Web Crypto API — AES-256-GCM decrypt in browser
│   │   │
│   │   ├── App.jsx                    # Router setup + SmartRedirect
│   │   └── main.jsx                   # React DOM entry
│   │
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── database/
│   └── schema_mysql.sql               # Full schema + seed data
│
└── README.md
```

---

## 🗄️ Database Schema

### Entity Relationships

```
users (1) ──────────── (0..1) wills
wills (1) ──────────── (0..*) assets
wills (1) ──────────── (0..*) documents
wills (1) ──────────── (0..*) beneficiaries
users (1) ──────────── (0..*) audit_logs
users (1) ──────────── (0..*) checkin_notifications
```

### Tables

<details>
<summary><code>users</code></summary>

```sql
CREATE TABLE users (
    id              CHAR(36)     PRIMARY KEY,
    full_name       VARCHAR(255) NOT NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    password        VARCHAR(500) NOT NULL,            -- bcrypt hash (cost 12)
    role            ENUM('admin','user','manager') DEFAULT 'user',
    two_fa_secret   VARCHAR(255) DEFAULT NULL,         -- TOTP secret
    two_fa_enabled  TINYINT(1)   DEFAULT 0,
    oauth_provider  VARCHAR(50)  DEFAULT NULL,         -- 'google' | 'github'
    oauth_id        VARCHAR(255) DEFAULT NULL,
    last_checkin    DATETIME     DEFAULT CURRENT_TIMESTAMP,
    is_active       TINYINT(1)   DEFAULT 1,
    created_at      DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

</details>

<details>
<summary><code>wills</code></summary>

```sql
CREATE TABLE wills (
    id                    CHAR(36)     PRIMARY KEY,
    user_id               CHAR(36)     NOT NULL,
    title                 TEXT         NOT NULL,        -- AES-256-GCM ciphertext (Base64)
    title_iv              VARCHAR(120) DEFAULT NULL,    -- ivHex:authTagHex
    description           TEXT,                         -- AES-256-GCM ciphertext (Base64)
    description_iv        VARCHAR(120) DEFAULT NULL,    -- ivHex:authTagHex
    checkin_interval_days INT          DEFAULT 30,
    grace_period_days     INT          DEFAULT 7,
    status                ENUM('active','triggered','expired') DEFAULT 'active',
    triggered_at          DATETIME     DEFAULT NULL,
    created_at            DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updated_at            DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

> **Trigger logic:** Cron checks `(NOW() − last_checkin) ≥ (checkin_interval + grace_period)`.  
> With `TIME_UNIT=minutes`, day values are treated as minutes.

</details>

<details>
<summary><code>assets</code></summary>

```sql
CREATE TABLE assets (
    id          CHAR(36)    PRIMARY KEY,
    will_id     CHAR(36)    NOT NULL,
    asset_type  ENUM('account','bank','password','info','note') NOT NULL,
    title       TEXT         NOT NULL,        -- AES-256-GCM ciphertext (Base64)
    title_iv    VARCHAR(120) DEFAULT NULL,    -- ivHex:authTagHex
    content     TEXT         NOT NULL,        -- AES-256-GCM ciphertext (Base64)
    iv          VARCHAR(255) DEFAULT NULL,    -- ivHex:authTagHex (NULL = legacy plaintext)
    created_at  DATETIME    DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (will_id) REFERENCES wills(id) ON DELETE CASCADE
);
```

</details>

<details>
<summary><code>documents</code></summary>

```sql
CREATE TABLE documents (
    id            CHAR(36)     PRIMARY KEY,
    will_id       CHAR(36)     NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    stored_name   VARCHAR(255) NOT NULL,   -- UUID-based filename on disk
    stored_path   VARCHAR(500) NOT NULL,
    file_size     BIGINT       NOT NULL,
    mime_type     VARCHAR(100) NOT NULL,
    sha256_hash   VARCHAR(64)  DEFAULT NULL,   -- integrity hash
    signature     TEXT         DEFAULT NULL,   -- RSA-2048 digital signature
    iv            VARCHAR(255) DEFAULT NULL,   -- AES-256-GCM IV:authTag
    uploaded_at   DATETIME     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (will_id) REFERENCES wills(id) ON DELETE CASCADE
);
```

</details>

<details>
<summary><code>beneficiaries</code></summary>

```sql
CREATE TABLE beneficiaries (
    id            CHAR(36)     PRIMARY KEY,
    will_id       CHAR(36)     NOT NULL,
    name          VARCHAR(255) NOT NULL,
    email         VARCHAR(255) NOT NULL,
    phone         VARCHAR(50),
    relationship  VARCHAR(100),
    access_token  VARCHAR(500) DEFAULT NULL,   -- 64-char hex, set at trigger time
    token_expires DATETIME     DEFAULT NULL,   -- NOW() + 7 days
    notified_at   DATETIME     DEFAULT NULL,
    accessed_at   DATETIME     DEFAULT NULL,
    created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (will_id) REFERENCES wills(id) ON DELETE CASCADE
);
```

</details>

<details>
<summary><code>passkeys</code></summary>

```sql
CREATE TABLE passkeys (
    id              CHAR(36)     PRIMARY KEY,
    user_id         CHAR(36)     NOT NULL,
    credential_id   VARCHAR(512) NOT NULL,
    public_key      TEXT         NOT NULL,
    counter         BIGINT UNSIGNED NOT NULL DEFAULT 0,
    device_name     VARCHAR(255) DEFAULT 'جهاز',
    transports      VARCHAR(100) DEFAULT NULL,
    created_at      DATETIME     DEFAULT CURRENT_TIMESTAMP,
    last_used_at    DATETIME     DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_passkey_credential (credential_id)
);
```

</details>

<details>
<summary><code>audit_logs</code> & <code>checkin_notifications</code></summary>

```sql
CREATE TABLE audit_logs (
    id          CHAR(36)     PRIMARY KEY,
    user_id     CHAR(36),
    action      VARCHAR(255) NOT NULL,
    details     TEXT,
    ip_address  VARCHAR(50),
    created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE checkin_notifications (
    id                CHAR(36) PRIMARY KEY,
    user_id           CHAR(36) NOT NULL,
    notification_type ENUM('warning','final_warning','triggered'),
    sent_at           DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Audited actions:** `USER_REGISTERED` `USER_LOGIN` `USER_LOGOUT` `WILL_CREATED` `WILL_UPDATED` `WILL_TRIGGERED` `ASSET_CREATED` `ASSET_DELETED` `DOCUMENT_UPLOADED` `DOCUMENT_DELETED` `BENEFICIARY_ADDED` `BENEFICIARY_REMOVED` `CHECKIN`

</details>

### Indexes

```sql
CREATE INDEX idx_users_email        ON users(email);
CREATE INDEX idx_wills_user_id      ON wills(user_id);
CREATE INDEX idx_wills_status       ON wills(status);
CREATE INDEX idx_assets_will_id     ON assets(will_id);
CREATE INDEX idx_documents_will_id  ON documents(will_id);
CREATE INDEX idx_beneficiaries_will ON beneficiaries(will_id);
CREATE INDEX idx_audit_user_id      ON audit_logs(user_id);
```

### Default Seed Accounts

| Role | Email | Password |
|------|-------|----------|
| admin | `admin@wasiyya.com` | `Admin@123` |
| user | `user@wasiyya.com` | `User@123` |
| manager | `manager@wasiyya.com` | `Manager@123` |

> **Note:** Seed passwords are stored as plaintext in the SQL file. Each account's password is automatically upgraded to bcrypt on first login. **Change all credentials before any production deployment.**

---

## 🚀 Getting Started

> **أوامر التشغيل الكاملة (عربي):** [docs/RUN.md](docs/RUN.md) — Docker، DB، HTTPS، والتشغيل اليومي.

### Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | v18 or higher |
| npm | v9 or higher |
| MySQL | 8.0 (via XAMPP or standalone) |

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/omar0y/wasiyya.git
cd wasiyya
```

**2. Set up the database**

**Option A — XAMPP**

1. Start XAMPP → click **Start** for MySQL
2. Open `http://localhost/phpmyadmin`
3. Create a new database named `wasiyya`
4. Select it → **Import** tab → choose `database/schema_mysql.sql` → **Go**

**Option B — Docker (MySQL + phpMyAdmin)**

```bash
# MySQL on port 3306, phpMyAdmin on http://localhost:8081
docker start wasiyya-mysql wasiyya-phpmyadmin
# Import schema_mysql.sql via phpMyAdmin or:
# docker exec -i wasiyya-mysql mysql -uroot wasiyya < database/schema_mysql.sql
```

Login to phpMyAdmin: user `root`, empty password (default).

**3. Configure the backend**

```bash
cd backend
cp .env.example .env   # Linux/macOS
# or
copy .env.example .env # Windows
```

Edit `.env` — see [Configuration](#-configuration) for all variables.

**Minimum required values:**
```env
JWT_SECRET=<any random string, 32+ characters>
AES_SECRET_KEY=<run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
```

**4. Install dependencies**

```bash
# Backend
cd backend && npm install

# Frontend (new terminal)
cd frontend && npm install
```

**5. Start the servers**

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

**6. Open the app**

Navigate to **http://localhost:3000**

| Account | Email | Password | Redirects to |
|---------|-------|----------|-------------|
| Admin | `admin@wasiyya.com` | `Admin@123` | `/admin` |
| User | `user@wasiyya.com` | `User@123` | `/dashboard` |

### Expected startup output

```
🚀 Wasiyya backend — http://localhost:3001
⏱️  TIME_UNIT = minutes
⏰ Checkin cron started — كل دقيقة (وضع التيست)
✅ MySQL connected — wasiyya
```

### HTTPS (local development)

1. Install [mkcert](https://github.com/FiloSottile/mkcert) and trust the local CA (once — asks for Mac password):

```bash
brew install mkcert
cd backend && npm run ssl:trust
```

2. Generate the app certificate (once):

```bash
cd backend && npm run ssl:generate
```

3. In `backend/.env`, enable HTTPS and use `https://` URLs:

```env
USE_HTTPS=true
FRONTEND_URL=https://localhost:3000
BACKEND_URL=https://localhost:3001
WEBAUTHN_ORIGIN=https://localhost:3000
```

4. Update OAuth apps (Google Cloud + GitHub) callback URLs to:

- `https://localhost:3001/api/auth/google/callback`
- `https://localhost:3001/api/auth/github/callback`

5. Run backend and frontend (Vite picks up the same certs automatically):

```bash
cd backend && npm run dev
cd frontend && npm run dev
```

Open **https://localhost:3000**. Accept the browser warning for the self-signed cert (or install the cert with [mkcert](https://github.com/FiloSottile/mkcert)).

Backend listens on **https://localhost:3001**; plain HTTP on port **3080** redirects to HTTPS.

---

## ⚙️ Configuration

All backend configuration is managed via `backend/.env`. Copy `.env.example` to get started.

```env
# ─── Server ──────────────────────────────────────────────────
PORT=3001
HTTP_PORT=3080              # HTTP→HTTPS redirect port (when SSL certs are present)
NODE_ENV=development

# ─── Database ────────────────────────────────────────────────
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=                # XAMPP default: empty
DB_NAME=wasiyya

# ─── JWT ─────────────────────────────────────────────────────
JWT_SECRET=your_secret_min_32_chars
JWT_EXPIRES_IN=24h

# ─── Session (OAuth cycle only) ──────────────────────────────
SESSION_SECRET=another_random_secret

# ─── AES-256-GCM document encryption ─────────────────────────
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
AES_SECRET_KEY=64_hex_characters_here

# ─── Email ───────────────────────────────────────────────────
# Option A — Gmail (real emails)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password   # myaccount.google.com/apppasswords
EMAIL_FROM=Wasiyya <your@gmail.com>

# Option B — leave empty to use Ethereal (dev preview mode, no real emails)
EMAIL_USER=
EMAIL_PASS=

# ─── URLs ────────────────────────────────────────────────────
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3001

# ─── OAuth — Google ──────────────────────────────────────────
# console.cloud.google.com → Credentials
# Callback URI: http://localhost:3001/api/auth/google/callback
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# ─── OAuth — GitHub ──────────────────────────────────────────
# github.com/settings/developers → New OAuth App
# Callback URL: http://localhost:3001/api/auth/github/callback
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# ─── Uploads ─────────────────────────────────────────────────
MAX_FILE_SIZE=10485760      # 10 MB
UPLOAD_PATH=./uploads

# ─── Dead Man's Switch ───────────────────────────────────────
TIME_UNIT=minutes           # 'minutes' = testing mode | 'days' = production

# ─── HTTPS (optional) ────────────────────────────────────────
USE_HTTPS=true              # or omit; auto-on when server.cert + server.key exist
SSL_CERT_PATH=./certs/server.cert
SSL_KEY_PATH=./certs/server.key
```

### Variable Reference

| Variable | Required | Default | Description |
|----------|:--------:|---------|-------------|
| `PORT` | No | `3001` | API server port |
| `HTTP_PORT` | No | `3080` | HTTP redirect port (SSL mode) |
| `DB_HOST/PORT/USER/PASSWORD/NAME` | **Yes** | — | MySQL connection |
| `JWT_SECRET` | **Yes** | — | Signing secret (min 32 chars) |
| `JWT_EXPIRES_IN` | No | `24h` | Token lifetime |
| `SESSION_SECRET` | No | *(JWT_SECRET)* | OAuth session secret |
| `AES_SECRET_KEY` | **Yes** | — | 64-char hex for AES-256-GCM |
| `EMAIL_USER` / `EMAIL_PASS` | No | — | Empty = Ethereal fallback |
| `FRONTEND_URL` | No | `http://localhost:3000` | Email links + OAuth redirect |
| `BACKEND_URL` | No | `http://localhost:3001` | OAuth callback base URL |
| `GOOGLE_CLIENT_ID/SECRET` | No | — | Placeholder = Google disabled |
| `GITHUB_CLIENT_ID/SECRET` | No | — | Placeholder = GitHub disabled |
| `TIME_UNIT` | No | `days` | `minutes` testing / `days` production |
| `USE_HTTPS` | No | — | Force HTTPS when `true` (needs certs) |
| `SSL_CERT_PATH` / `SSL_KEY_PATH` | No | `./certs/…` | TLS cert/key (`npm run ssl:generate`) |

---

## 📡 API Reference

All endpoints return JSON.

- **Success:** `{ "success": true, "data": { ... } }`
- **Error:** `{ "success": false, "message": "..." }`

**Base URL:** `http://localhost:3001/api`

---

### 🔑 Authentication — `/api/auth`

#### `POST /auth/register`

```json
// Request
{ "full_name": "Omar Abdelaal", "email": "omar@example.com", "password": "MyPass@123" }

// 201 Created
{ "success": true, "data": { "user": { "id": "...", "role": "user" }, "token": "eyJ..." } }
```

Password rules: 8+ chars · 1 uppercase · 1 digit · 1 special character

| Status | Meaning |
|--------|---------|
| `201` | Registered successfully |
| `400` | Validation failure |
| `409` | Email already registered |

---

#### `POST /auth/login`

```json
// Request
{ "email": "omar@example.com", "password": "MyPass@123" }

// 200 OK — standard login
{ "success": true, "data": { "user": { ... }, "token": "eyJ..." } }

// 200 OK — 2FA required
{ "success": true, "requires2FA": true, "tempToken": "eyJ..." }
```

When `requires2FA: true`, proceed to `POST /auth/2fa/verify` with the `tempToken`.

---

#### 2FA Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/auth/2fa/setup` | JWT | Generate TOTP secret + QR code |
| `POST` | `/auth/2fa/enable` | JWT | Activate 2FA after scanning QR |
| `POST` | `/auth/2fa/verify` | tempToken | Complete 2FA login step |
| `POST` | `/auth/2fa/disable` | JWT | Disable 2FA with TOTP confirmation |

```json
// GET /auth/2fa/setup — response
{ "data": { "qrCode": "data:image/png;base64,...", "secret": "JBSWY3..." } }

// POST /auth/2fa/verify — request
{ "tempToken": "eyJ...", "code": "123456" }
```

---

#### OAuth Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/auth/google` | — | Login via Google; append `?mode=register` from `/register` page |
| `GET` | `/auth/github` | — | Login via GitHub; append `?mode=register` from `/register` page |
| `GET` | `/auth/oauth/pending?token=` | — | OAuth sign-up — fetch pre-filled email + name |
| `POST` | `/auth/register/oauth` | — | Complete sign-up `{ oauth_token, full_name, password? }` — links `oauth_provider` + `oauth_id` |

**Login success:** `FRONTEND_URL/login?token=<jwt>&role=<role>`  
**Login + 2FA enabled:** `FRONTEND_URL/login?requires2FA=1&tempToken=<jwt>` — Login.jsx shows OTP screen  
**Sign-up new email:** `FRONTEND_URL/register?oauth_token=<jwt>` for profile completion  
**Sign-in with unknown email:** `FRONTEND_URL/login?error=account_not_found`  
**Provider not configured:** `FRONTEND_URL/login?error=oauth_not_configured`

> **GitHub OAuth App:** set callback URL to `{BACKEND_URL}/api/auth/github/callback` — Device Flow not required.

---

#### `GET /auth/me` · `POST /auth/logout` · `GET /auth/wallet-key`

Standard profile fetch and logout (both require JWT).  
`GET /auth/wallet-key` returns the per-user AES-256-GCM decryption key derived as `HMAC-SHA256(AES_SECRET_KEY, userId)` — requires `role: user`. The browser passes this key to the Web Crypto API to decrypt asset content locally; the plaintext is never transmitted over the API.

---

### 📜 Wills — `/api/wills`

> Requires authentication. Users can only access their own will.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/wills` | Get current user's will (null if none) |
| `POST` | `/wills` | Create a new will |
| `PUT` | `/wills/:id` | Update will settings |
| `DELETE` | `/wills/:id` | Delete will (cascades everything) |

```json
// POST /wills — request body
{
  "title": "My Digital Will",
  "description": "Instructions for my family",
  "checkin_interval_days": 30,
  "grace_period_days": 7
}
```

---

### 💼 Assets — `/api/assets`

> Requires authentication, role `user`. Will ownership verified on every request.  
> Responses return **`content_encrypted`** + **`iv`** — decrypt in the browser using `GET /auth/wallet-key`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/assets/:willId` | List assets — returns `content` (ciphertext) + `iv`; no plaintext |
| `POST` | `/assets` | Add asset — server encrypts `content` with AES-256-GCM before storage |
| `PUT` | `/assets/:id` | Update title / type / content (re-encrypts on save) |
| `DELETE` | `/assets/:id` | Delete an asset |

```json
// POST /assets — request body (plaintext content; stored encrypted)
{
  "will_id": "uuid",
  "asset_type": "bank",
  "title": "HSBC Savings Account",
  "content": "Account: 1234567890\nIBAN: GB12HSBC..."
}

// GET /assets/:willId — response item (excerpt)
{
  "id": "uuid",
  "title": "HSBC Savings Account",
  "content_encrypted": "k8J3mP9xQ2...",
  "iv": "a3f1c9d2e4b1:8e2f1a0b9c3d"
}
```

Asset content is encrypted with AES-256-GCM using a per-user key: `HMAC-SHA256(AES_SECRET_KEY, userId)`. The API returns `content` (Base64 ciphertext) and `iv` (`ivHex:authTagHex`). The browser fetches the key from `GET /auth/wallet-key` and decrypts locally via the Web Crypto API — plaintext never leaves the device. Assets without an `iv` (`null`) were created before encryption was introduced; they display as-is until the user re-saves them.

**Asset types:** `account` · `bank` · `password` · `info` · `note`

---

### 📁 Documents — `/api/documents`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/documents/upload` | Upload file *(multipart/form-data)* |
| `GET` | `/documents/:willId` | List all documents |
| `GET` | `/documents/download/:id` | Download (auto-decrypted) |
| `POST` | `/documents/verify/:id` | Verify integrity + signature |
| `DELETE` | `/documents/:id` | Delete document + disk file |

```json
// POST /documents/verify/:id — response
{
  "data": {
    "intact": true,
    "hash_match": true,
    "signature_valid": true,
    "stored_hash": "a3f1c9...",
    "current_hash": "a3f1c9...",
    "message": "الملف سليم والتوقيع صحيح"
  }
}
```

Upload form fields: `document` (file) · `will_id` (UUID)  
Allowed types: PDF · JPG · PNG · GIF · TXT · DOC · DOCX · Max: 10 MB

---

### 👥 Beneficiaries — `/api/beneficiaries`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/beneficiaries/:willId` | JWT | List trustees |
| `POST` | `/beneficiaries` | JWT | Add a trustee |
| `DELETE` | `/beneficiaries/:id` | JWT | Remove a trustee |
| `GET` | `/beneficiaries/access/:token` | None | Public will access for heirs |

```json
// GET /beneficiaries/access/:token — 200 OK
{
  "data": {
    "will": { "title": "...", "description": "...", "triggered_at": "..." },
    "assets": [ { "asset_type": "bank", "title": "...", "content": "..." } ],
    "documents": [ { "id": "...", "original_name": "contract.pdf" } ]
  }
}
```

Error codes: `403` token expired or will not triggered · `404` token not found

---

### ✅ Check-in — `/api/checkin`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/checkin` | Submit "I'm alive" — updates `last_checkin` |
| `GET` | `/checkin/status` | Get real-time check-in status |

```json
// GET /checkin/status — response
{
  "data": {
    "last_checkin": "2026-05-09T10:00:00.000Z",
    "elapsed": 2,
    "days_remaining": 35,
    "is_overdue": false,
    "time_unit": "minutes"
  }
}
```

---

### 🛡️ Admin — `/api/admin`

> All endpoints require `role: admin`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/stats` | System-wide statistics |
| `GET` | `/admin/users` | All users (newest first) |
| `PUT` | `/admin/users/:id/toggle` | Enable/disable account |
| `PUT` | `/admin/users/:id/role` | Change user role |
| `GET` | `/admin/logs?page=1&limit=50` | Paginated audit logs |
| `GET` | `/admin/all-wills` | All wills with counts |
| `GET` | `/admin/triggered-wills` | Triggered wills + beneficiary URLs |
| `GET` | `/admin/time-unit` | Current time unit |
| `GET` | `/admin/email-mode` | Email config mode |
| `POST` | `/admin/force-check` | Run Dead Man's Switch check now |
| `POST` | `/admin/reset-checkin/:id?ago=5` | Set last_checkin N units ago |
| `POST` | `/admin/reset-will/:id` | Reset triggered will to active |

---

### 🔍 Manager — `/api/manager`

> All endpoints require `role: manager`. Managers see document metadata across all users and can verify integrity. **No download, no decrypted content, no stored paths are ever returned.**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/manager/stats` | Aggregate document + will stats |
| `GET` | `/manager/documents` | All documents with owner, will, hash, and signature — never `stored_path` or `iv` |
| `POST` | `/manager/documents/:id/verify` | Decrypt in-memory → re-hash → compare; returns verdict only |

```json
// POST /manager/documents/:id/verify — response
{
  "intact": true,
  "hash_match": true,
  "signature_valid": true,
  "stored_hash": "a3f1c9...",
  "current_hash": "a3f1c9...",
  "message": "✅ الملف سليم والتوقيع صحيح"
}
```

Every verification is recorded in `audit_logs` as `MANAGER_VERIFY_DOC`.

---

### 🏥 Health — `GET /api/health`

```json
{ "status": "ok", "phase": 4, "time_unit": "minutes", "timestamp": "..." }
```

---

## 🔐 Security

### Security Features

| Feature | Implementation |
|---------|---------------|
| **Password Hashing** | bcrypt cost-12; plaintext passwords auto-migrated on first login |
| **JWT Authentication** | HS256, 24h expiry, verified on every request |
| **Two-Factor Auth (TOTP)** | speakeasy — compatible with Google Authenticator and Authy |
| **OAuth (Google + GitHub)** | Login: find-only by `oauth_id` or email — no auto-registration. Sign-up via `/register?mode=register` with profile completion. 2FA applies after OAuth when enabled. |
| **Asset Encryption** | AES-256-GCM; per-user key (`HMAC-SHA256(AES_SECRET_KEY, userId)`); title + content encrypted at rest; client-side decrypt via Web Crypto API |
| **Will Encryption** | AES-256-GCM; will title + description encrypted at rest with per-user key; admin sees only ciphertext |
| **Document Encryption** | AES-256-GCM at rest; transparent decryption on download |
| **Document Integrity** | SHA-256 hash stored at upload (`documents.sha256_hash`) |
| **Digital Signatures** | RSA-2048 auto-generated key pair; each document signed at upload |
| **Integrity Verification** | `/verify` endpoint + UI modal confirms hash match + signature |
| **HTTPS** | Automatic when SSL certs exist; HTTP→HTTPS redirect on `HTTP_PORT` |
| **RBAC** | Role enforced after JWT verification; strict per-route role lists |
| **Zero-Trust Admin** | Admin sees only metadata (names, dates, counts). Will content (`description`), asset content, decrypted files, and beneficiary tokens are never returned to admin endpoints. |
| **Manager Read-Only** | Manager can verify document integrity (decrypt in-memory, return verdict). `stored_path`, `iv`, and file bytes are never exposed to the manager role. |
| **Brute-Force Protection** | In-memory lockout after 5 failed login attempts per email (15-minute cooldown). |
| **Rate Limiting** | 500 requests per 15-minute window per IP |
| **Security Headers** | Helmet sets 15+ HTTP headers (XSS, HSTS, CSP, etc.) |
| **CORS** | Restricted to `FRONTEND_URL` only |
| **File Validation** | Multer rejects disallowed MIME types; 10 MB hard cap |
| **Token Expiry** | Beneficiary access tokens expire after 7 days |
| **Account Control** | Admin can disable accounts; disabled users rejected even with valid JWT |
| **Audit Trail** | Every significant action logged with timestamp and IP address |
| **2FA Temp Token** | Second-step login uses a short-lived JWT (5 min, `pending2FA` claim) |

### Authentication Flows

<details>
<summary><strong>Standard Login (no 2FA)</strong></summary>

```
1. POST /api/auth/login  →  server validates credentials via bcrypt.compare
2. Server signs JWT: { userId, role } — expires in 24h
3. Client stores token in localStorage
4. All requests include:  Authorization: Bearer <token>
5. authenticate() middleware verifies and loads req.user from DB
```

</details>

<details>
<summary><strong>2FA Login Flow</strong></summary>

```
1. POST /api/auth/login  →  server detects two_fa_enabled = 1
2. Server returns: { requires2FA: true, tempToken }
   tempToken = short-lived JWT (5 min) with { pending2FA: true }
3. Client shows OTP input screen
4. POST /api/auth/2fa/verify { tempToken, code }
5. Server verifies tempToken validity and TOTP code via speakeasy
6. Server issues full JWT  →  client stores and proceeds normally
```

</details>

<details>
<summary><strong>OAuth Flow — Sign-in (Google / GitHub)</strong></summary>

**Login** (`/api/auth/google` or `/github`):

```
1. User clicks OAuth button on /login  →  /api/auth/google
2. requireOAuth guard: if provider not configured → FRONTEND_URL/login?error=oauth_not_configured
3. Passport redirects to provider consent screen
4. Provider callbacks to /api/auth/google/callback
5. findOAuthUser: lookup by oauth_id → else by email (links provider if matched)
6. No match  →  failureRedirect FRONTEND_URL/login?error=account_not_found
7. If two_fa_enabled = 1  →  issue tempToken (5 min), redirect:
   FRONTEND_URL/login?requires2FA=1&tempToken=<jwt>
8. Otherwise  →  sign full JWT, redirect:
   FRONTEND_URL/login?token=<jwt>&role=<role>
9. Login.jsx useEffect reads URL params; if requires2FA shows OTP screen
```

</details>

<details>
<summary><strong>OAuth Flow — Sign-up (Google / GitHub)</strong></summary>

```
1. User clicks OAuth on /register  →  /api/auth/google?mode=register
2. Passport redirects to provider consent screen
3. Provider callback
4. If email already registered  →  FRONTEND_URL/login?error=account_not_found
5. Else issue short-lived oauth_token (15 min), redirect:
   FRONTEND_URL/register?oauth_token=<jwt>
6. Register.jsx calls GET /api/auth/oauth/pending?token= to pre-fill name + email
7. User completes form, optionally sets a password
8. POST /api/auth/register/oauth  →  creates account, links oauth_provider + oauth_id
9. Server signs JWT  →  redirects to role-appropriate page
```

</details>

### Route Protection

| Route Pattern | Auth | Role |
|---------------|------|------|
| `/api/auth/register` · `/api/auth/login` | None | — |
| `/api/auth/2fa/verify` | tempToken | — |
| `/api/auth/google` · `/api/auth/github` (+ callbacks) | None | — |
| `/api/auth/oauth/pending` · `/api/auth/register/oauth` | None | — |
| `/api/beneficiaries/access/:token` · `/api/beneficiaries/access/:token/document/:docId` | None | — |
| `/api/health` | None | — |
| `/api/auth/me` · `/api/auth/logout` · `/api/auth/2fa/*` | JWT | any |
| `/api/auth/wallet-key` | JWT | `user` only |
| `/api/wills` · `/api/assets` · `/api/documents` · `/api/checkin` | JWT | `user` only |
| `/api/admin/*` | JWT | `admin` only |
| `/api/manager/*` | JWT | `manager` only |

### Known Limitations

| Limitation | Notes |
|------------|-------|
| JWT not invalidatable before expiry | Refresh token / blacklist pattern not yet implemented |
| Asset decryption key via API | Owner must be logged in; key is fetched per-session, not cached in localStorage |
| No email verification | Users can register with any email |
| No password reset flow | No forgot-password / reset-via-email flow |

---

## ⏱️ Dead Man's Switch

This is the core mechanic of Wasiyya.

### Configuration

Each will stores two timing values (treated as **minutes** when `TIME_UNIT=minutes`):

| Field | Default | Description |
|-------|---------|-------------|
| `checkin_interval_days` | 30 | Inactivity period before first warning |
| `grace_period_days` | 7 | Additional buffer before trigger |

**Total time to trigger = interval + grace**

### Cron Logic

```javascript
// TIME_UNIT=minutes → runs every minute
'* * * * *'

// TIME_UNIT=days → runs daily at 9:00 AM
'0 9 * * *'
```

```
For each active will:
  elapsed = NOW() − user.last_checkin

  if elapsed ≥ interval + grace  → TRIGGER (email all beneficiaries)
  if elapsed = interval + grace − 1  → Send FINAL WARNING to user
  if elapsed = interval  → Send WARNING to user
```

### Trigger Process

1. `UPDATE wills SET status = 'triggered', triggered_at = NOW()`
2. For each beneficiary:
   - Generate `access_token = crypto.randomBytes(32).toString('hex')`
   - Set `token_expires = NOW() + 7 days`
   - Send email with secure access link
3. `INSERT INTO audit_logs (WILL_TRIGGERED)`

### Timeline Example (testing with minutes)

```
T+0:00  Will created (interval=3, grace=1)
T+3:00  Cron fires  →  elapsed=3  →  Warning email sent
T+3:00  Cron fires  →  elapsed=3  →  Final warning sent (3 = 3+1−1)
T+4:00  Cron fires  →  elapsed=4  →  TRIGGERED — beneficiary emails sent
```

---

## 📧 Email System

The email service auto-detects the provider at startup:

- **Configured** (real `EMAIL_USER` / `EMAIL_PASS`) → uses the specified SMTP server
- **Not configured** (empty or placeholder values) → auto-creates an [Ethereal](https://ethereal.email) test account

### Email Templates

| Email | Trigger Condition | Appearance |
|-------|------------------|------------|
| Warning | `elapsed == interval` | Amber — link to dashboard |
| Final Warning | `elapsed == interval + grace − 1` | Red — urgent |
| Beneficiary Notification | Will triggered | Green — secure access link (7-day expiry) |

### Using Ethereal (Dev Mode)

No configuration needed. Email preview URLs are stored in-memory and shown in the **Admin Panel → Test Tools** tab. No emails reach real inboxes.

### Using Gmail (Production)

1. Enable 2-Step Verification on your Google account
2. Generate an App Password at `myaccount.google.com/apppasswords`
3. Set in `.env`:
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your@gmail.com
   EMAIL_PASS=your_16_char_app_password
   ```

> Email failures are logged but never throw — the cron check always completes.

---

## 🛡️ Admin Panel

Admins are redirected to `/admin` after login and have no access to the user-side will pages.

### Tab 1 — Dashboard (لوحة التحكم)

- Live stat cards: total/active users, wills, triggered wills, documents, assets
- Triggered wills list with owner names
- Last 10 audit log entries

### Tab 2 — Users (المستخدمون)

- Full list of all users with name, email, role, status, last check-in
- **Toggle** — enable/disable account *(admin cannot disable themselves)*
- **Role dropdown** — change role instantly (`user` / `manager` / `admin`)

### Tab 3 — Wills (الوصايا)

- All wills across all users with owner info and counts
- Color-coded status badges: 🟢 active · 🔴 triggered · ⚫ expired

### Tab 4 — Audit Logs (السجلات)

- Paginated log of every system action
- Color-coded by type: blue (auth) · green (create) · red (trigger/delete) · gray (check-in)

### Tab 5 — Test Tools (أدوات التيست)

- Email mode badge (Gmail vs Ethereal)
- Time unit badge (minutes vs days)
- **Force Check** — runs Dead Man's Switch immediately
- **Reset Check-in** — set any user's `last_checkin` to N units ago
- **Triggered Wills** — per-beneficiary notification status, `accessed_at` indicator, Ethereal email previews, reset buttons

> **Security note:** Beneficiary access tokens (`access_token`) are never returned to the admin. The admin sees a `token_valid` boolean and `accessed_at` timestamp only. Actual document content remains inaccessible to the admin role by design.

---

## 🖥️ Frontend & Routing

### Route Map

| Path | Component | Auth | Role | Description |
|------|-----------|:----:|------|-------------|
| `/login` | Login | — | — | Login + 2FA step + OAuth handler (error auto-dismiss 10s) |
| `/register` | Register | — | — | Registration + OAuth buttons + profile completion step |
| `/dashboard` | Dashboard | ✓ | user | Stats cards + check-in progress bar + will overview |
| `/will` | MyWill | ✓ | user | Will creation & settings |
| `/assets` | Assets | ✓ | user | Asset management (AES-256-GCM browser decryption) |
| `/documents` | Documents | ✓ | user | Upload / download / verify |
| `/beneficiaries` | Beneficiaries | ✓ | user | Trustee management |
| `/verification` | Verification | ✓ | user | Check-in page |
| `/settings/2fa` | TwoFactorSetup | ✓ | any | Enable / disable 2FA |
| `/admin` | AdminPanel | ✓ | admin | Admin panel (5 tabs — metadata only) |
| `/manager` | ManagerPanel | ✓ | manager | Document review + integrity verification |
| `/access/:token` | BeneficiaryAccess | — | — | Public trustee access (requires triggered will) |
| `/access-denied` | AccessDenied | — | — | Shown when a role tries to access a restricted route |
| `/` · `*` | SmartRedirect / NotFound | — | — | Redirect by role or 404 |

### Key Components

**`Sidebar.jsx`** — Role-aware navigation. All four roles (`user`, `admin`, `manager`, and the hidden super-admin) get distinct link sets. Shows name, email, role badge, and logout. Mobile-responsive via `SidebarContext` (overlay + hamburger toggle in `Navbar`).

**`SidebarContext.jsx`** — React context that manages sidebar open/close state on mobile. Wraps the app in `App.jsx` via `SidebarProvider`.

**`CheckinBanner.jsx`** — Amber/red banner across all user pages when check-in is overdue. Polls `/api/checkin/status` every 30 seconds. Includes inline "أنا بخير ✓" button. Hidden for admins.

**`AuthContext.jsx`** — Provides `user`, `loading`, `login(token)`, `logout()` across the app.

**`api.js`** — Axios instance with automatic `Authorization: Bearer` injection and `401` auto-redirect to `/login`.

---

## 🧪 Testing

### Setting Up Test Mode

Set `TIME_UNIT=minutes` in `.env` and restart the backend.

| Setting | Production (`days`) | Test (`minutes`) |
|---------|--------------------|--------------------|
| Cron schedule | Daily at 9:00 AM | Every minute |
| Interval unit | Days | Minutes |
| Default interval | 30 days | 3 minutes |
| Default grace | 7 days | 1 minute |
| Time to trigger | 37 days | 4 minutes |

### End-to-End Test Procedure

1. Set `TIME_UNIT=minutes`, restart backend
2. Log in as `user@wasiyya.com`
3. Go to `/will` → create will with `interval=2`, `grace=1`
4. Go to `/beneficiaries` → add a trustee with your email
5. Open **Admin Panel → Test Tools**
6. Click **"Reset Check-in"** for the user → set to 4 minutes ago
7. Click **"Force Check"** → will should trigger immediately
8. Ethereal mode: click "📧 عرض الإيميل" to preview the notification email
9. Click "افتح الوصية" → verify the trustee access page loads correctly
10. Click "إعادة تعيين" to reset for the next test run

---

## 🗺️ Roadmap

### ✅ Completed

- [x] bcrypt password hashing (cost 12) — auto-migration on login
- [x] AES-256-GCM document encryption at rest
- [x] SHA-256 document integrity verification
- [x] RSA-2048 digital signatures — auto-generated key pair
- [x] TOTP two-factor authentication (Google Authenticator / Authy)
- [x] Google + GitHub OAuth login (find-only — no auto-registration on login)
- [x] OAuth sign-up with profile completion step from `/register` (`?mode=register`)
- [x] OAuth + 2FA support — TOTP required after OAuth when 2FA is enabled
- [x] AES-256-GCM asset content encryption — per-user key, client-side decrypt via Web Crypto API
- [x] Beneficiary access gated on `wills.status = 'triggered'`
- [x] Mobile-responsive sidebar (SidebarContext, overlay, lucide-react icons)
- [x] Dashboard stats cards + check-in progress bar UI improvements
- [x] HTTP → HTTPS automatic redirect
- [x] Manager role — document integrity reviewer (verify-only, no download, no plaintext)
- [x] Zero-Trust admin model — admin sees metadata only; tokens, content, and encryption keys never exposed
- [x] Brute-force login protection (5 attempts → 15-min lockout per email)
- [x] Multer dual validation — MIME type + file extension allowlist
- [x] Non-fatal audit logging — DB schema mismatches never crash functional operations
- [x] AccessDenied + NotFound pages wired into RBAC routing
- [x] WebAuthn / Passkey 2FA — register and authenticate using device biometrics or hardware keys
- [x] Will title + description encrypted at rest (AES-256-GCM, per-user key)
- [x] Asset title encrypted at rest (AES-256-GCM, per-user key)
- [x] Automated test suite (Jest + Supertest — 34 integration tests)

### 🔜 Planned

- [ ] Refresh token pattern (short-lived access + long-lived refresh)
- [ ] Email verification on registration
- [ ] Password reset via email
- [ ] Multi-language support (Arabic + English)
- [ ] Further mobile UI polish
- [ ] Notification preferences (frequency, channel)
- [ ] Will versioning and history
- [ ] Legal advisor role (limited read-only access)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Docker Compose for production deployment
- [ ] Cloud document storage (AWS S3 / Cloudflare R2)

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/your-feature-name`
3. **Make** your changes — follow the existing code style
4. **Test** your changes locally using the [test procedure](#-testing)
5. **Commit** with a clear message: `git commit -m "feat: add your feature"`
6. **Push** to your fork: `git push origin feature/your-feature-name`
7. **Open** a Pull Request against `main`

### Guidelines

- Keep PRs focused — one feature or fix per PR
- All new API routes must include proper authentication and role checks
- Sensitive operations must be logged in `audit_logs`
- Do not commit `.env` files or credentials
- Do not modify `database/schema_mysql.sql` without a migration plan

**Appear on GitHub Contributors:** use a GitHub-linked email in commits:

```bash
git config user.name "Your Name"
git config user.email "your-email@example.com"   # same as GitHub account
```

---

## 👤 Contributors

<a href="https://github.com/omar0y/wasiyya/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=omar0y/wasiyya" alt="Contributors" />
</a>

| Name | GitHub |
|------|--------|
| عمر عبدالعال سعد — Omar Abdelaal Saad | [@omar0y](https://github.com/omar0y) |
| محمد أسامه محمد — Mohammed Osama Mohammed | — |
| مصطفى علي مصطفى — Mustafa Ali Mustafa | Ghalwash0x |

> Commits must use an email [linked to your GitHub account](https://github.com/settings/emails) to appear in the graph above.

---

## 👥 Team

| Name | ID |
|------|----|
| عمر عبدالعال سعد — Omar Abdelaal Saad | 2305165 |
| محمد أسامه محمد — Mohammed Osama Mohammed | 2305180 |
| مصطفى علي مصطفى — Mustafa Ali Mustafa | 2305616 |

**Supervisor:** Faculty of Computer and Data Science  
**Academic Year:** 2025 / 2026

---

## 📋 Changelog

Recent session updates (OAuth register, 2FA + OAuth, encrypted assets, UI) are documented in:

**[CHANGELOG_UPDATES.md](./CHANGELOG_UPDATES.md)**

---

## 📄 License

```
MIT License

Copyright (c) 2026 Wasiyya Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED. IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
OTHER LIABILITY ARISING FROM USE OF THE SOFTWARE.
```

---

<div align="center">

**وصيّة — Wasiyya**  
*Digital Will Management System*

Built with Node.js · React · MySQL  
Faculty of Computer and Data Science — 2026

<br/>

⭐ Star this repo if you found it useful!

</div>
