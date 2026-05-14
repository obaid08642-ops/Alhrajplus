# Apple Sign-In Setup — الحراج بلس

## ما تم تنفيذه (Backend + Frontend + Mobile)

✅ Backend: `/api/auth/apple/start` + `/api/auth/apple/callback` (form_post)  
✅ Backend: Client-secret JWT signing (ES256) + JWKS verification (RS256)  
✅ Backend: `mobile_redirect` query param → redirects to `harajplus://auth/callback` للموبايل  
✅ Web Frontend: زر "متابعة بحساب Apple" في صفحة /login  
✅ Mobile: `signInWithApple()` في `mobile/src/socialAuth.js` + زر في `AuthScreens.js`

التطبيق **جاهز وكامل**. ينقصه فقط **مفاتيح Apple** التي يجب أن تضيفها في environment.

---

## المتغيرات المطلوبة في `.env` (Backend)

```env
APPLE_CLIENT_ID="com.harajplus.web"
APPLE_TEAM_ID="ABC1234567"
APPLE_KEY_ID="ABCDE12345"
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIGTAg...\n-----END PRIVATE KEY-----"
APPLE_REDIRECT_URI="https://alhrajplus.onrender.com/api/auth/apple/callback"
BACKEND_PUBLIC_URL="https://alhrajplus.onrender.com"
```

> ⚠️ **مهم**: عند نسخ `APPLE_PRIVATE_KEY` ضع `\n` بدلاً من أسطر فعلية (الباك إند يحول `\n` تلقائياً لأسطر حقيقية).

---

## خطوات الحصول على المفاتيح من Apple Developer

### 1. تسجيل App ID  (للموبايل)
- ادخل إلى https://developer.apple.com/account → **Identifiers** → **+**
- اختر **App IDs** → **App**
- Bundle ID: `com.harajplus.app` (نفسه في `mobile/app.json`)
- فعّل **Sign In with Apple** capability → احفظ

### 2. تسجيل Services ID (للويب)
- نفس الصفحة → **+** → **Services IDs**
- Description: "Haraj Plus Web"
- Identifier: `com.harajplus.web`  ← **هذا هو `APPLE_CLIENT_ID`**
- اضغط Continue → Configure → فعّل **Sign In with Apple**
- في "Web Authentication Configuration":
  - **Primary App ID**: اختر التطبيق من الخطوة 1
  - **Domains**: `alhrajplus.onrender.com` و `alhraj.online` و `alhrajplus.com`
  - **Return URLs**: 
    ```
    https://alhrajplus.onrender.com/api/auth/apple/callback
    ```
- احفظ.

### 3. إنشاء Private Key (.p8)
- Keys → **+** → اسم: "HarajPlus Apple Sign In"
- فعّل **Sign in with Apple** → Configure → اختر Primary App ID
- Continue → Register → **Download** ملف `.p8` (مرة واحدة فقط، احفظه!)
- ✅ **Key ID** يظهر في الصفحة (مثل `ABCDE12345`) ← هذا هو `APPLE_KEY_ID`

### 4. Team ID
- في الزاوية اليمنى العلوية من الصفحة (تحت اسمك) → 10 أحرف مثل `ABC1234567`  
  ← هذا هو `APPLE_TEAM_ID`

### 5. تحويل ملف .p8 إلى سطر واحد للـ env
```bash
# في الترمنال على جهازك:
awk '{printf "%s\\n", $0}' AuthKey_ABCDE12345.p8
```
انسخ الناتج كقيمة `APPLE_PRIVATE_KEY` (احذف الـ `\n` الأخيرة).

### 6. أضف المفاتيح على Render
- Dashboard → خدمتك (alhrajplus) → **Environment** → **Add Environment Variable**
- أضف الخمسة متغيرات أعلاه
- **Manual Deploy** → سيعمل التحديث

---

## ✅ كيف يعمل (Flow)

### الويب:
1. المستخدم يضغط "متابعة بحساب Apple" في `/login`
2. الواجهة → `GET /api/auth/apple/start` → تستقبل `auth_url`
3. تحويل المتصفح إلى صفحة Apple
4. Apple يصادق المستخدم → **POST** بـ form_post إلى `/api/auth/apple/callback`
5. Backend:
   - يتحقق من `state` (CSRF)
   - يبني `client_secret` بـ ES256 من `APPLE_PRIVATE_KEY`
   - يستبدل `code` → `id_token`
   - يتحقق من `id_token` بـ Apple JWKS (RS256)
   - يبحث أو ينشئ user في MongoDB بـ `apple_id` = `sub`
   - يصدر JWT خاص بنا → يحول للواجهة بـ `#access_token=...`
