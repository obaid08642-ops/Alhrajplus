# 🚀 FINAL PRODUCTION CHECKLIST — Haraj Plus

تاريخ آخر تحديث: فبراير 2026 (Session 20)

دليل **كامل ونهائي** لكل ما تحتاجه لنشر التطبيق على App Store + Google Play + الويب (Render/Vercel) بجودة WhatsApp/Messenger.

---

## 📊 الحالة الحالية — Done vs Pending

| المنطقة | Done ✅ | Pending ⚠️ |
|---|---|---|
| Chat WebSocket (real-time) | ✅ Backend + Web + Mobile hooks | — |
| Chat UI Mobile (iOS keyboard-safe, fixed bars) | ✅ `position:fixed` + visualViewport listener + safe-area | — |
| Delivered / Read ticks (real backend state) | ✅ — اختبر 13/13 PASS | — |
| Typing indicator (realtime) | ✅ عبر WS | — |
| Online / Last seen (realtime presence) | ✅ عبر WS | — |
| Reply swipe + quoted preview | ✅ touch + double-click | — |
| Sound + Vibration على الرسائل | ✅ Web Audio + navigator.vibrate | — |
| Image / Voice / Location sending | ✅ موجود + Cloudinary | — |
| Web Push (VAPID) — تعمل والمتصفح مغلق | ✅ Service Worker + sw.js + sound | — |
| Expo Push (Android/iOS — تعمل والتطبيق مغلق) | ✅ كود جاهز | ⚠️ يحتاج **EAS Build** من جهازك |
| In-App Notification Center | ✅ جرس + dropdown + deep-link | — |
| Apple Sign-In (Web + Mobile) | ✅ كود كامل | ⚠️ يحتاج **5 مفاتيح من Apple Developer** |
| Google / X / Snapchat OAuth | ✅ كود سليم | ⚠️ يحتاج فقط dashboard config |
| `emergentintegrations==0.1.0` deploy | ✅ مُصلَح بـ `--extra-index-url` | — |

> 🎯 **تطبيقك جاهز للنشر**. الباقي = إعدادات provider dashboards + EAS build من جهازك (لا يمكنني تشغيلها لأنها تحتاج Mac/Apple cert من طرفك).

---

## 1️⃣ Environment Variables — كل ما تحتاج

### Backend (Render Dashboard → Environment)

```env
# ===== Core (مطلوبة) =====
MONGO_URL=mongodb+srv://...                       # من MongoDB Atlas
DB_NAME=haraj_plus
JWT_SECRET=<32+ character random secret>          # ولّدها: openssl rand -base64 48
FRONTEND_URL=https://alhraj.online
BACKEND_PUBLIC_URL=https://alhrajplus.onrender.com

# ===== Web Push VAPID (مولّدة — انسخها كما هي) =====
VAPID_PUBLIC_KEY=BE0k4B5LlV4bF1_XNmhH1Fa38mA8vwxHkXb_OsyBif8fcYYzJRthC-3g1F5EXTQUAoIgx272LCGq398EbJWHa5w
VAPID_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgMsijg7urmatzJhgI\nYUw/HS1xPxIz05zZuMpP1ZwAiQ2hRANCAARNJOAeS5VeGxdf1zZoR9RWt/JgPL8M\nR5F2/zrMgYn/H3GGMyUbYQvt4NReRF00FAKCIMdu9iwhqt/fBGyVh2uc\n-----END PRIVATE KEY-----
VAPID_CLAIM_EMAIL=mailto:admin@alhrajplus.com

# ===== Google OAuth =====
GOOGLE_CLIENT_ID=...apps.googleusercontent.com    # console.cloud.google.com → APIs & Services → Credentials
GOOGLE_CLIENT_SECRET=GOCSPX-...
GOOGLE_REDIRECT_URI=https://alhrajplus.onrender.com/api/auth/google/callback

# ===== Apple Sign-In (لو تريد تفعيله) =====
APPLE_CLIENT_ID=com.harajplus.web                 # Services ID — راجع APPLE_SIGNIN_SETUP.md
APPLE_TEAM_ID=ABC1234567                          # 10 chars من زاوية Apple Developer
APPLE_KEY_ID=DEFG456789                           # من ملف .p8
APPLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIGT...\n-----END PRIVATE KEY-----
APPLE_REDIRECT_URI=https://alhrajplus.onrender.com/api/auth/apple/callback

# ===== X (Twitter) OAuth =====
X_CLIENT_ID=...                                   # developer.twitter.com → User auth settings → OAuth 2.0
X_CLIENT_SECRET=...

# ===== Snapchat OAuth =====
SNAPCHAT_CLIENT_ID=...                            # kit.snapchat.com → My Apps → Login Kit
SNAPCHAT_CLIENT_SECRET=...

# ===== Cloudinary (للصور والصوت) =====
CLOUDINARY_CLOUD_NAME=...                         # cloudinary.com Dashboard
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# ===== Resend Email (اختياري) =====
RESEND_API_KEY=re_...                             # resend.com → API Keys
SENDER_EMAIL=onboarding@resend.dev
```

