# وصيّة — Wasiyya 📜
### Digital Inheritance & Electronic Will Platform

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-v20-339933?style=for-the-badge&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.18-000000?style=for-the-badge&logo=express&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

**University Software Engineering Final Project — 2026**

</div>

---

## 📌 Project Overview

**Wasiyya** (وصيّة) is a full-stack web-based Digital Will Management System that allows users to securely store their digital assets — accounts, passwords, bank information, and personal documents — and automatically transfer access to designated heirs when the user becomes inactive.

The system implements a **Dead Man's Switch** mechanism: if the user does not confirm their activity within a defined grace period, the system automatically triggers the will and notifies all designated trustees via email with a secure, time-limited access link.

The platform supports Arabic (RTL) as the primary interface language with a clean, modern design.

---

## ✨ Core Features

### 👤 Will Owner (موصي)
- Secure registration & login with JWT authentication
- Password policy enforcement (uppercase, digit, special character)
- Create and manage a personal digital will with customizable grace period
- Add structured digital assets: `account`, `bank`, `password`, `info`, `note`
- Upload confidential documents (PDF, JPG, PNG, TXT, DOC, DOCX — up to 10 MB)
- Manage trustees (beneficiaries) with name, relation, and email
- Confirm activity with a one-click "I'm Alive" check-in
- Real-time check-in status dashboard with progress bar and countdown

### 🔔 Trustee (وارث / وصي)
- Receive automated email notification when will is triggered
- Access will contents via a secure, time-limited token link (valid 7 days)
- View all assets and download all attached documents

### 🛡️ Admin (مدير النظام)
- Fully separate admin panel — not an enhanced user, a dedicated system manager
- **Dashboard tab**: live statistics, triggered wills, recent audit activity
- **Users tab**: view all users, enable/disable accounts, change roles
- **Wills tab**: view all wills system-wide with asset/document/beneficiary counts
- **Logs tab**: color-coded audit logs with pagination
- **Test Tools tab**: toggle time unit, force trigger checks, reset check-ins, view email previews

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, React Router v6 |
| Backend | Node.js, Express 4, JWT, Multer, node-cron |
| Database | MySQL 8.0 (via XAMPP / phpMyAdmin) |
| Auth | JSON Web Tokens (JWT) + Role-Based Access Control |
| Email | Nodemailer + Brevo SMTP (with Ethereal fallback for dev) |
| Scheduling | node-cron Dead Man's Switch (per-minute in test mode, daily in production) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- XAMPP (or any MySQL 8.0 server)

### 1. Clone the repository

```bash
git clone https://github.com/omar0y/wasiyya.git
cd wasiyya
```

### 2. Set up the database

1. Start **XAMPP** and ensure **Apache** and **MySQL** are running
2. Open **phpMyAdmin** at `http://localhost/phpmyadmin`
3. Create a new database named `wasiyya`
4. Import the schema: select the `wasiyya` database → **Import** → choose `database/schema_mysql.sql`

### 3. Configure the backend

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your settings:

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=wasiyya

# Auth
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRES_IN=24h

# Email (Brevo SMTP recommended — or leave blank for Ethereal dev fallback)
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_USER=your_brevo_smtp_login
EMAIL_PASS=your_brevo_smtp_key
EMAIL_FROM=Wasiyya <no-reply@yourdomain.com>

# App
FRONTEND_URL=http://localhost:3000
TIME_UNIT=minutes      # "minutes" for testing, "days" for production
```

```bash
npm install
npm run dev
```

### 4. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

### 5. Open the app

Navigate to **http://localhost:3000**

---

## 🔑 Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@wasiyya.com` | `Admin@123` |
| User | `user@wasiyya.com` | `User@123` |

> Credentials are seeded automatically when the schema is imported.

---

## 📁 Project Structure

```
wasiyya/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js        # MySQL pool (pg-compatible wrapper)
│   │   │   └── multer.js          # File upload config
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── will.controller.js
│   │   │   ├── asset.controller.js
│   │   │   ├── document.controller.js
│   │   │   ├── beneficiary.controller.js
│   │   │   ├── checkin.controller.js
│   │   │   └── admin.controller.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js  # JWT verification
│   │   │   ├── rbac.middleware.js  # Role-based access
│   │   │   └── validate.middleware.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── will.routes.js
│   │   │   ├── asset.routes.js
│   │   │   ├── document.routes.js
│   │   │   ├── beneficiary.routes.js
│   │   │   ├── checkin.routes.js
│   │   │   └── admin.routes.js
│   │   └── services/
│   │       ├── checkin.service.js  # Dead Man's Switch (node-cron)
│   │       └── email.service.js    # Brevo SMTP + Ethereal fallback
│   ├── uploads/
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   ├── Dashboard.jsx       # Checkin status + will overview
│       │   ├── MyWill.jsx          # Will creation & settings
│       │   ├── Assets.jsx
│       │   ├── Documents.jsx
│       │   ├── Beneficiaries.jsx
│       │   ├── Verification.jsx    # Manual check-in page
│       │   ├── AdminPanel.jsx      # Full admin system (5 tabs)
│       │   └── BeneficiaryAccess.jsx
│       ├── components/
│       │   ├── Sidebar.jsx         # Role-aware navigation
│       │   ├── CheckinBanner.jsx   # Overdue warning banner
│       │   ├── ProtectedRoute.jsx
│       │   └── RoleRoute.jsx
│       ├── context/
│       │   └── AuthContext.jsx
│       └── services/
│           └── api.js              # Axios instance
│
└── database/
    └── schema_mysql.sql            # Full MySQL schema + seed data
```

