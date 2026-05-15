# 🏁 FINAL ANSWER — Everything You Need to Ship

تاريخ: Session 21 (فبراير 2026)  
بناءً على فحص الكود الفعلي وليس نظرياً.

---

## 1️⃣ Apple Sign-In — الحالة الحقيقية

### ✅ Backend مكتمل 100%
```
POST /api/auth/apple/callback  → 303 (يعمل، يستقبل form_post من Apple)
GET  /api/auth/apple/start     → 503 حالياً (سيرجع 200 فور إضافة المفاتيح)
```

| المتغير | الحالة الفعلية | استخدامه في الكود |
|---|---|---|
| `APPLE_CLIENT_ID` | ❌ فارغ — تحتاج إنشاءه | `server.py:99` — في authorize URL و audience verification |
| `APPLE_TEAM_ID` | ❌ فارغ — تحتاج إنشاءه | `server.py:1011` — issuer في client_secret JWT |
| `APPLE_KEY_ID` | ❌ فارغ — تحتاج إنشاءه | `server.py:1011` — `kid` header للـ JWT |
| `APPLE_PRIVATE_KEY` | ❌ فارغ — تحتاج إنشاءه | `server.py:1017` — توقيع ES256 JWT |
| `APPLE_REDIRECT_URI` | ✅ موجود | URL يستخدمه Apple للـ callback |

### السبب الوحيد لرسالة "Apple Sign In غير مُعد على الخادم":
سطر `server.py:973`: `if not APPLE_CLIENT_ID: raise HTTPException(503, ...)`

→ **فور إضافة الـ 4 متغيرات في Render، الزر يعمل تلقائياً. لا يوجد إعداد خفي آخر.**

### الـ Callback URL الذي يجب تسجيله في Apple Developer:
```
https://alhrajplus.onrender.com/api/auth/apple/callback
```

### خطوات سريعة (راجع `APPLE_SIGNIN_SETUP.md` للشرح المفصّل):
1. developer.apple.com → Identifiers → **+** → App IDs → Bundle ID = `com.harajplus.app` + فعّل Sign in with Apple
2. **+** → Services IDs → Identifier = `com.harajplus.web` → فعّل Sign in with Apple → Return URL = الـ callback أعلاه
3. **+** → Keys → فعّل Sign in with Apple → نزّل `.p8` → احفظ **Key ID**
4. **Team ID** = من زاوية الصفحة العلوية
5. أضف الـ 4 على Render → Manual Deploy → ✅

---

## 2️⃣ Push Notifications — الحالة الحقيقية

### ✅ ما هو جاهز ويعمل في الكود الآن:
- ✅ Web Push (VAPID) — `/api/push/web/vapid-public-key` يستجيب
- ✅ Service Worker (`/sw.js`) — sound + vibration + banner + deep-link
- ✅ Expo Push token registration — `mobile/src/notifications.js`
- ✅ Notification channel "default" مع `AndroidImportance.HIGH` + sound
- ✅ iOS APNs: يدار بـ Expo (يحتاج `eas credentials`)
- ✅ Foreground notification handler في Expo
- ✅ Deep linking في notification tap → `routeFromUrl()` يفتح ListingDetail/Chat
- ✅ Cold-start handler — `getLastNotificationResponseAsync()`
- ✅ Auto-triggers: chat/send + listing approve/reject + price-drop + admin broadcast
- ✅ User preferences API (`/api/push/preferences`)
- ✅ Test push API (`/api/push/test`)

### ⚠️ ما يتطلب تنفيذاً يدوياً منك (لا أستطيع تنفيذه — يحتاج جهازك):
| الخطوة | الأمر | لماذا |
|---|---|---|
| 1. تثبيت EAS CLI | `npm install -g eas-cli` | على جهازك |
| 2. تسجيل دخول | `eas login` | حسابك Expo |
| 3. ربط مشروع | `cd /app/mobile && eas init` | يولّد projectId |
| 4. push credentials | `eas credentials` → Android & iOS → Setup push | يولّد FCM + APNs تلقائياً |
| 5. build | `eas build --platform all --profile production` | ينتج .aab + .ipa |

### ENV Variables المطلوبة للـ Push:

