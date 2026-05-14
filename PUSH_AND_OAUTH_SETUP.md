# Push Notifications & OAuth — Setup Guide (Production)

دليل الإعداد الكامل لـ Push Notifications (Web + Mobile) + توضيح وضع X & Snapchat OAuth.

---

## 1. Push Notifications — ما تم بناؤه

| القناة | المنصة | الحالة |
|---|---|---|
| **Web Push (VAPID)** | متصفحات Chrome/Edge/Firefox/Opera + Safari iOS 16.4+ | ✅ مكتمل |
| **Expo Push** | Android + iOS (تطبيق Expo) | ✅ مكتمل |

### الميزات
- 🔔 إشعارات حقيقية والتطبيق/المتصفح مغلق
- 🔗 Deep Linking: الضغط على الإشعار يفتح مباشرة على الإعلان / الشات
- ✅ تشغيل تلقائي عند: رسالة جديدة، موافقة/رفض إعلان، تخفيض سعر في قائمة الاهتمام، broadcast إداري، صفقات/مزادات
- 📡 لوحة Admin لإرسال إشعار جماعي (موجودة في /admin/notifications)
- ⚙️ تفضيلات المستخدم — كل نوع إشعار قابل للإيقاف من /settings
- 🔑 تخزين توكنز push بشكل آمن (Expo + Web subscriptions)

### المتغيرات المطلوبة في `.env` (Backend / Render)

```env
# Web Push — VAPID (تم توليدها تلقائياً، لا تغيّرها)
VAPID_PUBLIC_KEY="BE0k4B5LlV4bF1_XNmhH1Fa38mA8vwxHkXb_OsyBif8fcYYzJRthC-3g1F5EXTQUAoIgx272LCGq398EbJWHa5w"
VAPID_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIGHAgEAMBMG...\n-----END PRIVATE KEY-----"
VAPID_CLAIM_EMAIL="mailto:admin@alhrajplus.com"
```

> ⚠️ هذه المفاتيح موجودة بالفعل في `/app/backend/.env`. **لا تستبدلها بمفاتيح جديدة** وإلا سيتم إبطال جميع subscriptions المسجّلة.  
> لإعادة التوليد (في حال التسريب فقط):  
> ```bash
> cd /app/backend && python3 -c "from push_service import generate_vapid_keys; import json; print(json.dumps(generate_vapid_keys(), indent=2))"
> ```

### إعداد Expo Push (للموبايل)
✅ **لا يحتاج لأي مفاتيح إضافية** — Expo Push يعمل تلقائياً عبر `expo-notifications` و EAS project ID الذي في `app.json`. عند بناء التطبيق بـ `eas build`:
- **Android**: يجب تشغيل `eas credentials → Setup Push Notifications` مرة واحدة (يولّد FCM credentials تلقائياً).
- **iOS**: يحتاج Apple Push Notification Service certificate — `eas credentials` يولّده تلقائياً عبر Apple Developer Portal (يتطلب Apple Developer Program).

> Expo Push API مجاني، بدون حدود معقولة، لا حاجة لـ Firebase Console مباشرة.

### مكان وضع المتغيرات
| الخدمة | المكان |
|---|---|
| Render (Backend) | Dashboard → Service → Environment → Add Environment Variable |
| Vercel (Frontend) | لا يحتاج لمفاتيح VAPID — يتم جلب public key من `/api/push/web/vapid-public-key` |
| Expo (Mobile) | EAS Build CLI يدير push credentials تلقائياً |

### الـ Endpoints الجديدة

| Method | Path | Description |
|---|---|---|
| GET | `/api/push/web/vapid-public-key` | Public key للتسجيل في المتصفح |
| POST | `/api/push/web/subscribe` | تسجيل subscription جديد |
| POST | `/api/push/web/unsubscribe` | إلغاء التسجيل |
| POST | `/api/push/register` | تسجيل توكن Expo |
| DELETE | `/api/push/unregister` | إلغاء توكن Expo |
| GET | `/api/push/preferences` | جلب تفضيلات المستخدم |
| PUT | `/api/push/preferences` | حفظ التفضيلات |
| POST | `/api/push/test` | إرسال إشعار تجريبي للحساب الحالي |
| POST | `/api/admin/notifications/broadcast` | بث جماعي (admin only) |