---

## 🗃️ Database Schema

```
users
  └── wills
        ├── assets
        ├── documents
        └── beneficiaries
              └── (receives email notification with access token)

users ── audit_logs   (all system actions tracked)
```

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login — returns JWT |
| GET | `/api/auth/me` | Get current user profile |

### Wills & Assets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/wills` | Get user's will |
| POST | `/api/wills` | Create will |
| PUT | `/api/wills/:id` | Update will settings |
| GET | `/api/assets/:willId` | List assets |
| POST | `/api/assets` | Add asset |
| DELETE | `/api/assets/:id` | Remove asset |

### Documents
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/documents/upload` | Upload document |
| GET | `/api/documents/:willId` | List documents |
| GET | `/api/documents/download/:id` | Download file |
| DELETE | `/api/documents/:id` | Delete document |

### Beneficiaries & Check-in
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/beneficiaries/:willId` | List trustees |
| POST | `/api/beneficiaries` | Add trustee |
| DELETE | `/api/beneficiaries/:id` | Remove trustee |
| POST | `/api/checkin` | Submit "I'm alive" check-in |
| GET | `/api/checkin/status` | Get check-in status |
| GET | `/api/access/:token` | Trustee will access |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | System-wide statistics |
| GET | `/api/admin/users` | All users |
| PUT | `/api/admin/users/:id/toggle` | Enable/disable user |
| PUT | `/api/admin/users/:id/role` | Change user role |
| GET | `/api/admin/logs` | Audit logs |
| GET | `/api/admin/all-wills` | All wills system-wide |
| GET | `/api/admin/triggered-wills` | Currently triggered wills |
| POST | `/api/admin/force-check` | Manually trigger checkin check |
| POST | `/api/admin/reset-checkin/:id` | Reset user's check-in timestamp |
| POST | `/api/admin/reset-will/:id` | Reset triggered will to active |
| GET | `/api/admin/time-unit` | Get current time unit (minutes/days) |
| GET | `/api/admin/email-mode` | Get email mode (brevo/ethereal) |

---

## ⚙️ Environment Variables

```env
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=wasiyya
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=24h
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_USER=your_smtp_user
EMAIL_PASS=your_smtp_key
EMAIL_FROM=Wasiyya <no-reply@example.com>
FRONTEND_URL=http://localhost:3000
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
TIME_UNIT=days
```

---

## 🔒 Security Notes (Phase 1)

> This is **Phase 1** of the project. The following features are **prepared for Phase 2**:
> - Passwords → **Phase 2: bcrypt hashing**
> - Asset content → **Phase 2: AES-256 encryption**
> - Documents → **Phase 2: SHA-256 integrity + digital signature**
> - No OAuth → **Phase 2: Google/GitHub SSO**
> - No 2FA → **Phase 2: TOTP authenticator**

The database schema already includes the necessary columns (`iv`, `sha256_hash`, `signature`, `two_fa_secret`) — Phase 2 fills them without schema changes.

---

## 🧪 Testing Mode

Set `TIME_UNIT=minutes` in `.env` to run the Dead Man's Switch on a per-minute basis instead of daily. The admin panel's **Test Tools** tab provides:

- One-click force trigger of the checkin check
- Reset any user's last check-in to simulate expiry (by N minutes/days ago)
- Reset a triggered will back to active for re-testing
- Live email preview links (Ethereal mode) to inspect notification emails

---

## 📋 SDLC Documentation

This project follows a complete Software Engineering lifecycle:

1. **Requirements** — Problem statement, functional & non-functional requirements, user roles
2. **Design** — System architecture, ER diagram, UML (Use Case, Sequence, Activity, Class, State Machine)
3. **Implementation** — MVC architecture, REST API, React SPA with RTL Arabic UI
4. **Testing** — 30+ test cases across all modules, plus admin test-mode tooling
5. **Maintenance** — Scalability plan, Phase 2 roadmap

---

## 👨‍💻 Team

| Name | ID |
|------|----|
| عمر عبدالعال سعد — Omar Abdelaal Saad | 2305165 |
| محمد أسامه محمد — Mohammed Osama Mohammed | 2305180 |
| مصطفى علي مصطفى — Mustafa Ali Mustafa | 2305616 |

**Software Engineering Final Project — 2026**

---

## 📄 License

MIT License
