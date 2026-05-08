# وصيّة — Wasiyya 📜
### Digital Inheritance & Electronic Will Platform

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-v20-339933?style=for-the-badge&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.18-000000?style=for-the-badge&logo=express&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

**University Software Engineering Final Project — Phase 1**

</div>

---

## 📌 Project Overview

**Wasiyya** (وصيّة) is a web-based Digital Will Management System that allows users to securely store their digital assets — accounts, passwords, bank info, documents — and automatically transfer access to trusted heirs when the user becomes inactive.

The system implements a **Dead Man's Switch** mechanism: if the user does not confirm their activity within a defined period, the system automatically triggers the will and notifies designated trustees via email with a secure time-limited access link.

---

## ✨ Features

### 👤 User (موصي)
- Register / Login with JWT authentication
- Password policy enforcement (uppercase, number, special character)
- Create and manage a digital will
- Add text assets: `account`, `bank`, `password`, `info`, `note`
- Upload documents (PDF, JPG, PNG, TXT, DOC, DOCX) up to 10MB
- Manage trustees (beneficiaries)
- Confirm activity — "I'm alive" Dead Man's Switch
- Real-time checkin status dashboard

### 🔔 Trustee (وصي)
- Receive email notification when will is triggered
- Access will contents via secure token link (valid 7 days)
- View assets and download documents

### ⚙️ Admin
- User management (enable/disable, change roles)
- System-wide audit logs with pagination
- Dashboard statistics

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, React Router v6 |
| Backend | Node.js, Express 4, JWT, Multer, node-cron |
| Database | PostgreSQL 16 (Docker) |
| Auth | JSON Web Tokens (JWT) |
| Email | Nodemailer |
| DevOps | Docker, Docker Compose |

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- Docker Desktop

### 1. Clone the repository

```bash
git clone https://github.com/omar0y/wasiyya.git
cd wasiyya
```

### 2. Start PostgreSQL with Docker

```bash
docker run -d \
  --name wasiyya-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=wasiyya123 \
  -e POSTGRES_DB=wasiyya \
  -p 5432:5432 \
  postgres:16-alpine
```

### 3. Initialize the database

```bash
# Wait ~5 seconds for Postgres to start, then:
docker exec -i wasiyya-postgres psql -U postgres -d wasiyya < database/schema.sql
```

### 4. Setup Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your values (email credentials, etc.)
npm install
npm run dev
```

### 5. Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

### 6. Open the app

Navigate to **http://localhost:3000**

---

## 🔑 Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@wasiyya.com` | `Admin@123` |
| User | `user@wasiyya.com` | `User@123` |
| Manager | `manager@wasiyya.com` | `Manager@123` |

---

## 📁 Project Structure

```
wasiyya/
├── backend/
│   ├── src/
│   │   ├── config/         # Database & Multer config
│   │   ├── controllers/    # Business logic (7 controllers)
│   │   ├── middleware/     # Auth, RBAC, Validation
│   │   ├── routes/         # Express routes (7 route files)
│   │   └── services/       # Email, Cron, Encryption stubs
│   ├── uploads/            # Uploaded files
│   └── .env.example
│
├── frontend/
│   └── src/
│       ├── pages/          # 10 React pages
│       ├── components/     # Reusable components
│       ├── context/        # AuthContext
│       └── services/       # Axios API client
│
└── database/
    └── schema.sql          # Full DB schema + seed data
```

---

## 🗃️ Database Schema

```
users ──────────┐
                ├── wills ──────────┐
                │                   ├── assets
                │                   ├── documents
                │                   └── beneficiaries
                ├── audit_logs
                └── checkin_notifications
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/wills` | Get user's will |
| POST | `/api/wills` | Create will |
| GET | `/api/assets/:willId` | List assets |
| POST | `/api/assets` | Add asset |
| POST | `/api/documents/upload` | Upload document |
| GET | `/api/documents/download/:id` | Download file |
| GET | `/api/beneficiaries/:willId` | List trustees |
| POST | `/api/checkin` | Confirm activity |
| GET | `/api/beneficiaries/access/:token` | Trustee access |
| GET | `/api/admin/stats` | System statistics |

---

## ⚙️ Environment Variables

```env
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=wasiyya123
DB_NAME=wasiyya
JWT_SECRET=your_secret_here
JWT_EXPIRES_IN=24h
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password
FRONTEND_URL=http://localhost:3000
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
```

---

## 🔒 Security Notes (Phase 1)

> This is **Phase 1** of the project. The following security features are **stubbed and ready for Phase 2**:
> - Passwords stored as plain text → **Phase 2: bcrypt**
> - Assets stored unencrypted → **Phase 2: AES-256**
> - Documents without signature → **Phase 2: SHA-256 + RSA**
> - No OAuth → **Phase 2: Google/GitHub**
> - No 2FA → **Phase 2: TOTP**

The database schema already includes the necessary columns (`iv`, `sha256_hash`, `signature`, `two_fa_secret`, etc.) — Phase 2 fills them without schema changes.

---

## 📋 SDLC Documentation

This project follows the complete Software Engineering SDLC:

1. **Requirements Phase** — Problem statement, functional & non-functional requirements, user roles
2. **Design Phase** — System architecture, ER diagram, UML diagrams (Use Case, Sequence, Activity, Class, State Machine)
3. **Implementation Phase** — MVC architecture, REST API, React SPA
4. **Testing Phase** — 30+ test cases across all modules
5. **Maintenance Phase** — Scalability plan, Phase 2 roadmap

---

## 👨‍💻 Author

**عمر عبدالعال**  
Software Engineering Final Project — 2026

---

## 📄 License

MIT License