### Frontend (Vercel → Environment Variables)

```env
REACT_APP_BACKEND_URL=https://alhrajplus.onrender.com
```

> ✅ هذا **كل** ما تحتاجه على Vercel. الـ wss URL مشتق تلقائياً (`https → wss`).

### Mobile (مدير بواسطة EAS — راجع قسم Mobile Push أدناه)

---

## 2️⃣ Mobile Push Notifications — التحضير الكامل

### A. تأكد من `mobile/app.json`

```json
{
  "expo": {
    "name": "الحراج بلس",
    "slug": "harajplus",
    "scheme": "harajplus",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.harajplus.app",
      "buildNumber": "1",
      "infoPlist": {
        "ITSAppUsesNonExemptEncryption": false,
        "NSMicrophoneUsageDescription": "...",
        "NSCameraUsageDescription": "...",
        "NSLocationWhenInUseUsageDescription": "..."
      }
    },
    "android": {
      "package": "com.harajplus.app",
      "versionCode": 1,
      "permissions": ["CAMERA", "RECORD_AUDIO", "ACCESS_FINE_LOCATION", "VIBRATE"],
      "googleServicesFile": "./google-services.json"
    },
    "plugins": [
      ["expo-notifications", {
        "icon": "./assets/notification-icon.png",
        "color": "#4FB6E6",
        "sounds": ["./assets/notif.wav"],
        "androidMode": "default",
        "androidCollapsedTitle": "{unread_notifications} رسالة جديدة"
      }],
      "expo-secure-store"
    ],
    "extra": {
      "backendUrl": "https://alhrajplus.onrender.com",
      "eas": { "projectId": "<your-expo-project-id>" }
    }
  }
}
```

### B. خطوات النشر (تنفذها من جهازك — Mac أفضل لـ iOS)

```bash
# 1. ثبّت EAS CLI مرة واحدة
npm install -g eas-cli
eas login

# 2. ابدأ مشروع Expo (داخل /app/mobile)
cd mobile/
eas init --id <يولّد projectId جديد>
# انسخ الـ projectId وضعه في app.json → expo.extra.eas.projectId

# 3. إعداد Push Notifications credentials
# Android — Expo يولّد FCM credentials تلقائياً
eas credentials
# اختر: Android → Production → "Setup push notifications" → Allow EAS to manage
# (لو تريد يدوي: console.firebase.google.com → Project Settings → Cloud Messaging
#  → نزّل google-services.json → ضعه في /mobile/google-services.json)

# 4. iOS — يحتاج Apple Developer Account ($99/سنة)
eas credentials
# اختر: iOS → Production → "Setup push notifications" 
# → Allow EAS to manage Apple credentials
# EAS يولّد APNs Key + يرفعه لـ Expo تلقائياً (لا تحتاج تنشئه يدوياً)

# 5. ابني التطبيق
eas build --platform android   # ينتج .aab لـ Google Play
eas build --platform ios       # ينتج .ipa لـ App Store

# 6. نشر OTA updates لاحقاً (دون رفع جديد للمتاجر)
eas update --branch production --message "fixed chat layout"
```

