# سجل التحديثات — Wasiyya (وصيّة)

> توثيق التعديلات المطبّقة على المشروع محلياً قبل الرفع إلى GitHub.  
> **التاريخ:** مايو 2026  
> **المستودع:** [https://github.com/omar0y/wasiyya](https://github.com/omar0y/wasiyya)

---

## ملخص سريع

| المجال | ما تم |
|--------|--------|
| OAuth | تسجيل حساب جديد عبر Google/GitHub + إكمال البيانات |
| OAuth | دعم المصادقة الثنائية (2FA) عند الدخول عبر OAuth |
| الأمان | تشفير محتوى الأصول في قاعدة البيانات + فك التشفير في المتصفح |
| الوارثون | الوصول للأصول بعد تفعيل الوصية فقط |
| الواجهة | تحسينات Sidebar، Dashboard، Login، Register |

---

## 1. OAuth — إنشاء حساب جديد

### المشكلة السابقة
تسجيل الدخول عبر OAuth كان يعمل **للحسابات الموجودة فقط**؛ زر GitHub/Google في صفحة التسجيل لم يُنشئ حساباً جديداً.

### الحل
- **`?mode=register`** على روابط OAuth من صفحة `/register`
- بعد موافقة المستخدم على Google/GitHub:
  - إن كان البريد **غير مسجل** → توجيه لـ `/register?oauth_token=...` لإكمال الاسم وكلمة السر (اختيارية)
  - إن كان البريد **مسجلاً** → رسالة توجيه لتسجيل الدخول
- **Endpoints جديدة:**
  - `GET /api/auth/oauth/pending?token=` — جلب الاسم والبريد من OAuth
  - `POST /api/auth/register/oauth` — إتمام إنشاء الحساب وربط `oauth_provider` + `oauth_id`

### الملفات
- `backend/src/middleware/passport.js`
- `backend/src/routes/auth.routes.js`
- `backend/src/controllers/auth.controller.js`
- `frontend/src/pages/Register.jsx`
- `frontend/src/context/AuthContext.jsx` — `registerOAuth()`

### Commit سابق على GitHub
`feat: allow OAuth sign-up with profile completion step`

---

## 2. OAuth — المصادقة الثنائية (2FA)

### المشكلة السابقة
عند تسجيل الدخول عبر OAuth والحساب مفعّل عليه 2FA، كان النظام يُصدر **JWT كامل** مباشرة دون طلب كود التطبيق.

### الحل
- في `issueOAuthLogin`: إن `two_fa_enabled = 1` → إصدار `tempToken` (5 دقائق) وتوجيه:
  ```
  /login?requires2FA=1&tempToken=...
  ```
- **Frontend (`Login.jsx`):** التقاط المعاملات وعرض شاشة إدخال OTP مثل الدخول بالبريد

### الملفات
- `backend/src/routes/auth.routes.js`
- `frontend/src/pages/Login.jsx`

---

## 3. تشفير الأصول (Assets)

### الهدف
- تخزين **محتوى** الأصول مشفّراً في MySQL (AES-256-GCM)
- فك التشفير في **المتصفح** لصاحب الحساب فقط
- عدم إتاحة المحتوى لـ Admin أو مستخدمين آخرين عبر API الأصول

### آلية التشفير
| العنصر | التفاصيل |
|--------|----------|
| الخوارزمية | AES-256-GCM |
| المفتاح | مشتق لكل مستخدم: `HMAC-SHA256(AES_SECRET_KEY, userId)` |
| التخزين | `content` = Base64 مشفّر، `iv` = `ivHex:authTagHex` |
| العنوان (`title`) | غير مشفّر (وصف عام) |

### API
| Method | Endpoint | الوصف |
|--------|----------|--------|
| GET | `/api/auth/wallet-key` | مفتاح فك التشفير — **role: user** فقط |
| GET | `/api/assets/:willId` | يُرجع `content_encrypted` + `iv` بدون نص صريح |
| POST | `/api/assets` | يشفّر المحتوى قبل الحفظ |

### Frontend
- `frontend/src/utils/assetCrypto.js` — Web Crypto API
- `frontend/src/pages/Assets.jsx` — جلب المفتاح، فك التشفير محلياً، زر عرض/إخفاء

### الملفات
- `backend/src/services/encryption.service.js` — `encryptText` / `decryptText` حقيقية (كانت stubs)
- `backend/src/controllers/asset.controller.js`
- `backend/src/controllers/auth.controller.js` — `getWalletKey`
- `frontend/src/utils/assetCrypto.js`
- `frontend/src/pages/Assets.jsx`

### ملاحظة للبيانات القديمة
الأصول التي **لا تحتوي** على `iv` تُعامل كـ legacy (نص غير مشفّر) حتى يُعاد حفظها.

---

## 4. وصول الوارث (Beneficiaries)

### التعديل
- الوصول عبر `/api/beneficiaries/access/:token` يتطلب `wills.status = 'triggered'`
- فك تشفير محتوى الأصول على السيرفر بمفتاح **صاحب الوصية** (`owner_id`) عند التفعيل فقط

### الملف
- `backend/src/controllers/beneficiary.controller.js`

---

## 5. تحسينات الواجهة (Frontend UI/UX)

### Sidebar متجاوب
- `SidebarContext` — فتح/إغلاق القائمة على الموبايل
- Overlay وزر قائمة في `Navbar`
- تحسين التخطيط والأيقونات (`lucide-react`)

### صفحات محدّثة
- **Dashboard** — بطاقات إحصائيات، شريط تقدم التحقق، تخطيط أوضح
- **Login / Register** — تصميم محدّث، أزرار OAuth، دعم تدفق 2FA و OAuth
- **Assets, Documents, Beneficiaries, MyWill, Verification, 2FA** — تكامل `Navbar` + `flex` layout موحّد

### أخرى
- `tailwind.config.js` — ألوان/خطوط إضافية
- `index.css` — أنماط مساعدة
- `package.json` — إضافة `lucide-react`

### الملفات (أبرزها)
- `frontend/src/context/SidebarContext.jsx` *(جديد)*
- `frontend/src/components/Sidebar.jsx`
- `frontend/src/components/Navbar.jsx`
- `frontend/src/components/CheckinBanner.jsx`
- `frontend/src/pages/Dashboard.jsx`
- `frontend/src/pages/Login.jsx`
- `frontend/src/pages/Register.jsx`
- `frontend/src/App.jsx` — `SidebarProvider`

---

## 6. إعداد GitHub OAuth (محلي — غير مرفوع)

يُضبط في `backend/.env` (ملف **غير** مرفوع لـ Git):

```env
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
BACKEND_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000
```

**Callback URL في GitHub Developer Settings:**
```
http://localhost:3001/api/auth/github/callback
```

> **Device Flow:** غير مطلوب — اتركه معطّلاً.

---

## 7. تشغيل المشروع محلياً (مرجع)

| الخدمة | العنوان |
|--------|---------|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:3001 |
| phpMyAdmin (Docker) | http://localhost:8081 |
| MySQL | `localhost:3306` — قاعدة `wasiyya` |

```bash
# Backend
cd backend && npm install && npm run dev

# Frontend
cd frontend && npm install && npm run dev

# MySQL + phpMyAdmin (إن وُجد Docker)
docker start wasiyya-mysql wasiyya-phpmyadmin
```

---

## 8. أمان — تذكير

- **لا ترفع** `backend/.env` إلى GitHub (مفاتيح JWT، AES، OAuth، Gmail).
- إن تم تسريب **GitHub Client Secret** — أنشئ secret جديد من إعدادات OAuth App.
- مفتاح `/api/auth/wallet-key` يُعطى فقط لمسجّل الدخول بدور `user` صاحب الحساب.

---

## Commits المتوقعة على `main`

1. `feat: allow OAuth sign-up with profile completion step` *(مرفوع مسبقاً)*
2. `feat: OAuth 2FA, encrypted assets, UI improvements` *(هذا الرفع)*

---

## المساهمون في هذه الجلسة

Omar / فريق وصيّة.

---

*آخر تحديث لهذا الملف: مايو 2026*