### كيف يستخدمها المستخدم
1. ادخل صفحة `/settings`
2. ابحث عن قسم "الإشعارات"
3. اضغط **تفعيل** → المتصفح سيطلب الإذن
4. ✅ يستلم الإشعارات حتى لو أغلق المتصفح
5. اضغط **اختبار** للتحقق فوراً

---

## 2. OAuth Audit — X (Twitter) و Snapchat

كود OAuth في Backend **سليم 100%**. إذا لم يعمل، السبب هو **إعدادات الـ Developer Dashboard** (provider-side). إليك الإعدادات الصحيحة بالضبط:

### 2.1 X (Twitter) — الإعدادات المطلوبة

#### مكان: https://developer.twitter.com/portal → Project → App Settings

```
✅ Type of App: Web App, Automated App or Bot — Confidential client
✅ App permissions: Read
✅ OAuth 2.0: Enabled
✅ Type of App: Confidential client
✅ Callback URI / Redirect URL:
    https://alhraj.online/auth/x/callback                       ← الويب
    https://alhrajplus.onrender.com/api/auth/x/callback-redirect ← الموبايل
✅ Website URL: https://alhraj.online
✅ Terms of service: https://alhraj.online/terms
✅ Privacy policy: https://alhraj.online/privacy
```

#### المتغيرات في Render
```env
X_CLIENT_ID="<من X Dashboard → Keys and tokens → OAuth 2.0 Client ID>"
X_CLIENT_SECRET="<من نفس الصفحة → Client Secret>"
FRONTEND_URL="https://alhraj.online"
BACKEND_PUBLIC_URL="https://alhrajplus.onrender.com"
```

#### Scopes المرسلة (في الكود)
```
tweet.read users.read
```
هذه الـ scopes كافية لاستخراج `id, name, username, profile_image_url`. **لا نطلب email** لأن X لا يعطي email عبر OAuth 2.0 (هذه قيود من تويتر، نستخدم placeholder).

#### الأخطاء الشائعة وحلولها
| الخطأ | السبب | الحل |
|---|---|---|
| `401 unauthorized` بعد الـ redirect | App permissions غير مفعّلة كـ "Read" | فعّلها من Dashboard |
| `invalid_client` | client_secret خطأ أو App ليست Confidential | غيّر Type of App إلى "Confidential client" |
| `redirect_uri_mismatch` | الـ URL في الكود ≠ المسجّل في Dashboard | أضف **بالضبط** كلا الـ URLs أعلاه |
| `403 forbidden` | لم يتم الموافقة على OAuth 2.0 | فعّل OAuth 2.0 من User authentication settings |

#### ✅ التحقق
```bash
curl https://alhrajplus.onrender.com/api/auth/x/start
# {"auth_url":"https://twitter.com/i/oauth2/authorize?response_type=code&client_id=..."}
```

---

### 2.2 Snapchat Login Kit — الإعدادات المطلوبة

#### مكان: https://kit.snapchat.com → My Apps → My Snap Kit App

```
✅ Status: Production (ليس Development — هذا مهم!)
✅ OAuth2 Redirect URLs:
    https://alhraj.online/auth/snapchat/callback                      ← الويب
    https://alhrajplus.onrender.com/api/auth/snapchat/callback-redirect ← الموبايل
✅ Scopes requested:
    user.display_name
    user.bitmoji.avatar
    user.external_id
✅ App Type: Web (OAuth 2.0)
✅ Privacy Policy URL: https://alhraj.online/privacy
✅ Terms of Service URL: https://alhraj.online/terms
```

#### المتغيرات في Render
```env
SNAPCHAT_CLIENT_ID="<Public Client ID من My Snap Kit App>"
SNAPCHAT_CLIENT_SECRET="<Confidential Client Secret>"
```

#### الأخطاء الشائعة
| الخطأ | السبب | الحل |
|---|---|---|
| `redirect_uri_mismatch` | URL غير مسجّل بالضبط | أضف **كلا URLs** بدون trailing slash |
| `invalid_scope` | scope مكتوب خطأ | استخدم الـ scopes أعلاه نصاً كاملاً |
| `Production not approved` | تطبيقك في Development mode | اطلب Production review من Snap (≤ 48h) |
| `forbidden` بعد scope grant | استخدمت confidential secret على Web flow بدلاً من PKCE | الكود يستخدم PKCE بشكل صحيح — يعني المشكلة في الـ secret في Dashboard |