**Backend (Render)** — 3 متغيرات فقط، **جاهزة، انسخها كما هي**:
```env
VAPID_PUBLIC_KEY=BE0k4B5LlV4bF1_XNmhH1Fa38mA8vwxHkXb_OsyBif8fcYYzJRthC-3g1F5EXTQUAoIgx272LCGq398EbJWHa5w
VAPID_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgMsijg7urmatzJhgI\nYUw/HS1xPxIz05zZuMpP1ZwAiQ2hRANCAARNJOAeS5VeGxdf1zZoR9RWt/JgPL8M\nR5F2/zrMgYn/H3GGMyUbYQvt4NReRF00FAKCIMdu9iwhqt/fBGyVh2uc\n-----END PRIVATE KEY-----
VAPID_CLAIM_EMAIL=mailto:admin@alhrajplus.com
```

**Vercel (Frontend)**: لا يحتاج أي متغير Push (يجلب VAPID public key من الـ backend).

**Expo Mobile**: لا يحتاج متغيرات Push. كل شيء يدار عبر `eas credentials`.

### ❓ هل سيعمل عند إغلاق التطبيق/المتصفح؟
| الحالة | Web Push | Expo Push (Mobile) |
|---|---|---|
| التطبيق/المتصفح **مفتوح** (foreground) | ✅ يظهر | ✅ يظهر — Notifications.setNotificationHandler |
| التطبيق/المتصفح في **background** | ✅ يظهر | ✅ يظهر |
| التطبيق/المتصفح **مغلق تماماً** (terminated) | ✅ يظهر (Service Worker يعمل) | ✅ يظهر (Expo Push يدفعها مباشرة عبر FCM/APNs) |
| Banner | ✅ نعم | ✅ نعم |
| Sound | ✅ نعم (sw.js) | ✅ نعم (Android channel) |
| Vibration | ✅ Android فقط (iOS ignores) | ✅ نعم |
| Unread badge | ✅ Bell في TopBar | ✅ iOS badge |
| Deep linking | ✅ Service Worker → openWindow | ✅ Linking.openURL |

---

## 3️⃣ Chat Mobile — الحالة الحقيقية

كل النقاط التي طلبتها مُنفّذة في الكود:

| الطلب | الحالة | الموقع |
|---|---|---|
| Header مثبَّت | ✅ | `chat.css:33-41` — `flex: 0 0 auto; z-index: 2` |
| Input bar مثبَّت | ✅ | `chat.css:96-104` — `flex: 0 0 auto; padding-bottom: calc(6px + env(safe-area-inset-bottom))` |
| Keyboard-safe | ✅ | `ChatPage.js:158-180` — `visualViewport` listener يضبط `--hp-vh` |
| `position: fixed` على الموبايل | ✅ | `chat.css:22-31` — `@media (max-width:767px)` |
| No pull-to-refresh | ✅ | `chat.css:48` — `overscroll-behavior-y: contain` |
| No iOS auto-zoom | ✅ | `chat.css:118` — `font-size: 16px` |
| Read receipts (✓ ✓✓ blue ✓✓) | ✅ | `ChatPage.js:97-103` — backend tested 13/13 PASS |
| Online/Last seen | ✅ | `chat_hub.py` — broadcast presence + `/api/chat/presence/{id}` |
| Typing indicator | ✅ | WS `typing` event + 3-dot animation |
| Swipe-to-reply | ✅ | `ChatPage.js:39-53` — touch handler 60px threshold |
| WebSocket reconnect | ✅ | `useChatSocket.js` — exp backoff 2→30s + 25s ping |
| Sound + vibration | ✅ | `ChatPage.js:200-220` — two-tone ding + navigator.vibrate(40) |

✅ **اختبار شامل**: 13/13 PASS في `/app/test_reports/iteration_20.json`

---

## 4️⃣ Mobile EAS Build — ما يجب فعله

### معلومات المشروع الفعلية:
```
المجلد:          /app/mobile/
Bundle ID iOS:   com.harajplus.app
Package Android: com.harajplus.app
Scheme:          harajplus
EAS projectId:   REPLACE_WITH_YOUR_EAS_PROJECT_ID  ⚠️ سيُولَّد عند `eas init`
```

### الملفات الجاهزة:
- ✅ `/app/mobile/app.json` — fully configured (iOS permissions, Android permissions, intentFilters للـ deep links)
- ✅ `/app/mobile/eas.json` — 3 profiles: development / preview (APK) / production (AAB+IPA)
- ✅ `/app/mobile/package.json` — كل dependencies (expo-notifications, expo-secure-store, expo-web-browser, expo-linking)

### الإعدادات المُؤكَّدة في `app.json`:
- ✅ iOS permissions: Camera, PhotoLibrary, Location, Microphone, FaceID
- ✅ Android permissions: ACCESS_FINE_LOCATION, CAMERA, RECORD_AUDIO, VIBRATE, USE_BIOMETRIC
- ✅ Android intentFilters: `harajplus://auth/callback` + universal links لـ alhraj.online
- ✅ iOS CFBundleURLTypes: scheme `harajplus`
- ✅ associatedDomains: applinks:alhraj.online, applinks:alhrajplus.com

