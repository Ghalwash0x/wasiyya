<div align="center">

# وصيّة — Wasiyya
### Digital Inheritance & Electronic Will Management System

![Node.js](https://img.shields.io/badge/Node.js-v20-339933?style=for-the-badge&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.18-000000?style=for-the-badge&logo=express&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![bcrypt](https://img.shields.io/badge/bcrypt-cost--12-4A90D9?style=for-the-badge)
![2FA](https://img.shields.io/badge/2FA-TOTP-6C63FF?style=for-the-badge)
![OAuth](https://img.shields.io/badge/OAuth-Google%20%2B%20GitHub-EA4335?style=for-the-badge)
![AES-256](https://img.shields.io/badge/AES--256--GCM-Encrypted-22B573?style=for-the-badge)
![Nodemailer](https://img.shields.io/badge/Nodemailer-Email-22B573?style=for-the-badge)
![node-cron](https://img.shields.io/badge/node--cron-Scheduler-FF6B6B?style=for-the-badge)

**University Software Engineering Final Project — 2026**

</div>

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Roles](#2-system-roles)
3. [Features](#3-features)
4. [Tech Stack](#4-tech-stack)
5. [System Architecture](#5-system-architecture)
6. [Project Structure](#6-project-structure)
7. [Database Schema](#7-database-schema)
8. [Getting Started](#8-getting-started)
9. [Environment Variables](#9-environment-variables)
10. [API Reference](#10-api-reference)
11. [Authentication & Authorization](#11-authentication--authorization)
12. [Dead Man's Switch Mechanism](#12-dead-mans-switch-mechanism)
13. [Email System](#13-email-system)
14. [Admin Panel](#14-admin-panel)
15. [Frontend Pages & Routing](#15-frontend-pages--routing)
16. [Testing Mode](#16-testing-mode)
17. [Security](#17-security)
18. [Phase 2 Roadmap](#18-phase-2-roadmap)
19. [Team](#19-team)
20. [License](#20-license)

---

## 1. Project Overview

**Wasiyya** (وصيّة — Arabic for "will/testament") is a full-stack web application that allows individuals to securely store their digital assets and personal documents as a formal digital will, then automatically deliver everything to designated heirs when the user becomes inactive.

The core problem it solves: when someone passes away or becomes incapacitated, critical digital information — bank accounts, passwords, crypto wallets, important documents — is often lost forever. Wasiyya ensures that trusted people receive exactly the right information at the right time, automatically.

### How It Works — In One Paragraph

A user registers, creates a will, and adds their sensitive assets (account credentials, bank info, passwords, personal notes) and uploads documents (PDFs, images, contracts). They designate trustees (heirs) by name and email. The system then monitors the user's activity via a **Dead Man's Switch**: the user must periodically confirm they are alive by clicking "I'm OK". If they fail to do so within a configured grace period, the system automatically marks the will as triggered and emails every trustee a secure, time-limited link to access the will's full contents.

---

## 2. System Roles

The system has three distinct roles with completely separate experiences:

| Role | Arabic | Description |
|------|--------|-------------|
| `user` | موصي (Will Owner) | Creates and manages their own will, assets, documents, and trustees. Subject to the Dead Man's Switch. |
| `admin` | مدير النظام (System Admin) | Manages the entire platform. Has a dedicated admin panel. Never participates in the will flow. Not subject to the Dead Man's Switch. |
| `manager` | مدير | Reserved role for future use (e.g., legal oversight). Currently treated like a regular user. |

---

## 3. Features

### Will Owner (موصي)

- **Account Management**
  - Register with full name, email, and password
  - Password policy enforced: minimum 8 characters, at least one uppercase letter, one digit, one special character
  - Passwords hashed with **bcrypt** (cost factor 12); plaintext passwords auto-migrated on first login
  - Login with JWT-based session (24-hour expiry)
  - **Two-Factor Authentication (2FA)** — TOTP compatible with Google Authenticator and Authy
  - **OAuth login** — Sign in with Google or GitHub (no password required)
  - View profile information

- **Will Management**
  - Create one digital will per account
  - Set a custom check-in interval (how long before warning, e.g., 30 days)
  - Set a custom grace period (extra time before trigger, e.g., 7 days)
  - Update will settings at any time
  - Delete will (cascades to all assets, documents, beneficiaries)

- **Digital Assets**
  - Add structured digital assets with types:
    - `account` — social media, email, subscription accounts
    - `bank` — bank account numbers, IBAN, routing info
    - `password` — passwords and PINs
    - `info` — general important information
    - `note` — personal messages or instructions
  - Each asset has a label and content field
  - Delete individual assets

- **Document Uploads**
  - Upload files: PDF, JPG, PNG, GIF, TXT, DOC, DOCX
  - Maximum file size: 10 MB per file
  - Files are **encrypted at rest** using AES-256-GCM; decrypted transparently on download
  - Each file is **SHA-256 hashed** and **RSA-2048 signed** at upload time
  - **Verify integrity** — dedicated UI modal shows hash match and signature validity
  - Download your own documents (served as plaintext regardless of encryption)
  - Delete documents

- **Beneficiary (Trustee) Management**
  - Add trustees with: full name, email address, relationship, phone number
  - Each trustee gets a pre-assigned UUID (used as access token when triggered)
  - Remove trustees at any time
  - View all trustees and their access status

- **Dead Man's Switch (Check-in System)**
  - Dashboard shows real-time check-in status:
    - Time since last check-in
    - Time remaining before warning/trigger
    - Color-coded progress bar (green → amber → red)
  - "I'm OK" button for immediate check-in from any page
  - Overdue warning banner appears across all pages when check-in is needed
  - Automatic warning emails at configurable thresholds

### Trustee / Heir (وارث)

- Receives an email notification when the will is triggered
- Email contains a secure access link valid for **7 days**
- No account or registration required
- Access page shows:
  - Will title and description
  - All assets with their type, label, and content
  - All uploaded documents with download buttons
- `accessed_at` timestamp recorded on first access

### Admin (مدير النظام)

See [Section 14 — Admin Panel](#14-admin-panel) for full details.

---

## 4. Tech Stack

### Backend

| Package | Version | Purpose |
|---------|---------|---------|
| Node.js | v20 | Runtime |
| Express | ^4.18.2 | HTTP framework |
| mysql2 | ^3.22.3 | MySQL driver (Promise API) |
| jsonwebtoken | ^9.0.2 | JWT generation and verification |
| bcrypt | ^6.0.0 | Password hashing (cost factor 12) |
| speakeasy | ^2.0.0 | TOTP 2FA secret generation and verification |
| qrcode | ^1.5.4 | Generate QR code data URLs for 2FA setup |
| passport | ^0.7.0 | Authentication middleware (OAuth strategies) |
| passport-google-oauth20 | ^2.0.0 | Google OAuth 2.0 strategy |
| passport-github2 | ^0.1.12 | GitHub OAuth strategy |
| express-session | ^1.19.0 | Session store (OAuth redirect cycle only) |
| nodemailer | ^6.9.7 | Email sending (SMTP) |
| node-cron | ^3.0.3 | Dead Man's Switch scheduler |
| multer | ^1.4.5-lts.1 | File upload handling |
| uuid | ^9.0.1 | UUID v4 generation (PKs) |
| helmet | ^7.1.0 | HTTP security headers |
| cors | ^2.8.5 | Cross-Origin Resource Sharing |
| express-rate-limit | ^7.1.5 | Rate limiting (500 req/15 min) |
| express-validator | ^7.0.1 | Input validation |
| dotenv | ^16.3.1 | Environment variable loading |
| nodemon | ^3.0.2 | Dev auto-restart (devDependency) |

### Frontend

| Package | Version | Purpose |
|---------|---------|---------|
| React | ^18.2.0 | UI framework |
| react-dom | ^18.2.0 | DOM rendering |
| react-router-dom | ^6.20.0 | Client-side routing |
| axios | ^1.6.0 | HTTP client (API calls) |
| Vite | ^5.0.0 | Build tool and dev server |
| Tailwind CSS | ^3.3.0 | Utility-first CSS framework |
| @vitejs/plugin-react | ^4.2.0 | React plugin for Vite |
| autoprefixer | ^10.4.0 | CSS vendor prefixes |
| postcss | ^8.4.0 | CSS processing |

### Database & Infrastructure

| Tool | Purpose |
|------|---------|
| MySQL 8.0 | Relational database |
| XAMPP | Local MySQL server + phpMyAdmin |
| phpMyAdmin | Database GUI management |

### Email Providers

| Provider | Use Case |
|----------|---------|
| Brevo SMTP | Production — real email delivery |
| Ethereal | Development fallback — fake SMTP, preview in browser |

---

## 5. System Architecture

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
                           │ HTTP/JSON (REST)
                           │ Authorization: Bearer <JWT>
┌──────────────────────────▼──────────────────────────────────┐
│                        API LAYER                             │
│                                                             │
│   Express 4 — http://localhost:3001                         │
│   ├── Helmet (security headers)                             │
│   ├── CORS (localhost:3000 only)                            │
│   ├── Rate Limiter (500 req / 15 min)                       │
│   ├── AuthMiddleware (JWT verify)                           │
│   ├── RBACMiddleware (role check)                           │
│   ├── Passport (Google + GitHub OAuth)                      │
│   └── Multer (file uploads → /uploads)                      │
│                                                             │
│   Routes:                                                   │
│   /api/auth          /api/wills       /api/assets           │
│   /api/documents     /api/beneficiaries                     │
│   /api/checkin       /api/admin       /api/health           │
└──────────────────────────┬──────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
┌─────────▼──────┐ ┌──────▼──────┐ ┌──────▼──────────┐
│  MySQL Database │ │  /uploads/  │ │  node-cron       │
│  (XAMPP :3306)  │ │  (AES-256   │ │  Dead Man's      │
│                 │ │   encrypted)│ │  Switch Cron     │
│  wasiyya DB:    │ │             │ │                  │
│  users          │ │  PDF, JPG   │ │  * * * * *       │
│  wills          │ │  PNG, DOC   │ │  (test: /min)    │
│  assets         │ │  DOCX, TXT  │ │  0 9 * * *       │
│  documents      │ └─────────────┘ │  (prod: 9am)     │
│  beneficiaries  │                 │                  │
│  audit_logs     │ ┌─────────────┐ │  → CheckinSvc    │
│  checkin_notif  │ │  /certs/    │ │  → EmailSvc      │
└─────────────────┘ │  RSA-2048   │ └──────────────────┘
                    │  private.pem│
                    │  public.pem │
                    │  (auto-gen) │
                    └─────────────┘
```

### Request Lifecycle

```
Browser Request
    → Express Router
    → authenticate() middleware  [verifies JWT, loads req.user]
    → authorize('admin')         [checks role — admin routes only]
    → Controller function        [business logic]
    → pool.query()               [MySQL via mysql2]
    → JSON Response
```

---

## 6. Project Structure

```
wasiyya/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js          # MySQL connection pool + pg-compatible wrapper
│   │   │   └── multer.js            # File upload config (types, size limits)
│   │   │
│   │   ├── controllers/
│   │   │   ├── auth.controller.js       # register, login (+ bcrypt + 2FA flow), getMe
│   │   │   ├── twofa.controller.js      # 2FA setup, enable, disable, verify (TOTP)
│   │   │   ├── will.controller.js       # CRUD for wills
│   │   │   ├── asset.controller.js      # CRUD for assets
│   │   │   ├── document.controller.js   # upload (encrypt+sign), download (decrypt), verify
│   │   │   ├── beneficiary.controller.js # CRUD for trustees + token access
│   │   │   ├── checkin.controller.js    # checkin submit + status
│   │   │   └── admin.controller.js      # all admin operations
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js    # JWT verification → req.user
│   │   │   ├── rbac.middleware.js    # Role-based access control
│   │   │   ├── passport.js          # Google + GitHub OAuth strategies
│   │   │   └── validate.middleware.js # express-validator error handling
│   │   │
│   │   ├── routes/
│   │   │   ├── auth.routes.js        # login, register, 2FA, OAuth
│   │   │   ├── will.routes.js
│   │   │   ├── asset.routes.js
│   │   │   ├── document.routes.js
│   │   │   ├── beneficiary.routes.js
│   │   │   ├── checkin.routes.js
│   │   │   └── admin.routes.js
│   │   │
│   │   ├── services/
│   │   │   ├── checkin.service.js   # Dead Man's Switch cron + trigger logic
│   │   │   ├── email.service.js     # Gmail / Ethereal SMTP + HTML templates
│   │   │   ├── encryption.service.js # AES-256-GCM encrypt/decrypt file buffers
│   │   │   └── signature.service.js  # RSA-2048 key gen, SHA-256 hash, sign, verify
│   │   │
│   │   └── app.js                   # Express app — middleware, routes, HTTPS redirect
│   │
│   ├── uploads/                     # Encrypted user uploads (.gitkeep; files gitignored)
│   ├── certs/                       # SSL certs + RSA keys (auto-generated; gitignored)
│   ├── .env                         # Local environment (gitignored)
│   ├── .env.example                 # Template for environment variables
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx               # Login form + 2FA step + OAuth redirect handler
│   │   │   ├── Register.jsx            # Registration form + Google/GitHub OAuth buttons
│   │   │   ├── Dashboard.jsx           # Check-in status + will overview
│   │   │   ├── MyWill.jsx              # Will creation and settings
│   │   │   ├── Assets.jsx              # Asset management (add/delete)
│   │   │   ├── Documents.jsx           # Upload/download/delete + integrity verify modal
│   │   │   ├── Beneficiaries.jsx       # Trustee management
│   │   │   ├── Verification.jsx        # Manual check-in page
│   │   │   ├── TwoFactorSetup.jsx      # 2FA enable/disable + QR code setup
│   │   │   ├── AdminPanel.jsx          # Full admin system (5 tabs)
│   │   │   └── BeneficiaryAccess.jsx   # Public trustee access page (no login)
│   │   │
│   │   ├── components/
│   │   │   ├── Sidebar.jsx             # Role-aware navigation sidebar
│   │   │   ├── CheckinBanner.jsx       # Overdue warning banner (top of all pages)
│   │   │   ├── ProtectedRoute.jsx      # Redirects unauthenticated users to /login
│   │   │   └── RoleRoute.jsx           # Redirects wrong-role users away
│   │   │
│   │   ├── context/
│   │   │   └── AuthContext.jsx         # JWT storage, user state, login/logout
│   │   │
│   │   ├── services/
│   │   │   └── api.js                  # Axios instance with base URL + auth header
│   │   │
│   │   ├── App.jsx                     # Router setup + SmartRedirect
│   │   └── main.jsx                    # React DOM render entry
│   │
│   ├── public/
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── database/
│   └── schema_mysql.sql             # Complete MySQL schema + seed data
│
└── README.md
```

---

## 7. Database Schema

### Entity Relationship Overview

```
users (1) ──────────── (0..1) wills
wills (1) ──────────── (0..*) assets
wills (1) ──────────── (0..*) documents
wills (1) ──────────── (0..*) beneficiaries
users (1) ──────────── (0..*) audit_logs
users (1) ──────────── (0..*) checkin_notifications
```

### Table Definitions

#### `users`
```sql
CREATE TABLE users (
    id              CHAR(36)     PRIMARY KEY,          -- UUID v4 (generated in app)
    full_name       VARCHAR(255) NOT NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    password        VARCHAR(500) NOT NULL,             -- Phase 1: plaintext | Phase 2: bcrypt
    role            ENUM('admin','user','manager') DEFAULT 'user',
    two_fa_secret   VARCHAR(255) DEFAULT NULL,         -- Phase 2: TOTP secret
    two_fa_enabled  TINYINT(1)   DEFAULT 0,            -- Phase 2: 2FA toggle
    oauth_provider  VARCHAR(50)  DEFAULT NULL,         -- Phase 2: google/github
    oauth_id        VARCHAR(255) DEFAULT NULL,         -- Phase 2: OAuth user ID
    last_checkin    DATETIME     DEFAULT CURRENT_TIMESTAMP, -- Dead Man's Switch anchor
    is_active       TINYINT(1)   DEFAULT 1,            -- Admin can disable accounts
    created_at      DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### `wills`
```sql
CREATE TABLE wills (
    id                    CHAR(36)     PRIMARY KEY,
    user_id               CHAR(36)     NOT NULL,
    title                 VARCHAR(255) NOT NULL,
    description           TEXT,
    checkin_interval_days INT          DEFAULT 30,   -- Days before first warning
    grace_period_days     INT          DEFAULT 7,    -- Extra days before trigger
    status                ENUM('active','triggered','expired') DEFAULT 'active',
    triggered_at          DATETIME     DEFAULT NULL, -- When the will was triggered
    created_at            DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updated_at            DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

> **Trigger Logic**: Cron checks `(NOW() - users.last_checkin) >= (checkin_interval_days + grace_period_days)`.  
> With `TIME_UNIT=minutes`, these day values are treated as **minutes** instead.

#### `assets`
```sql
CREATE TABLE assets (
    id          CHAR(36)    PRIMARY KEY,
    will_id     CHAR(36)    NOT NULL,
    asset_type  ENUM('account','bank','password','info','note') NOT NULL,
    title       VARCHAR(255) NOT NULL,   -- e.g., "Gmail Account", "HSBC Savings"
    content     TEXT        NOT NULL,    -- The sensitive value
    iv          VARCHAR(255) DEFAULT NULL, -- Phase 2: AES-256 init vector
    created_at  DATETIME    DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (will_id) REFERENCES wills(id) ON DELETE CASCADE
);
```

#### `documents`
```sql
CREATE TABLE documents (
    id            CHAR(36)     PRIMARY KEY,
    will_id       CHAR(36)     NOT NULL,
    original_name VARCHAR(255) NOT NULL,   -- Original filename from user
    stored_name   VARCHAR(255) NOT NULL,   -- UUID-based filename on disk
    stored_path   VARCHAR(500) NOT NULL,   -- Full path in /uploads/
    file_size     BIGINT       NOT NULL,   -- Bytes
    mime_type     VARCHAR(100) NOT NULL,   -- e.g., application/pdf
    sha256_hash   VARCHAR(64)  DEFAULT NULL, -- Phase 2: integrity check
    signature     TEXT         DEFAULT NULL, -- Phase 2: digital signature
    iv            VARCHAR(255) DEFAULT NULL, -- Phase 2: encryption
    uploaded_at   DATETIME     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (will_id) REFERENCES wills(id) ON DELETE CASCADE
);
```

#### `beneficiaries`
```sql
CREATE TABLE beneficiaries (
    id           CHAR(36)     PRIMARY KEY,
    will_id      CHAR(36)     NOT NULL,
    name         VARCHAR(255) NOT NULL,
    email        VARCHAR(255) NOT NULL,
    phone        VARCHAR(50),
    relationship VARCHAR(100),              -- e.g., "Wife", "Son", "Lawyer"
    access_token VARCHAR(500) DEFAULT NULL, -- 64-char hex, generated at trigger time
    token_expires DATETIME    DEFAULT NULL, -- NOW() + 7 days
    notified_at  DATETIME     DEFAULT NULL, -- When email was sent
    accessed_at  DATETIME     DEFAULT NULL, -- When trustee first opened the link
    created_at   DATETIME     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (will_id) REFERENCES wills(id) ON DELETE CASCADE
);
```

#### `audit_logs`
```sql
CREATE TABLE audit_logs (
    id          CHAR(36)     PRIMARY KEY,
    user_id     CHAR(36),                  -- NULL if user was deleted
    action      VARCHAR(255) NOT NULL,     -- e.g., 'USER_LOGIN', 'WILL_TRIGGERED'
    details     TEXT,                      -- JSON-encoded additional context
    ip_address  VARCHAR(50),
    created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
```

**Logged actions include:**
`USER_REGISTERED` `USER_LOGIN` `USER_LOGOUT` `WILL_CREATED` `WILL_UPDATED`
`WILL_TRIGGERED` `ASSET_CREATED` `ASSET_DELETED` `DOCUMENT_UPLOADED`
`DOCUMENT_DELETED` `BENEFICIARY_ADDED` `BENEFICIARY_REMOVED` `CHECKIN`

#### `checkin_notifications`
```sql
CREATE TABLE checkin_notifications (
    id                CHAR(36) PRIMARY KEY,
    user_id           CHAR(36) NOT NULL,
    notification_type ENUM('warning','final_warning','triggered'),
    sent_at           DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

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

### Seed Data

The schema ships with two default accounts:

| Role | Email | Password |
|------|-------|----------|
| admin | `admin@wasiyya.com` | `Admin@123` |
| user | `user@wasiyya.com` | `User@123` |
| manager | `manager@wasiyya.com` | `Manager@123` |

> **Note:** Seed passwords are stored as plaintext in the SQL file. On first login, each account's password is automatically migrated to bcrypt (cost 12). Change all seed passwords before any real deployment.

---

## 8. Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **XAMPP** (or any MySQL 8.0 server)
- **npm** v9 or higher
- A code editor (VS Code recommended)

### Step 1 — Clone the Repository

```bash
git clone https://github.com/omar0y/wasiyya.git
cd wasiyya
```

### Step 2 — Set Up the Database

1. Start **XAMPP Control Panel** → click **Start** for both **Apache** and **MySQL**
2. Open your browser: `http://localhost/phpmyadmin`
3. Click **New** in the left panel → database name: `wasiyya` → **Create**
4. Select the `wasiyya` database → click the **Import** tab
5. Click **Choose File** → select `database/schema_mysql.sql` → click **Go**
6. You should see "Import has been successfully finished"

### Step 3 — Configure the Backend

```bash
cd backend
copy .env.example .env
```

Open `.env` and fill in your values (see [Section 9](#9-environment-variables) for details).

**Minimum required changes:**
- Set `JWT_SECRET` to any long random string (at least 32 characters)
- Set `AES_SECRET_KEY` — generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- If using Gmail: set `EMAIL_USER` and `EMAIL_PASS` (use an App Password, not your login password)
- If testing: set `TIME_UNIT=minutes`
- **OAuth (optional):** set `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` and/or `GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET` — leave as placeholders to disable OAuth buttons

### Step 4 — Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 5 — Start the Backend Server

```bash
npm run dev
```

You should see:
```
🚀 Wasiyya backend — http://localhost:3001
⏱️  TIME_UNIT = minutes
⏰ Checkin cron started — كل دقيقة (وضع التيست)
✅ MySQL connected — wasiyya
```

### Step 6 — Install Frontend Dependencies

Open a **new terminal tab**:

```bash
cd frontend
npm install
```

### Step 7 — Start the Frontend Dev Server

```bash
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms
  ➜  Local:   http://localhost:3000/
```

### Step 8 — Open the App

Navigate to **http://localhost:3000**

- Login as admin: `admin@wasiyya.com` / `Admin@123` → redirects to `/admin`
- Login as user: `user@wasiyya.com` / `User@123` → redirects to `/dashboard`

---

## 9. Environment Variables

Full reference for `backend/.env`:

```env
# ─── Server ──────────────────────────────────────────────────
PORT=3001
HTTP_PORT=3080            # HTTP→HTTPS redirect port (when SSL enabled)
NODE_ENV=development

# ─── Database (MySQL via XAMPP) ──────────────────────────────
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=              # XAMPP default is no password
DB_NAME=wasiyya

# ─── JWT ─────────────────────────────────────────────────────
JWT_SECRET=replace_this_with_a_long_random_string_min_32_chars
JWT_EXPIRES_IN=24h        # Token expiry: 24h, 7d, 30d, etc.

# ─── Session ─────────────────────────────────────────────────
# Used only for the OAuth redirect/callback cycle — not for user sessions
SESSION_SECRET=replace_this_with_another_long_random_string

# ─── AES-256-GCM Document Encryption ─────────────────────────
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
AES_SECRET_KEY=64_character_hex_string_here

# ─── Email ───────────────────────────────────────────────────
# Option A: Gmail with App Password (production — real emails sent)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password    # Generate at: myaccount.google.com/apppasswords
EMAIL_FROM=Wasiyya <your_email@gmail.com>

# Option B: Leave EMAIL_USER/EMAIL_PASS empty OR as placeholder values
# → System auto-creates an Ethereal test account
# → Email previews appear in admin panel Test Tools tab
# → No real emails are sent
EMAIL_HOST=smtp.ethereal.email
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASS=

# ─── App URLs ────────────────────────────────────────────────
FRONTEND_URL=http://localhost:3000    # Used in email links and OAuth redirects
BACKEND_URL=http://localhost:3001     # Used to build OAuth callback URLs

# ─── OAuth — Google ──────────────────────────────────────────
# Get credentials: https://console.cloud.google.com → APIs & Services → Credentials
# Authorized redirect URI: http://localhost:3001/api/auth/google/callback
# Leave as placeholders to disable Google login button
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# ─── OAuth — GitHub ──────────────────────────────────────────
# Get credentials: https://github.com/settings/developers → New OAuth App
# Authorization callback URL: http://localhost:3001/api/auth/github/callback
# Leave as placeholders to disable GitHub login button
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# ─── File Uploads ────────────────────────────────────────────
MAX_FILE_SIZE=10485760    # 10 MB in bytes
UPLOAD_PATH=./uploads

# ─── Dead Man's Switch ───────────────────────────────────────
# "minutes" → cron runs every minute, intervals treated as minutes (for testing)
# "days"    → cron runs daily at 9:00 AM, intervals treated as days (production)
TIME_UNIT=minutes

# ─── SSL (Optional) ──────────────────────────────────────────
# If both files exist, server starts in HTTPS mode + HTTP redirect automatically
SSL_CERT_PATH=./certs/server.cert
SSL_KEY_PATH=./certs/server.key
```

### Variable Reference Table

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3001` | Backend HTTPS (or HTTP) server port |
| `HTTP_PORT` | No | `3080` | HTTP redirect port (when SSL active) |
| `NODE_ENV` | No | `development` | Node environment |
| `DB_HOST` | Yes | `localhost` | MySQL host |
| `DB_PORT` | No | `3306` | MySQL port |
| `DB_USER` | Yes | `root` | MySQL username |
| `DB_PASSWORD` | No | _(empty)_ | MySQL password |
| `DB_NAME` | Yes | `wasiyya` | Database name |
| `JWT_SECRET` | Yes | — | JWT signing secret (min 32 chars) |
| `JWT_EXPIRES_IN` | No | `24h` | JWT token lifetime |
| `SESSION_SECRET` | No | _(falls back to JWT_SECRET)_ | Session secret for OAuth cycle |
| `AES_SECRET_KEY` | Yes | — | 64-char hex key for AES-256-GCM document encryption |
| `EMAIL_HOST` | No | — | SMTP server hostname |
| `EMAIL_PORT` | No | `587` | SMTP port |
| `EMAIL_USER` | No | — | SMTP login (blank = Ethereal fallback) |
| `EMAIL_PASS` | No | — | SMTP password |
| `EMAIL_FROM` | No | `wasiyya <noreply@wasiyya.com>` | From address in emails |
| `FRONTEND_URL` | No | `http://localhost:3000` | Used in email links and OAuth redirects |
| `BACKEND_URL` | No | `http://localhost:3001` | Used to build OAuth callback URLs |
| `GOOGLE_CLIENT_ID` | No | — | Google OAuth client ID (placeholder = disabled) |
| `GOOGLE_CLIENT_SECRET` | No | — | Google OAuth client secret |
| `GITHUB_CLIENT_ID` | No | — | GitHub OAuth client ID (placeholder = disabled) |
| `GITHUB_CLIENT_SECRET` | No | — | GitHub OAuth client secret |
| `MAX_FILE_SIZE` | No | `10485760` | Max upload size in bytes (10 MB) |
| `UPLOAD_PATH` | No | `./uploads` | Directory for uploaded files |
| `TIME_UNIT` | No | `days` | `minutes` for testing, `days` for production |
| `SSL_CERT_PATH` | No | `./certs/server.cert` | Path to TLS certificate |
| `SSL_KEY_PATH` | No | `./certs/server.key` | Path to TLS private key |

---

## 10. API Reference

All endpoints return JSON. Success responses: `{ success: true, data: ... }`.  
Error responses: `{ success: false, message: "..." }`.

**Base URL:** `http://localhost:3001/api`

---

### Authentication — `/api/auth`

#### `POST /auth/register`
Register a new user account.

**Request Body:**
```json
{
  "full_name": "Omar Abdelaal",
  "email": "omar@example.com",
  "password": "MyPass@123"
}
```

**Password Rules:**
- Minimum 8 characters
- At least 1 uppercase letter (A-Z)
- At least 1 digit (0-9)
- At least 1 special character (`!@#$%^&*(),.?":{}|<>`)

**Success Response — `201 Created`:**
```json
{
  "success": true,
  "message": "تم التسجيل بنجاح",
  "data": {
    "user": { "id": "uuid", "full_name": "...", "email": "...", "role": "user" },
    "token": "eyJhbGc..."
  }
}
```

**Error Responses:**
- `400` — Missing fields or password policy violation
- `409` — Email already registered

---

#### `POST /auth/login`
Login with email and password.

**Request Body:**
```json
{ "email": "omar@example.com", "password": "MyPass@123" }
```

**Success Response — `200 OK` (no 2FA):**
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "full_name": "...", "email": "...", "role": "user", "last_checkin": "..." },
    "token": "eyJhbGc..."
  }
}
```

**Success Response — `200 OK` (2FA enabled):**
```json
{
  "success": true,
  "requires2FA": true,
  "tempToken": "eyJhbGc..."
}
```
When `requires2FA` is true, the client must call `POST /auth/2fa/verify` with the `tempToken` and the TOTP code to receive the full JWT.

**Error Responses:**
- `400` — Missing fields
- `401` — Wrong credentials or account disabled

---

#### `GET /auth/2fa/setup`
Generate a new TOTP secret and QR code. Requires authentication.

**Response:**
```json
{
  "success": true,
  "data": {
    "qrCode": "data:image/png;base64,...",
    "secret": "JBSWY3DPEHPK3PXP"
  }
}
```
Scan the QR code with Google Authenticator or Authy, then call `POST /auth/2fa/enable` to activate.

---

#### `POST /auth/2fa/enable`
Enable 2FA after scanning the QR code. Requires authentication.

**Request Body:**
```json
{ "code": "123456" }
```

---

#### `POST /auth/2fa/verify`
Complete login when 2FA is enabled. **No authentication required** — uses the `tempToken` from login.

**Request Body:**
```json
{ "tempToken": "eyJhbGc...", "code": "123456" }
```

**Success Response — `200 OK`:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "full_name": "...", "role": "user" },
    "token": "eyJhbGc..."
  }
}
```

---

#### `POST /auth/2fa/disable`
Disable 2FA. Requires authentication + valid TOTP code.

**Request Body:**
```json
{ "code": "123456" }
```

---

#### `GET /auth/google`
Redirect to Google OAuth consent screen. **No authentication required.**

---

#### `GET /auth/github`
Redirect to GitHub OAuth authorization screen. **No authentication required.**

Both OAuth flows redirect back to `FRONTEND_URL/login?token=<jwt>&role=<role>` on success, or `FRONTEND_URL/login?error=1` on failure.

---

#### `GET /auth/me`
Get current user profile. Requires authentication.

**Headers:** `Authorization: Bearer <token>`

**Success Response — `200 OK`:**
```json
{
  "success": true,
  "data": { "id": "uuid", "full_name": "...", "email": "...", "role": "user", "last_checkin": "..." }
}
```

---

#### `POST /auth/logout`
Log out (records audit log). Requires authentication.

**Success Response — `200 OK`:**
```json
{ "success": true, "message": "تم تسجيل الخروج بنجاح" }
```

---

### Wills — `/api/wills`

All endpoints require authentication. Users can only access their own will.

#### `GET /wills`
Get the current user's will.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "title": "My Digital Will",
    "description": "...",
    "checkin_interval_days": 30,
    "grace_period_days": 7,
    "status": "active",
    "triggered_at": null,
    "created_at": "..."
  }
}
```
Returns `null` data if no will exists yet.

---

#### `POST /wills`
Create a new will (one per user).

**Request Body:**
```json
{
  "title": "My Digital Will",
  "description": "Instructions for my family",
  "checkin_interval_days": 30,
  "grace_period_days": 7
}
```

---

#### `PUT /wills/:id`
Update will settings.

**Request Body:** Same fields as POST (all optional).

---

#### `DELETE /wills/:id`
Delete the will. Cascades to all assets, documents, and beneficiaries.

---

### Assets — `/api/assets`

#### `GET /assets/:willId`
Get all assets for a will.

#### `POST /assets`
Add a new asset.

**Request Body:**
```json
{
  "will_id": "uuid",
  "asset_type": "bank",
  "title": "HSBC Savings Account",
  "content": "Account: 1234567890\nIBAN: GB12HSBC..."
}
```

**Asset types:** `account` | `bank` | `password` | `info` | `note`

#### `DELETE /assets/:id`
Delete an asset.

---

### Documents — `/api/documents`

#### `POST /documents/upload`
Upload a file. Uses `multipart/form-data`.

**Form fields:**
- `document` — the file
- `will_id` — target will UUID

**Allowed types:** PDF, JPG, JPEG, PNG, GIF, TXT, DOC, DOCX  
**Max size:** 10 MB

#### `GET /documents/:willId`
List all documents for a will.

**Response includes:** `id`, `original_name`, `file_size`, `mime_type`, `uploaded_at`

#### `GET /documents/download/:id`
Download a document. Streams the file binary.

#### `DELETE /documents/:id`
Delete a document (removes DB record and file from disk).

#### `POST /documents/verify/:id`
Verify document integrity and digital signature.

**Response:**
```json
{
  "success": true,
  "data": {
    "intact": true,
    "hash_match": true,
    "signature_valid": true,
    "stored_hash": "a3f1...",
    "current_hash": "a3f1...",
    "message": "الملف سليم والتوقيع صحيح"
  }
}
```
Returns `intact: false` if the file has been tampered with since upload.

---

### Beneficiaries — `/api/beneficiaries`

#### `GET /beneficiaries/:willId`
Get all trustees for a will.

#### `POST /beneficiaries`
Add a trustee.

**Request Body:**
```json
{
  "will_id": "uuid",
  "name": "Sara Ahmed",
  "email": "sara@example.com",
  "phone": "+20 1234567890",
  "relationship": "Wife"
}
```

#### `DELETE /beneficiaries/:id`
Remove a trustee.

#### `GET /beneficiaries/access/:token`
**Public endpoint — no authentication required.**

Validates the access token and returns will contents for the trustee.

**Success Response:**
```json
{
  "success": true,
  "data": {
    "will": { "title": "...", "description": "...", "triggered_at": "..." },
    "assets": [
      { "asset_type": "bank", "title": "HSBC Savings", "content": "..." }
    ],
    "documents": [
      { "id": "uuid", "original_name": "contract.pdf", "file_size": 204800, "mime_type": "application/pdf" }
    ]
  }
}
```

**Error Responses:**
- `404` — Token not found
- `403` — Token expired (> 7 days) or will not triggered

---

### Check-in — `/api/checkin`

#### `POST /checkin`
Submit "I'm alive" check-in.

Updates `users.last_checkin = NOW()` and logs the action.

**Response:**
```json
{
  "success": true,
  "message": "تم تجديد وجودك بنجاح",
  "data": { "last_checkin": "2026-05-09T10:00:00.000Z" }
}
```

#### `GET /checkin/status`
Get current check-in status for the dashboard.

**Response:**
```json
{
  "success": true,
  "data": {
    "last_checkin": "2026-05-09T10:00:00.000Z",
    "elapsed": 2,
    "days_remaining": 35,
    "is_overdue": false,
    "time_unit": "minutes",
    "checkin_interval": 30,
    "grace_period": 7
  }
}
```

---

### Health Check — `/api/health`

**Public endpoint.**

```json
{
  "status": "ok",
  "phase": 2,
  "time_unit": "minutes",
  "timestamp": "2026-05-09T10:00:00.000Z"
}
```

---

### Admin — `/api/admin`

**All endpoints require `role: admin`.**

#### `GET /admin/stats`
System-wide statistics dashboard.

**Response:**
```json
{
  "success": true,
  "data": {
    "total_users": 10,
    "active_users": 8,
    "total_wills": 7,
    "active_wills": 6,
    "triggered_wills": 1,
    "total_documents": 23,
    "total_assets": 45
  }
}
```

#### `GET /admin/users`
Get all users (ordered by creation date, newest first).

#### `PUT /admin/users/:id/toggle`
Enable or disable a user account (`is_active = NOT is_active`).

> Admin cannot disable their own account.

#### `PUT /admin/users/:id/role`
Change a user's role.

**Request Body:**
```json
{ "role": "manager" }
```
Valid values: `user` | `manager` | `admin`

#### `GET /admin/logs?page=1&limit=50`
Paginated audit logs with user info (email + full name).

**Response includes pagination:**
```json
{
  "success": true,
  "data": [...],
  "pagination": { "total": 120, "page": 1, "limit": 50 }
}
```

#### `GET /admin/all-wills`
All wills in the system with owner info and counts.

**Response includes per-will:** `assets_count`, `docs_count`, `ben_count`

#### `GET /admin/triggered-wills`
All triggered wills with per-beneficiary access URLs and email preview links.

#### `GET /admin/time-unit`
Returns current time unit setting.

```json
{ "success": true, "data": { "time_unit": "minutes" } }
```

#### `GET /admin/email-mode`
Returns email configuration mode.

```json
{ "success": true, "data": { "configured": true, "mode": "brevo" } }
```

#### `POST /admin/force-check`
Manually runs the Dead Man's Switch cron check immediately.

**Response:**
```json
{
  "success": true,
  "message": "تم تشغيل الفحص — وصايا فُعِّلت: 1، تحذيرات: 0",
  "data": { "triggered": 1, "warned": 0, "checked": 3 }
}
```

#### `POST /admin/reset-checkin/:id?ago=5`
Set a user's `last_checkin` to N minutes/days ago (for testing).

**Query param:** `ago` — number of units to go back (default: 5)

#### `POST /admin/reset-will/:id`
Reset a triggered will back to active. Clears `triggered_at` and all beneficiary tokens.

---

## 11. Authentication & Authorization

### JWT Flow (no 2FA)

```
1. Client sends POST /api/auth/login
2. Server validates credentials (bcrypt compare)
3. Server signs: jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '24h' })
4. Client stores token in localStorage
5. All subsequent requests: Authorization: Bearer <token>
6. AuthMiddleware verifies token → loads user from DB → sets req.user
```

### 2FA Login Flow

```
1. Client sends POST /api/auth/login
2. Server detects user.two_fa_enabled = 1
3. Server returns: { requires2FA: true, tempToken }
   → tempToken is a short-lived JWT (5 min) with { pending2FA: true }
4. Client shows OTP input screen
5. Client sends POST /api/auth/2fa/verify { tempToken, code }
6. Server verifies tempToken (not expired, pending2FA flag present)
7. Server verifies TOTP code with speakeasy
8. Server issues full JWT → client stores and proceeds normally
```

### OAuth Flow (Google / GitHub)

```
1. User clicks Google/GitHub button → browser navigates to /api/auth/google
2. Passport redirects to provider consent screen
3. Provider redirects back to /api/auth/google/callback
4. Passport verifies and calls findOrCreateOAuthUser:
   - Finds existing account by oauth_provider + oauth_id
   - OR links to existing account by matching email
   - OR creates new account with a random bcrypt password
5. Server signs JWT, redirects to: FRONTEND_URL/login?token=<jwt>&role=<role>
6. Login.jsx useEffect reads URL params, calls /api/auth/me, stores token
```

### AuthMiddleware (`auth.middleware.js`)

- Reads `Authorization: Bearer <token>` header
- Verifies token with `jwt.verify(token, JWT_SECRET)`
- Fetches user from DB to confirm they still exist and `is_active = 1`
- Sets `req.user = { id, email, role, is_active }`
- Returns `401` if token missing, expired, invalid, or user disabled

### RBACMiddleware (`rbac.middleware.js`)

```javascript
router.use(authenticate, authorize('admin'));  // Admin-only route
```

- Called after `authenticate`
- Checks `req.user.role` against allowed roles array
- Returns `403` if role not permitted

### Route Protection Summary

| Route Pattern | Auth Required | Role Required |
|---------------|--------------|---------------|
| `/api/auth/register` | No | — |
| `/api/auth/login` | No | — |
| `/api/auth/2fa/verify` | No | — (uses tempToken) |
| `/api/auth/google` | No | — |
| `/api/auth/github` | No | — |
| `/api/auth/google/callback` | No | — |
| `/api/auth/github/callback` | No | — |
| `/api/beneficiaries/access/:token` | No | — |
| `/api/health` | No | — |
| `/api/auth/me`, `/api/auth/logout` | Yes | any authenticated |
| `/api/auth/2fa/setup`, `/api/auth/2fa/enable`, `/api/auth/2fa/disable` | Yes | any authenticated |
| `/api/wills`, `/api/assets`, `/api/documents`, etc. | Yes | `user` or `manager` only |
| `/api/admin/*` | Yes | `admin` only |

### Frontend Route Guards

- **`ProtectedRoute`** — redirects unauthenticated users to `/login`
- **`RoleRoute`** — redirects users without the required role
- **`SmartRedirect`** — on `/` or unknown paths: admin → `/admin`, user → `/dashboard`, unauthenticated → `/login`

---

## 12. Dead Man's Switch Mechanism

This is the core feature of Wasiyya. Here is the complete technical flow:

### Configuration

Each will has two timing fields (in the DB they are named `_days` but treated as minutes when `TIME_UNIT=minutes`):

- `checkin_interval_days` (default: 30) — How long the user can go without checking in before getting a warning
- `grace_period_days` (default: 7) — Extra time after the warning before the will is triggered

**Total time before trigger = `checkin_interval + grace_period`**

Example (days): 30-day interval + 7-day grace = triggered after **37 days** of no check-in.  
Example (minutes): 3-minute interval + 1-minute grace = triggered after **4 minutes** of no check-in.

### Cron Schedule

```javascript
// TIME_UNIT=minutes → every minute
const schedule = '* * * * *';

// TIME_UNIT=days → every day at 9:00 AM
const schedule = '0 9 * * *';
```

### Check Logic (`runCheckinCheck`)

```
For each active will:
    elapsed = current_time - user.last_checkin   (in minutes or days)

    if elapsed >= interval + grace:
        → TRIGGER WILL
        → Email all beneficiaries

    else if elapsed == interval + grace - 1:
        → Send FINAL WARNING email to user

    else if elapsed == interval:
        → Send WARNING email to user
```

### Will Trigger Process (`triggerWill`)

1. `UPDATE wills SET status = 'triggered', triggered_at = NOW()`
2. `SELECT all beneficiaries for this will`
3. For each beneficiary:
   - Generate `token = crypto.randomBytes(32).toString('hex')` (64-char hex)
   - Set `token_expires = NOW() + 7 days`
   - `UPDATE beneficiary SET access_token, token_expires, notified_at = NOW()`
   - Call `emailService.sendBeneficiaryNotification(email, name, token, beneficiaryId)`
4. `INSERT INTO audit_logs (WILL_TRIGGERED)`

### Check-in Reset

When user clicks "I'm OK":
- `POST /api/checkin`
- `UPDATE users SET last_checkin = NOW()`
- Cron will see `elapsed = 0` on next run → no action taken

### Timeline Example (Testing with minutes)

```
T+0:00  User creates will (interval=3min, grace=1min)
T+0:00  User's last_checkin = now
T+3:00  Cron fires → elapsed=3 → Warning email sent
T+3:00  Cron fires → elapsed=3 → Final warning sent (grace=1, so 3+1-1=3)
T+4:00  Cron fires → elapsed=4 → WILL TRIGGERED, beneficiary emails sent
```

---

## 13. Email System

### Architecture

The email service auto-detects which provider to use at startup:

```javascript
const isGmailConfigured = () =>
    EMAIL_USER && EMAIL_USER !== 'your@gmail.com' && EMAIL_PASS && EMAIL_PASS !== 'your_app_password';
```

- **If configured**: uses the specified SMTP (Brevo recommended)
- **If not configured**: auto-creates an [Ethereal](https://ethereal.email) test account

### Brevo SMTP (Production)

1. Create an account at [brevo.com](https://www.brevo.com)
2. Go to: Settings → SMTP & API → SMTP
3. Generate SMTP credentials
4. Add to `.env`:
   ```env
   EMAIL_HOST=smtp-relay.brevo.com
   EMAIL_PORT=587
   EMAIL_USER=your_smtp_login@smtp-brevo.com
   EMAIL_PASS=your_generated_key
   EMAIL_FROM=Wasiyya <no-reply@yourdomain.com>
   ```
5. Real emails are delivered to actual inboxes

### Ethereal (Development)

- Zero configuration needed — just leave `EMAIL_USER` empty
- On first email send, Nodemailer auto-creates a temporary test account
- Preview URLs for each email are stored in an in-memory `Map<beneficiaryId, previewUrl>`
- Admin panel → Test Tools tab shows clickable preview links
- No emails reach real inboxes

### Email Templates

| Email | Trigger | Content |
|-------|---------|---------|
| Warning | `elapsed == interval` | Yellow warning with link to dashboard |
| Final Warning | `elapsed == interval + grace - 1` | Red urgent warning |
| Beneficiary Notification | Will triggered | Green email with secure access link (7-day expiry) |

### Email Safety

All email functions are wrapped in try/catch. Email failures are **logged but never throw** — the cron check completes regardless of email delivery status.

---

## 14. Admin Panel

The admin panel is a completely separate system experience. Admins are redirected to `/admin` after login and have no access to the user-side will management pages.

### Tab 1 — لوحة التحكم (Dashboard)

- Live stat cards:
  - Total Users / Active Users
  - Total Wills / Active Wills
  - Triggered Wills
  - Total Documents / Assets
- Triggered wills summary list with owner names
- Recent audit log entries (last 10)

### Tab 2 — المستخدمون (Users)

- Full paginated list of all users
- Shows: name, email, role, status, last check-in, join date
- **Toggle button**: enable/disable account (admin cannot disable themselves)
- **Role dropdown**: change role (user / manager / admin) with immediate save
- Color-coded status badges

### Tab 3 — الوصايا (Wills)

- All wills in the system across all users
- Shows per will: owner name, title, status, creation date
- Counts: assets count, documents count, beneficiaries count
- Status badges color-coded: green (active), red (triggered), gray (expired)

### Tab 4 — السجلات (Audit Logs)

- Paginated log of every action in the system
- Shows: timestamp, user email, action name, IP address
- Color-coded by action type:
  - Blue: auth actions (login/logout/register)
  - Green: creation actions (will/asset/document created)
  - Red: triggered/deleted actions
  - Gray: check-in

### Tab 5 — أدوات التيست (Test Tools)

- **Email Mode Badge**: shows Brevo (real) or Ethereal (test) mode
- **Time Unit Badge**: shows minutes or days mode
- **Force Check button**: runs `runCheckinCheck()` immediately, shows results
- **Per-user Reset Check-in**: set any user's `last_checkin` to N units ago
- **Triggered Wills list**:
  - Shows each triggered will and all its beneficiaries
  - "افتح الوصية" link to the beneficiary access page
  - "📧 عرض الإيميل" link to Ethereal email preview (dev mode only)
  - "إعادة تعيين" button to reset will back to active
- **onRefresh**: all data auto-reloads after every test action

---

## 15. Frontend Pages & Routing

### Route Map

| Path | Component | Auth | Role | Description |
|------|-----------|------|------|-------------|
| `/login` | Login | No | — | Login form + 2FA step + OAuth redirect handler |
| `/register` | Register | No | — | Registration form + OAuth buttons |
| `/` | SmartRedirect | No | — | Redirects by auth/role |
| `*` | SmartRedirect | No | — | 404 → smart redirect |
| `/dashboard` | Dashboard | Yes | user | Check-in status overview |
| `/will` | MyWill | Yes | user | Will creation & settings |
| `/assets` | Assets | Yes | user | Asset management |
| `/documents` | Documents | Yes | user | Document upload/manage + verify |
| `/beneficiaries` | Beneficiaries | Yes | user | Trustee management |
| `/verification` | Verification | Yes | user | Check-in submission page |
| `/settings/2fa` | TwoFactorSetup | Yes | user | Enable/disable 2FA + QR code |
| `/admin` | AdminPanel | Yes | admin | Admin panel (5 tabs) |
| `/admin?tab=users` | AdminPanel | Yes | admin | Users tab |
| `/admin?tab=wills` | AdminPanel | Yes | admin | Wills tab |
| `/admin?tab=logs` | AdminPanel | Yes | admin | Logs tab |
| `/admin?tab=test` | AdminPanel | Yes | admin | Test tools tab |
| `/access/:token` | BeneficiaryAccess | No | — | Trustee will access |

### Key Components

#### `Sidebar.jsx`
Role-aware navigation sidebar. Renders completely different links for admin vs user:

- **Admin links**: لوحة التحكم, المستخدمون, الوصايا, السجلات, أدوات التيست
- **User links**: الرئيسية, وصيّتي, الأصول, الوثائق, الورثة, تجديد الوجود, المصادقة الثنائية

Shows user name, email, and role badge. Logout button at bottom.

#### `CheckinBanner.jsx`
Appears at the top of all user pages when check-in is needed. Polls `/api/checkin/status` every 30 seconds.

- Hidden for admins entirely
- Amber banner: check-in needed within threshold
- Red banner: overdue (will may trigger soon)
- Inline "أنا بخير ✓" button for immediate check-in

#### `AuthContext.jsx`
React context providing:
- `user` — current user object (null if not logged in)
- `loading` — true during initial auth check
- `login(token)` — stores JWT, fetches user profile
- `logout()` — clears localStorage and user state

#### `api.js` (Axios Instance)
Configured with:
- `baseURL: http://localhost:3001/api`
- Request interceptor: automatically adds `Authorization: Bearer <token>` from localStorage
- Response interceptor: on `401`, clears storage and redirects to `/login`

---

## 16. Testing Mode

Setting `TIME_UNIT=minutes` in `.env` activates test mode:

| Feature | Days Mode (Production) | Minutes Mode (Testing) |
|---------|----------------------|----------------------|
| Cron schedule | Daily at 9:00 AM | Every minute |
| Interval unit | Days | Minutes |
| Grace period unit | Days | Minutes |
| Default interval | 30 days | 3 minutes |
| Default grace | 7 days | 1 minute |
| Trigger time | 37 days | 4 minutes |
| Dashboard label | يوم | دقيقة |
| Admin badge | production | test mode (purple) |

### End-to-End Test Procedure

1. Set `TIME_UNIT=minutes` in `.env`, restart backend
2. Login as `user@wasiyya.com`
3. Go to `/will` — create will with interval=2, grace=1
4. Go to `/beneficiaries` — add a trustee (your email)
5. Go to Admin panel → Test Tools tab
6. Click **"Reset Check-in"** for the user → set to 4 minutes ago
7. Click **"Force Check"** → will should trigger immediately
8. If using Ethereal: click "📧 عرض الإيميل" to see the email
9. Click "افتح الوصية" to see the trustee access page
10. Test complete — click "إعادة تعيين" to reset for next test

---

## 17. Security

### Implemented

| Feature | Implementation |
|---------|---------------|
| JWT Authentication | HS256 signed tokens, 24h expiry, verified on every request |
| bcrypt Password Hashing | Cost factor 12; plaintext passwords auto-migrated on first login |
| RBAC | Role checked after JWT verification; admin blocked from all will routes |
| Two-Factor Authentication | TOTP via speakeasy — compatible with Google Authenticator and Authy |
| OAuth (Google + GitHub) | Passport strategies; find-or-create by oauth_id or email; links existing accounts |
| AES-256-GCM Encryption | All uploaded documents encrypted at rest; transparent decryption on download |
| Document Integrity | SHA-256 hash computed at upload, stored in `documents.sha256_hash` |
| Digital Signatures | RSA-2048 auto-generated key pair (`certs/`); each document signed at upload |
| Document Verification | `/verify` endpoint + UI modal — confirms hash match and signature validity |
| HTTPS Support | Automatic HTTPS when SSL certs present; HTTP→HTTPS redirect on `HTTP_PORT` |
| Rate Limiting | 500 requests per 15-minute window per IP |
| Helmet | Sets 15+ security HTTP headers (XSS protection, HSTS, etc.) |
| CORS | Restricted to `FRONTEND_URL` only |
| File Type Validation | Multer rejects non-allowed MIME types |
| File Size Limit | 10 MB max per upload |
| Token Expiry | Beneficiary access tokens expire after 7 days |
| Account Disable | Admin can block accounts; disabled accounts rejected even with valid JWT |
| Audit Trail | Every significant action logged with IP address |
| Self-disable Protection | Admin cannot disable their own account |
| 2FA Temp Token | Second-step login uses a short-lived JWT (5 min, `pending2FA` flag) |

### Known Limitations

| Limitation | Notes |
|------------|-------|
| JWT not invalidatable before expiry | Refresh token / blacklist pattern not yet implemented |
| Asset content not encrypted | `assets.iv` column exists in schema — encryption not yet applied to assets |
| No email verification on register | Users can register with any email; no confirmation step |
| No password reset flow | No forgot-password / reset-via-email flow yet |

---

## 18. Phase 2 Roadmap

- [x] `bcrypt` password hashing (cost factor 12) — auto-migration on login
- [x] AES-256-GCM encryption for uploaded documents (at-rest encryption)
- [x] SHA-256 integrity verification for uploaded documents
- [x] Digital signatures (RSA-2048) for documents — auto-generated key pair
- [x] TOTP two-factor authentication — Google Authenticator / Authy compatible
- [x] Google / GitHub OAuth login — find-or-create, email linking
- [x] HTTP → HTTPS automatic redirect when SSL certificates present
- [ ] AES-256-GCM encryption for asset content (`assets.iv` column ready)
- [ ] Refresh token pattern (short-lived access tokens + long-lived refresh)
- [ ] Email verification on registration
- [ ] Password reset via email flow
- [ ] Multi-language support (Arabic, English)
- [ ] Mobile-responsive improvements
- [ ] Notification preferences (email frequency, channel)
- [ ] Will versioning / history
- [ ] Legal advisor role (limited read-only access)
- [ ] Automated test suite (Jest + Supertest)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Docker Compose for production deployment
- [ ] Cloud storage for documents (AWS S3 / Cloudflare R2)

---

## 19. Team

| Name | ID | Role |
|------|----|------|
| عمر عبدالعال سعد — Omar Abdelaal Saad | 2305165 | Full-Stack Lead |
| محمد أسامه محمد — Mohammed Osama Mohammed | 2305180 | Backend & Database |
| مصطفى علي مصطفى — Mustafa Ali Mustafa | 2305616 | Frontend & UI/UX |

**Supervisor:** Faculty of Engineering — Software Engineering Department  
**Academic Year:** 2025 / 2026

---

## 20. License

MIT License

Copyright (c) 2026 Wasiyya Team

Permission is hereby granted, free of charge, to any person obtaining a copy of this software to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND. THE AUTHORS SHALL NOT BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY ARISING FROM USE OF THE SOFTWARE.

---

<div align="center">

**وصيّة — Wasiyya** | Digital Will Management System  
Built with Node.js, React, MySQL | University Software Engineering Project 2026

</div>
