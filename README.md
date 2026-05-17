<div align="center">

# وصيّة — Wasiyya

### Digital Inheritance & Will Management System

![Node.js](https://img.shields.io/badge/Node.js-v20-339933?style=flat-square&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat-square&logo=mysql&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.18-000000?style=flat-square&logo=express&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)

**University Software Engineering Final Project — 2026**

</div>

---

## Overview

**Wasiyya** is a secure digital will management platform that allows users to create, manage, and automatically distribute their wills to designated beneficiaries. The system is built around a **Dead Man's Switch** mechanism — if a user fails to check in within a configured period, the system automatically triggers their will and notifies all beneficiaries via email.

---

## Features

| Feature | Description |
|---|---|
| **Will Management** | Create, edit, and delete a personal digital will |
| **Asset Vault** | Store encrypted sensitive information (accounts, passwords, notes) |
| **Document Uploads** | Attach files (PDFs, images) with SHA-256 integrity verification |
| **Beneficiary Management** | Add heirs with name, email, and relationship |
| **Dead Man's Switch** | Automated cron-based check-in monitoring with email alerts |
| **Beneficiary Access** | Time-limited secure token links sent to heirs upon will activation |
| **Admin Panel** | Full oversight: users, wills, audit logs, and testing tools |
| **Role-Based Access** | Three roles — `admin`, `manager`, `user` — with strict route guards |
| **Email Notifications** | Gmail SMTP or Ethereal test fallback (auto-configured) |
| **Audit Logging** | Every action (login, checkin, will trigger) logged with IP |

---

## Tech Stack

### Backend
- **Runtime:** Node.js v20
- **Framework:** Express.js 4.18
- **Database:** MySQL 8 / MariaDB (via XAMPP)
- **Auth:** JSON Web Tokens (JWT)
- **Email:** Nodemailer (Gmail SMTP + Ethereal fallback)
- **Scheduler:** node-cron
- **Security:** Helmet, CORS, express-rate-limit, bcrypt-ready

### Frontend
- **Library:** React 18
- **Routing:** React Router v6
- **Styling:** Tailwind CSS (RTL + Arabic font support)
- **HTTP Client:** Axios with interceptors
- **Build Tool:** Vite 5

---

## System Roles

| Role | Permissions |
|---|---|
| `user` | Full will lifecycle — create, manage assets/documents/beneficiaries, check-in |
| `manager` | Same as user (elevated future permissions planned) |
| `admin` | System oversight only — user management, audit logs, stats, test tools. Cannot create wills. |

> An admin who wants to create a will must register a separate `user` account.

---

## Project Structure

```
wasiyya/
├── backend/
│   └── src/
│       ├── config/          # Database pool, Multer file upload config
│       ├── controllers/     # Business logic per resource
│       ├── middleware/       # JWT auth, RBAC, validation
│       ├── routes/          # Express route definitions
│       └── services/        # Cron scheduler, email, encryption, signature
├── frontend/
│   └── src/
│       ├── components/      # Sidebar, Navbar, CheckinBanner, ProtectedRoute
│       ├── context/         # AuthContext (JWT state management)
│       ├── pages/           # Login, Register, Dashboard, AdminPanel, ...
│       └── services/        # Axios API client
└── database/
    └── schema_mysql.sql     # Full schema + seed data
```

---

## Getting Started

### Prerequisites
- Node.js v18+
- MySQL 8 / MariaDB (XAMPP recommended)
- npm

### 1. Clone & Install

```bash
git clone https://github.com/omar0y/wasiyya.git
cd wasiyya

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Configure Environment

Copy and edit the backend environment file:

```bash
cp backend/.env.example backend/.env
```

Key variables in `backend/.env`:

```env
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=wasiyya

JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters

# Email — leave blank to use Ethereal test emails automatically
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=Wasiyya <your@gmail.com>

FRONTEND_URL=http://localhost:3000

# "days" for production | "minutes" for local testing
TIME_UNIT=minutes
```

### 3. Set Up the Database

Start MySQL (via XAMPP or standalone), then run:

```bash
mysql -u root wasiyya < database/schema_mysql.sql
```

Or import `database/schema_mysql.sql` via phpMyAdmin.

### 4. Run the Project

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **Health check:** http://localhost:3001/api/health

---

## Test Accounts

| Email | Password | Role |
|---|---|---|
| `admin@wasiyya.com` | `Admin@123` | Admin |
| `user@wasiyya.com` | `User@123` | User |
| `manager@wasiyya.com` | `Manager@123` | Manager |

---

## Dead Man's Switch — How It Works

```
User checks in → Timer resets
                                   ↓
         [interval] days/minutes pass without check-in
                                   ↓
              Warning email sent to user
                                   ↓
         [grace period] expires with no response
                                   ↓
         Will status → "triggered"
         Beneficiaries notified via email
         Secure time-limited access links generated
```

**Configuration** (`TIME_UNIT` in `.env`):
- `minutes` — Cron runs every minute (for testing)
- `days` — Cron runs daily at 9:00 AM (for production)

---

## API Overview

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register a new user |
| POST | `/api/auth/login` | Public | Login and get JWT |
| GET | `/api/auth/me` | User | Get current user profile |
| GET | `/api/wills` | User | Get my will |
| POST | `/api/wills` | User | Create a will |
| PUT | `/api/wills/:id` | User | Update a will |
| GET | `/api/assets/:willId` | User | List assets |
| POST | `/api/assets` | User | Add an asset |
| POST | `/api/documents/upload` | User | Upload a document |
| POST | `/api/checkin` | User | Submit a check-in |
| GET | `/api/checkin/status` | User | Get check-in status |
| GET | `/api/beneficiaries/access/:token` | Public | Beneficiary access |
| GET | `/api/admin/stats` | Admin | System statistics |
| GET | `/api/admin/users` | Admin | Manage users |
| POST | `/api/admin/force-check` | Admin | Manually trigger switch check |
| GET | `/api/health` | Public | Server health check |

---

## Security

- JWT authentication with 24h token expiry
- Role-based access control on every protected route
- Admins are blocked from all will/asset/document/beneficiary endpoints
- Rate limiting: 500 requests / 15 minutes per IP
- Helmet HTTP security headers
- File type validation and 10MB size limit on uploads
- SHA-256 hash generated for every uploaded document
- Beneficiary access tokens expire after 7 days
- Audit log for every user action with IP address

---

## Future Improvements

- [ ] AES-256-CBC encryption for assets at rest (Phase 2)
- [ ] RSA digital signing for uploaded documents (Phase 2)
- [ ] Two-factor authentication (2FA) via TOTP
- [ ] Multi-will support per user
- [ ] Mobile-responsive improvements
- [ ] OAuth login (Google)
- [ ] Beneficiary acknowledgment confirmation

---

## Screenshots

> _Add screenshots of: Login, Dashboard, Admin Panel, Will creation form, and Beneficiary access page._

---

## Contributors

| Name | Role |
|---|---|
| عمر عبدالعال | Full-Stack Developer |

---

<div align="center">

**Wasiyya** — *Built with purpose.*

University Software Engineering Final Project · 2026

</div>