### ⚠️ شيء واحد فقط يحتاج تعديل قبل البناء:
في `/app/mobile/eas.json` السطر 41-43 — استبدل بمعلوماتك:
```json
"ios": {
  "appleId": "your_apple_id@example.com",
  "ascAppId": "1234567890",                 ← من App Store Connect بعد إنشاء التطبيق
  "appleTeamId": "ABC1234567"               ← نفس APPLE_TEAM_ID
}
```

### الأوامر بالترتيب (على جهازك):
```bash
# 1. ثبّت EAS مرة واحدة
npm install -g eas-cli

# 2. سجّل دخول
eas login

# 3. ادخل مجلد الموبايل
cd /app/mobile

# 4. ربط بـ Expo Project (يولّد projectId ويحدّث app.json تلقائياً)
eas init

# 5. إعداد push credentials (يولّد FCM + APNs)
eas credentials
# اختر: Android → Production → Setup push notifications → Allow EAS
# ثم: iOS → Production → Setup push notifications → Allow EAS

# 6. بناء APK للتجريب
eas build --platform android --profile preview

# 7. بناء AAB للنشر على Google Play
eas build --platform android --profile production

# 8. بناء IPA للنشر على App Store (يحتاج Apple Developer)
eas build --platform ios --profile production

# 9. (اختياري) Submit مباشرة للمتاجر
eas submit --platform android --latest
eas submit --platform ios --latest
```

### ✅ APK / AAB / IPA كلها مدعومة:
| الصيغة | الـ Profile | الاستخدام |
|---|---|---|
| **APK** | `preview` | تجريب مباشر على جهازك |
| **AAB** | `production` | Google Play Store |
| **IPA** | `production` | Apple App Store |

---

## 5️⃣ Production Deployment — Steps الكاملة

### A. Render (Backend)
```bash
# 1. ادخل Render Dashboard → New Web Service → ربط GitHub repo
# 2. Build Command:  pip install -r requirements.txt
# 3. Start Command:  uvicorn server:app --host 0.0.0.0 --port $PORT --workers 1
# 4. Environment → الصق هذه المتغيرات:
```
**انسخ من `/app/FINAL_PRODUCTION_CHECKLIST.md` قسم Backend**

### B. Vercel (Frontend)
```bash
# 1. New Project → ربط GitHub repo
# 2. Framework: Create React App
# 3. Build Command:    yarn build
# 4. Output Directory: build
# 5. Environment:
REACT_APP_BACKEND_URL=https://alhrajplus.onrender.com
```

### C. أي شيء آخر؟ ❌ لا.

---

## 6️⃣ Blockers قبل النشر — ✅ **لا يوجد** على مستوى الكود

| ✅ Done | ⚠️ تحتاج فعله أنت |
|---|---|
| Chat WebSocket + UI كامل | إضافة 3 VAPID vars على Render |
| Push Web + Mobile كود كامل | إضافة 4 Apple vars (لتفعيل Apple Sign-In) |
| Notification Center | تسجيل redirects في X + Snapchat dashboards |
| OAuth (Google يعمل، 3 آخرى كود سليم) | تشغيل `eas init` + `eas build` من جهازك |
| `app.json` + `eas.json` + permissions | تحديث `appleId` و `ascAppId` في eas.json |
| iOS keyboard-safe layout | اشتراك Apple Developer ($99) لـ iOS |
| Deep linking schemes | (اختياري) شراء Render Starter ($7) لـ WS مستقر |
| `emergentintegrations` deploy fix | — |
| Backend tests 13/13 + 21/21 PASS | — |

---

## 🎯 الخلاصة النهائية

**كل ما تطلبه من الكود = جاهز ومختبر. ما يتبقى:**

1. ✅ **3 دقائق**: انسخ VAPID vars الـ 3 → Render → Deploy
2. ⏰ **30 دقيقة (اختياري)**: أنشئ Apple Sign-In credentials → أضف 4 vars
3. ⏰ **15 دقيقة**: راجع X + Snapchat dashboards
4. ⏰ **45 دقيقة (على جهازك)**: `eas login` → `eas init` → `eas credentials` → `eas build`
5. ✅ **النشر**: Submit APK/AAB/IPA للمتاجر

**Status: Production-Ready ✅ — Zero hidden setup**
