# SSL / HTTPS — Wasiyya

## ملخص سريع

| البيئة | الحل | هل المتصفح يثق تلقائياً؟ |
|--------|------|---------------------------|
| **تطوير على `localhost`** | [mkcert](https://github.com/FiloSottile/mkcert) | نعم — بعد `npm run ssl:trust` (مرة واحدة على جهازك) |
| **تطوير — OpenSSL فقط** | `npm run ssl:openssl` | **لا** — تحذير `NET::ERR_CERT_AUTHORITY_INVALID` |
| **إنتاج — دومين حقيقي** | **Let's Encrypt** (مجاني، معتمد عالمياً) | نعم — على كل المتصفحات |

**OpenSSL** يولّد ملفات `.cert` و `.key` فقط. لا يوجد زر في OpenSSL يجعل Chrome يثق في `localhost` بدون تثبيت CA محلي أو دومين عام.

---

## 1) تطوير محلي (localhost) — الموصى به

```bash
brew install mkcert
cd backend
npm run ssl:trust      # كلمة مرور Mac — مرة واحدة
npm run ssl:generate   # أو --force لإعادة التوليد
```

في `.env`:

```env
USE_HTTPS=true
FRONTEND_URL=https://localhost:3000
BACKEND_URL=https://localhost:3001
WEBAUTHN_ORIGIN=https://localhost:3000
```

OAuth callbacks: `https://localhost:3001/api/auth/google/callback` ونظيره لـ GitHub.

---

## 2) OpenSSL self-signed (تحذير دائم في Chrome)

```bash
cd backend && npm run ssl:openssl
```

للاختبار فقط: Chrome → **Advanced** → **Proceed to localhost**.

---

## 3) إنتاج — شهادة معتمدة (Let's Encrypt)

يتطلب **دوميناً** (مثل `wasiyya.com`) يشير إلى السيرفر، والمنفذ **80** مفتوحاً أثناء الإصدار.

```bash
cd backend
./scripts/setup-letsencrypt.sh wasiyya.com your@email.com
```

ثم في `.env` على السيرفر:

```env
USE_HTTPS=true
DOMAIN=wasiyya.com
FRONTEND_URL=https://wasiyya.com
BACKEND_URL=https://api.wasiyya.com
SSL_CERT_PATH=/etc/letsencrypt/live/wasiyya.com/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/wasiyya.com/privkey.pem
```

تجديد تلقائي: `certbot renew` (cron).

---

## ملفات المشروع

| الملف | الوظيفة |
|-------|---------|
| `backend/certs/server.cert` | شهادة التطبيق (dev) |
| `backend/certs/server.key` | المفتاح الخاص |
| `backend/certs/public.pem` / `private.pem` | RSA لتوقيع المستندات (ليس SSL) |

`certs/` في `.gitignore` — لا ترفع المفاتيح إلى GitHub.