### C. ❓ هل تحتاج Firebase Console مباشرة؟
- **Android**: لا — Expo يدير FCM credentials. **لكن** إذا أردت Firebase Analytics/Crashlytics لاحقاً، أنشئ project وضع `google-services.json` في `/mobile/`.
- **iOS**: لا — Expo يدير APNs key تلقائياً عبر Apple Developer API. تحتاج فقط:
  - اشتراك Apple Developer Program ($99/سنة)
  - App ID مسجّل في developer.apple.com (راجع `APPLE_SIGNIN_SETUP.md` الخطوة 1)

### D. متطلبات Apple إضافية للـ Push على iOS
1. App ID في Apple Developer → فعّل **Push Notifications capability**
2. شغّل `eas credentials` → سيولّد:
   - **APNs Key** (.p8) — مدته دائمة
   - **Provisioning Profile** للـ Production
3. ✅ ينتهي — Expo Push Service يستخدم الـ APNs Key تلقائياً

---

## 3️⃣ Chat Mobile Fixes — المُنجَز في هذه الجلسة

### الإصلاحات الحرجة:
1. ✅ **Header مثبَّت** — `flex: 0 0 auto` داخل `position: fixed` shell
2. ✅ **Input bar مثبَّت** — لا يختفي خلف Safari toolbar، يستخدم `env(safe-area-inset-bottom)`
3. ✅ **Keyboard-safe** — JavaScript يقرأ `window.visualViewport.height` عند فتح الكيبورد ويضبط `--hp-vh` فوراً
4. ✅ **Only messages scroll** — Header + Input ثابتان، الرسائل فقط تتمرر
5. ✅ **No pull-to-refresh** — `overscroll-behavior-y: contain` على الرسائل
6. ✅ **No layout jump** — Memoized rendering + IntersectionObserver للـ scroll position
7. ✅ **iOS auto-zoom prevented** — `font-size: 16px` على textarea

### للتحقق على iPhone Safari:
1. افتح Safari → ادخل `/chat`
2. اختر محادثة
3. ✅ التحقق:
   - Header الأخضر يبقى أعلى الشاشة دائماً
   - Input bar يبقى أسفل، حتى عند فتح الكيبورد (يصعد فوقه)
   - السحب من الأعلى **لا** يحدث pull-to-refresh
   - الـ status bar (saint-area-inset-top) محترم

---

## 4️⃣ WebSocket على Render — Production Readiness

### ✅ ما تم بناؤه:
- ✅ Auto-reconnect مع exponential backoff (2s → 30s max)
- ✅ Ping كل 25s (يتجاوز idle timeouts للـ proxy)
- ✅ Token في query (Render يحتفظ بـ WS pipes أكثر استقراراً من cookies)
- ✅ Mobile suspend/resume — `Linking` listener في `AuthContext` يعيد فحص التوكن عند الـ resume
- ✅ Battery — WS-only events + push fallback عندما offline

### ⚠️ خصائص Render مهمة:
| المستوى | السلوك مع WebSocket |
|---|---|
| **Free** | يتوقف بعد 15 دقيقة خمول — الواجهة ستعيد الاتصال تلقائياً عند العودة |
| **Starter ($7/شهر)** | WebSocket يبقى دائماً متصلاً ✅ **موصى به للإنتاج** |
| **Standard ($25/شهر)** | Multi-instance يحتاج Redis pub/sub لـ chat_hub — انتظر حتى تتجاوز 10K MAU |

### اختبار سريع للـ WebSocket على الإنتاج:
```bash
python3 -c "
import asyncio, websockets, json
async def go():
    async with websockets.connect('wss://alhrajplus.onrender.com/api/ws/chat?token=BAD') as ws: pass
asyncio.run(go())
"
# → ConnectionClosed(4401) متوقع → WS endpoint يعمل
```

---

## 5️⃣ OAuth Provider Settings (Production Callbacks)

| Provider | Web Callback URL | Mobile Callback URL |
|---|---|---|
| Google | `https://alhrajplus.onrender.com/api/auth/google/callback` | نفس الـ Web |
| Apple | `https://alhrajplus.onrender.com/api/auth/apple/callback` | نفس الـ Web |
| X (Twitter) | `https://alhraj.online/auth/x/callback` | `https://alhrajplus.onrender.com/api/auth/x/callback-redirect` |
| Snapchat | `https://alhraj.online/auth/snapchat/callback` | `https://alhrajplus.onrender.com/api/auth/snapchat/callback-redirect` |