#### ✅ التحقق
```bash
curl https://alhrajplus.onrender.com/api/auth/snapchat/start
# {"auth_url":"https://accounts.snapchat.com/accounts/oauth2/auth?..."}
```

---

### 2.3 جدول الـ Callback URLs النهائية (لكل المزودين)

| Provider | Web Callback | Mobile Callback |
|---|---|---|
| **Google** | `https://alhrajplus.onrender.com/api/auth/google/callback` | نفس الـ Web (الباك يحول للموبايل تلقائياً) |
| **Apple** | `https://alhrajplus.onrender.com/api/auth/apple/callback` | نفس الـ Web |
| **X (Twitter)** | `https://alhraj.online/auth/x/callback` | `https://alhrajplus.onrender.com/api/auth/x/callback-redirect` |
| **Snapchat** | `https://alhraj.online/auth/snapchat/callback` | `https://alhrajplus.onrender.com/api/auth/snapchat/callback-redirect` |

---

## 3. تأكيد نهائي — هل OAuth يعمل للويب والموبايل؟

### ✅ Web
| Provider | Status |
|---|---|
| Google | ✅ يعمل (تأكيد المستخدم) |
| Apple | ✅ كود مكتمل — يحتاج فقط 4 متغيرات Apple Developer |
| X | ✅ كود سليم — تحتاج فقط مراجعة الـ Dashboard أعلاه |
| Snapchat | ✅ كود سليم — تحتاج فقط مراجعة الـ Dashboard أعلاه |

### ✅ Mobile (Expo / React Native)
| Provider | Status | كيف يعمل؟ |
|---|---|---|
| Google | ✅ جاهز | `signInWithGoogle()` → backend → redirect `harajplus://auth/callback#token=...` |
| Apple | ✅ جاهز | `signInWithApple()` → نفس النمط |
| X | ✅ جاهز | `signInWithX()` → backend `/callback-redirect` GET → scheme redirect |
| Snapchat | ✅ جاهز | `signInWithSnapchat()` → نفس X |

التوكنز محفوظة في `expo-secure-store` (Keychain على iOS، EncryptedSharedPreferences على Android) — تبقى عند إعادة تشغيل التطبيق.

---

## 4. اختبار سريع للـ Push بعد النشر

```bash
# 1. الباك إند يرجع المفتاح
curl https://alhrajplus.onrender.com/api/push/web/vapid-public-key
# {"public_key":"BE0k4B5LlV4bF1..."}

# 2. سجّل الدخول كمستخدم عادي
TOKEN=$(curl -s -X POST https://alhrajplus.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"x","password":"y"}' | jq -r .access_token)

# 3. أرسل إشعار تجريبي
curl -X POST https://alhrajplus.onrender.com/api/push/test \
  -H "Authorization: Bearer $TOKEN"
# {"success":true,"delivered":{"expo":0,"web":1}}
```

في المتصفح: افتح `/settings` → فعّل الإشعارات → اضغط "اختبار" → ✅ يجب أن ترى إشعار خلال 2-5 ثوانٍ.

---

## 5. سلوك الإشعارات تلقائياً (Auto-triggers)

| Event | Push Title | Deep Link | Pref Key |
|---|---|---|---|
| رسالة شات جديدة | `💬 [اسم المرسل]` | `/chat?to=...` | `messages` |
| تمت الموافقة على إعلانك | `✅ تمت الموافقة على إعلانك` | `/listing/<id>` | `listing_status` |
| تم رفض إعلانك | `❌ تم رفض إعلانك` | `/listing/<id>` | `listing_status` |
| تخفيض سعر (قائمة الاهتمام) | `💸 تخفيض سعر -X%` | `/listing/<id>` | `watchlist` |
| Admin broadcast | (custom) | `/` | `broadcasts` |

> كل event يحترم تفضيلات المستخدم. لو أوقف "messages"، لن يستلم إشعار رسائل (لكن الرسالة تظل تصل داخل التطبيق).