6. `AuthCallback.js` يلتقط التوكن من الـ hash ويحفظه في localStorage

### الموبايل (Expo):
1. المستخدم يضغط زر Apple في `AuthScreens.js`
2. `signInWithApple()` → `GET /api/auth/apple/start?mobile_redirect=harajplus://auth/callback`
3. `WebBrowser.openAuthSessionAsync` يفتح متصفح in-app
4. بعد المصادقة، Apple يـ POST إلى `/api/auth/apple/callback`
5. Backend يلاحظ `mobile_redirect` في state → يحول إلى `harajplus://auth/callback#access_token=...`
6. التطبيق يلتقط الـ deep link، يحفظ التوكن في `SecureStore`، ويستدعي `fetchMe()`

---

## ⚠️ ملاحظات هامة

- Apple **يرجع email مرة واحدة فقط** (في أول مرة يصادق فيها المستخدم). الباك إند يحفظه دائماً.
- إذا اختار المستخدم "Hide My Email"، Apple يعطيك email مثل `xxxx@privaterelay.appleid.com` (يعمل بشكل طبيعي).
- المستخدمون الذين يرفضون email → نولّد `apple_<sub>@apple.local` placeholder (مخفي في الواجهة).
- في حال انتهت صلاحية المفتاح (Apple keys صالحة 6 أشهر تلقائياً عبر JWKS)، الكود يعيد جلبها تلقائياً.

---

## مفاتيح OAuth الأخرى للويب والموبايل

| الخدمة | متغير | كيف تحصل عليها |
|---|---|---|
| Google | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | console.cloud.google.com → APIs & Services → Credentials → OAuth 2.0 Client (Web) |
| Google | `GOOGLE_REDIRECT_URI` | `https://alhrajplus.onrender.com/api/auth/google/callback` |
| X (Twitter) | `X_CLIENT_ID`, `X_CLIENT_SECRET` | developer.twitter.com → Project → User auth settings → OAuth 2.0 |
| Snapchat | `SNAPCHAT_CLIENT_ID`, `SNAPCHAT_CLIENT_SECRET` | kit.snapchat.com → My Apps → Login Kit |
| Apple | (أعلاه) | developer.apple.com (يتطلب Apple Developer Program — $99/سنة) |

---

## OAuth للموبايل (Expo) — Production Ready

| الخدمة | الحالة | Redirect URI للموبايل |
|---|---|---|
| Google | ✅ يعمل | يستخدم `harajplus://auth/callback` عبر backend redirect |
| Apple | ✅ يعمل | نفس النمط |
| X | ✅ يعمل | backend GET handler `/api/auth/x/callback-redirect` |
| Snapchat | ✅ يعمل | backend GET handler `/api/auth/snapchat/callback-redirect` |

**في كل واحدة منها**, الموبايل يطلب:
```
GET /api/auth/<provider>/start?mobile_redirect=harajplus://auth/callback
```
ثم يفتح `WebBrowser.openAuthSessionAsync()`. Backend يصدر JWT ويحول إلى الـ scheme. التوكن يُحفظ في `expo-secure-store` ويبقى عند إعادة تشغيل التطبيق.

### إعدادات Provider Console للموبايل
عند تسجيل OAuth client في كل خدمة، **أضف هذه الـ Redirect URIs بالإضافة للويب**:

- **Google Console**:
  - `https://alhrajplus.onrender.com/api/auth/google/callback` (الويب والموبايل يستخدمانه)

- **X (Twitter)**:
  - `https://alhraj.online/auth/x/callback` (الويب)
  - `https://alhrajplus.onrender.com/api/auth/x/callback-redirect` (الموبايل)

- **Snapchat**:
  - `https://alhraj.online/auth/snapchat/callback` (الويب)
  - `https://alhrajplus.onrender.com/api/auth/snapchat/callback-redirect` (الموبايل)

- **Apple**:
  - `https://alhrajplus.onrender.com/api/auth/apple/callback` (يكفي — الموبايل والويب يشتركان)

---

## اختبار سريع بعد إضافة المفاتيح

```bash
# الباك إند يجب أن يرجع auth_url:
curl https://alhrajplus.onrender.com/api/auth/apple/start
# {"auth_url": "https://appleid.apple.com/auth/authorize?..."}

# للموبايل:
curl "https://alhrajplus.onrender.com/api/auth/apple/start?mobile_redirect=harajplus://auth/callback"
```