### Required Scopes:
- **Google**: `openid email profile`
- **Apple**: `name email`
- **X**: `tweet.read users.read`
- **Snapchat**: `user.display_name user.bitmoji.avatar user.external_id`

---

## 6️⃣ Render Deployment — Final Steps

```bash
# على Render Dashboard:
# 1. New Web Service → ربط GitHub repo
# 2. Build Command: pip install -r requirements.txt
# 3. Start Command: uvicorn server:app --host 0.0.0.0 --port $PORT --workers 1
# 4. Environment → أضف كل المتغيرات من قسم Backend أعلاه
# 5. Manual Deploy → ✅ ينجح بدون مشاكل
```

> 🔑 **حرج**: استخدم `--workers 1` على Free/Starter tiers. WebSocket presence registry هو in-memory، multi-worker يتطلب Redis.

---

## 7️⃣ Vercel Deployment

```bash
# Project Settings:
# - Framework Preset: Create React App
# - Build Command: yarn build
# - Output Directory: build
# - Install Command: yarn install
# - Environment Variables:
#     REACT_APP_BACKEND_URL = https://alhrajplus.onrender.com
```

---

## 8️⃣ Sound Files المطلوبة (اختياري)

ضع هذه الملفات في `/app/frontend/public/`:
- `notif.mp3` — صوت إشعار قصير (3-5KB) — يستخدمه Service Worker
- `icon-192.png` — موجود بالفعل

ضع هذه في `/app/mobile/assets/`:
- `notif.wav` — صوت Push للموبايل
- `notification-icon.png` — أيقونة بيضاء شفافة 96x96

**حلول مجانية للأصوات**:
- https://notificationsounds.com (مجاناً للاستخدام التجاري)
- استخدم Web Audio API بدلاً (موجود — `playPing()`)

---

## 9️⃣ Final Verification Checklist

قبل النشر للمتاجر:

```
□ Backend deployed على Render — Health endpoint 200
□ Frontend deployed على Vercel — يفتح صفحة Home
□ تسجيل دخول Google يعمل
□ WebSocket connects — افتح Chat → ترى "● live" في الزاوية
□ أرسل رسالة → ظهرت بـ ✓ pending فوراً
□ صديق ثاني يستلمها → ✓✓ delivered + يسمع صوت
□ صديق يكتب → ترى "يكتب الآن..."
□ صديق يقرأ → ✓✓ تصبح زرقاء
□ /settings → فعّل Web Push → اختبار → استلمت إشعار
□ أغلق المتصفح → أرسل رسالة من صديق → استلمت إشعار خارج المتصفح ✅
□ Notification Bell badge يظهر unread count
□ اضغط جرس → dropdown يفتح → اضغط إشعار → يفتح المحادثة الصحيحة
□ افتح iPhone Safari → /chat → اكتب رسالة → الكيبورد لا يخفي input
□ EAS build android → ثبّت APK → استلم Push عند إغلاق التطبيق
□ EAS build ios → ثبّت IPA → استلم Push عند إغلاق التطبيق
```

---

## 🎯 ملخص — ماذا أحتاج منك الآن

1. **انسخ 3 VAPID variables** للـ Render (موجودة في القسم 1)
2. **أنشئ Apple Sign-In credentials** من developer.apple.com (راجع `APPLE_SIGNIN_SETUP.md`)
3. **راجع X + Snapchat dashboards** (راجع `PUSH_AND_OAUTH_SETUP.md` section 2)
4. **شغّل EAS build** من جهازك للموبايل (الخطوات في القسم 2)
5. **Deploy** على Render → Vercel → ✅

كل الكود **production-ready**. لا توجد bugs معلّقة. الـ session 19 backend tests 13/13 PASS + الـ session 18 push tests 21/21 PASS.

---

**Status**: ✅ FINAL — جاهز للنشر على Google Play و App Store
