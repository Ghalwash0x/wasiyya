# تشغيل مشروع Wasiyya — دليل الأوامر

دليل كامل لتشغيل التطبيق، قاعدة البيانات، وHTTPS على جهاز التطوير.

---

## المتطلبات

| الأداة | الإصدار |
|--------|---------|
| Node.js | 18+ |
| npm | 9+ |
| Docker | MySQL 8 + phpMyAdmin (أو XAMPP) |
| mkcert | اختياري — للـ HTTPS بدون تحذير في المتصفح |

على macOS مع Colima:

```bash
colima start
```

---

## 1) أول مرة — Clone والإعداد

```bash
git clone https://github.com/omar0y/wasiyya.git
cd wasiyya
```

### Backend

```bash
cd backend
cp .env.example .env
npm install
```

عدّل `backend/.env` — على الأقل:

```env
JWT_SECRET=<سلسلة عشوائية 32+ حرف>
AES_SECRET_KEY=<64 حرف hex>
```

توليد مفتاح AES:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Frontend

```bash
cd ../frontend
npm install
```

---

## 2) قاعدة البيانات

### الخيار أ — Docker (موصى به)

**أول مرة — إنشاء الحاويات:**

```bash
# من جذر المشروع wasiyya/
docker run -d --name wasiyya-mysql \
  -e MYSQL_ALLOW_EMPTY_PASSWORD=yes \
  -e MYSQL_DATABASE=wasiyya \
  -p 3306:3306 \
  mysql:8.0

docker run -d --name wasiyya-phpmyadmin \
  --link wasiyya-mysql:db \
  -p 8081:80 \
  phpmyadmin/phpmyadmin

docker exec -i wasiyya-mysql mysql -uroot wasiyya < database/schema_mysql.sql
```

**كل يوم — تشغيل الحاويات:**

```bash
docker start wasiyya-mysql wasiyya-phpmyadmin
```

| الخدمة | الرابط | الدخول |
|--------|--------|--------|
| phpMyAdmin | http://localhost:8081 | `root` — بدون باسورد |

**استيراد يدوي:** phpMyAdmin → قاعدة `wasiyya` → Import → `database/schema_mysql.sql`

**إعداد `.env` للـ DB:**

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=wasiyya
```

### الخيار ب — XAMPP

1. شغّل MySQL من XAMPP  
2. افتح http://localhost/phpmyadmin  
3. أنشئ قاعدة `wasiyya` واستورد `database/schema_mysql.sql`

---

## 3) HTTPS (اختياري — التطوير المحلي)

```bash
brew install mkcert
cd backend
npm run ssl:trust      # مرة واحدة — كلمة مرور Mac
npm run ssl:generate
```

في `backend/.env`:

```env
USE_HTTPS=true
HTTP_PORT=3080
FRONTEND_URL=https://localhost:3000
BACKEND_URL=https://localhost:3001
WEBAUTHN_ORIGIN=https://localhost:3000
```

حدّث OAuth في Google/GitHub:

- `https://localhost:3001/api/auth/google/callback`
- `https://localhost:3001/api/auth/github/callback`

تفاصيل إضافية: [docs/SSL.md](./SSL.md)

### بدون HTTPS

```env
# USE_HTTPS=false أو احذف السطر
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3001
WEBAUTHN_ORIGIN=http://localhost:3000
```

---

## 4) تشغيل التطبيق (كل يوم)

افتح **3 terminals** (أو 2 إن Docker شغال مسبقاً):

### Terminal 1 — Docker

```bash
colima start
docker start wasiyya-mysql wasiyya-phpmyadmin
```

### Terminal 2 — Backend

```bash
cd backend
npm run dev
```

المخرجات المتوقعة (HTTPS):

```
🔐 Wasiyya HTTPS — https://localhost:3001
✅ Connected to MySQL
```

### Terminal 3 — Frontend

```bash
cd frontend
npm run dev
```

المخرجات المتوقعة (HTTPS):

```
➜  Local:   https://localhost:3000/
```

---

## 5) الروابط وحسابات التجربة

| الخدمة | الرابط |
|--------|--------|
| التطبيق (HTTPS) | https://localhost:3000 |
| التطبيق (HTTP) | http://localhost:3000 |
| API | https://localhost:3001 أو http://localhost:3001 |
| phpMyAdmin | http://localhost:8081 |

| الدور | البريد | كلمة المرور |
|-------|--------|-------------|
| Admin | `admin@wasiyya.com` | `Admin@123` |
| User | `user@wasiyya.com` | `User@123` |
| Manager | `manager@wasiyya.com` | `Manager@123` |

---

## 6) أوامر مساعدة

### إيقاف السيرفرات

```bash
pkill -f "nodemon src/app.js"
pkill -f "vite"
```

### إيقاف Docker

```bash
docker stop wasiyya-mysql wasiyya-phpmyadmin
```

### التحقق من المنافذ

```bash
lsof -i :3000 -i :3001 -i :3306
```

### اختبار الـ API

```bash
curl -sk https://localhost:3001/api/health
```

### إعادة توليد شهادة SSL

```bash
cd backend
npm run ssl:generate -- --force
```

### شهادة OpenSSL فقط (تحذير في المتصفح)

```bash
cd backend
npm run ssl:openssl
```

---

## 7) استكشاف الأخطاء

| المشكلة | الحل |
|---------|------|
| `EADDRINUSE` على 3001 | أوقف العملية: `lsof -ti :3001 \| xargs kill -9` ثم `npm run dev` |
| `NET::ERR_CERT_AUTHORITY_INVALID` | `cd backend && npm run ssl:trust` ثم أعد فتح Chrome |
| MySQL غير متصل | `docker start wasiyya-mysql` وتأكد من `.env` |
| OAuth 500 | تأكد أن Backend شغال وروابط callback = HTTPS إن كنت تستخدم HTTPS |
| Docker لا يعمل | `colima start` |

---

## مسار المشروع على جهازك

```
/Users/macbook/Documents/wasyyya/wasiyya
```

استبدل المسار بمسار الـ clone عندك إن اختلف.
