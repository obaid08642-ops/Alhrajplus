# 📱 الحراج بلس - دليل النشر على Google Play & App Store

> دليل خطوة-بخطوة كامل لنشر التطبيق على متجري Play Store و App Store.
> Backend جاهز ويعمل على: `https://alhrajplus.onrender.com`

---

## 📋 المتطلبات قبل البدء

| المتطلب | الحالة | كيف تحصل عليه |
|---|---|---|
| حساب Expo (مجاني) | يجب إنشاؤه | https://expo.dev/signup |
| حساب Google Play Developer ($25 مرة واحدة) | ✅ عندك | https://play.google.com/console |
| حساب Apple Developer ($99/سنة) | ✅ عندك | https://developer.apple.com |
| Node.js 18+ على جهازك | — | https://nodejs.org |
| Mac أو Windows أو Linux | — | لـ iOS يفضّل Mac لكن EAS Cloud يعمل من أي نظام |

---

## 🚀 الخطوات (نفّذها بالترتيب)

### الخطوة 1: تثبيت EAS CLI على جهازك المحلي

```bash
npm install -g eas-cli
eas --version    # يجب أن يظهر إصدار 5+
```

### الخطوة 2: تسجيل الدخول إلى Expo

```bash
cd /path/to/your/cloned/repo/mobile
eas login
# أدخل اسم المستخدم وكلمة السر من expo.dev
```

### الخطوة 3: ربط المشروع بـ EAS

```bash
eas init
# سيسألك:
#   - "Use existing project or create new?" → Create new
#   - "Project name" → haraj-plus
#   - يولّد projectId ويحدّث app.json تلقائياً
```

### الخطوة 4: تثبيت dependencies

```bash
yarn install
```

---

## 🤖 بناء Android (Google Play)

### 4a. بناء AAB للإنتاج

```bash
eas build --platform android --profile production
```

- ⏱️ يستغرق 15-25 دقيقة على EAS Cloud
- 📦 النتيجة: ملف `.aab` (Android App Bundle)
- 📎 رابط التحميل سيظهر في الـ terminal + email

### 4b. الرفع على Google Play Console

1. اذهب إلى https://play.google.com/console
2. **Create app**:
   - App name: `الحراج بلس`
   - Default language: Arabic (Saudi Arabia)
   - App or game: App
   - Free or paid: Free
3. **Set up your app** (املأ هذه الأقسام):
   - **App access**: All functionality available without restrictions
   - **Ads**: Yes, ads (يوجد Trip.com banners)
   - **Content rating**: Complete questionnaire (Marketplace category)
   - **Target audience**: 18+
   - **Privacy policy**: `https://alhraj.online/privacy`
4. **Store listing**:
   - Short description (80 char): `سوق رقمي ذكي - بيع، اشترِ، استأجر`
   - Full description: انسخ من `/app/mobile/STORE_LISTING_AR.md` (سأنشئه)
   - App icon: 512×512 PNG (موجود في `assets/icon.png`)
   - Feature graphic: 1024×500 PNG
   - Phone screenshots: 2-8 صور (يمكن تجهيزها من تطبيقك)
5. **Production release**:
   - Releases → Production → Create new release
   - Upload `.aab` من EAS
   - Release name: `1.0.0`
   - Release notes (Arabic): `الإصدار الأول من الحراج بلس - سوق ذكي مدعوم بالذكاء الاصطناعي`
6. اضغط **Review release** → **Start rollout to production**
7. ⏳ مراجعة Google تستغرق 1-7 أيام (عادةً 2-3)

### 4c. توقيع التطبيق (App Signing)

EAS سيتولى التوقيع تلقائياً. عند أول بناء سيسأل:
```
? Generate a new Android Keystore?  Yes
```
اختر **Yes** — EAS يولّد ويحفظ keystore بأمان.

---

## 🍎 بناء iOS (App Store)

### 5a. إعداد Apple Developer

1. اذهب إلى https://developer.apple.com/account
2. **Certificates, Identifiers & Profiles** → **Identifiers** → +
3. اختر **App IDs** → Continue → App
4. Description: `Haraj Plus`
5. Bundle ID: `com.harajplus.app` (يطابق `app.json`)
6. اختر Capabilities المطلوبة:
   - Push Notifications
   - Sign In with Apple (اختياري)
7. اضغط Continue → Register

### 5b. إنشاء App في App Store Connect

1. اذهب إلى https://appstoreconnect.apple.com → My Apps → +
2. Platform: iOS
3. Name: `الحراج بلس`
4. Primary Language: Arabic
5. Bundle ID: اختر `com.harajplus.app` من القائمة
6. SKU: `harajplus-ios-001` (أي معرف فريد)
7. User Access: Full Access

### 5c. بناء IPA

```bash
cd /path/to/your/repo/mobile
eas build --platform ios --profile production
```

EAS سيسألك:
- Apple ID (email)
- Apple ID password (أو app-specific password من https://appleid.apple.com)
- اختر Team من القائمة
- "Generate new distribution certificate?" → **Yes**
- "Generate new provisioning profile?" → **Yes**

⏱️ يستغرق 20-30 دقيقة.

### 5d. رفع IPA إلى App Store Connect

```bash
eas submit --platform ios --latest
```

أو يدوياً: حمّل IPA من EAS، ثم استخدم **Transporter.app** (Mac فقط) للرفع.

### 5e. ملء بيانات App Store

في App Store Connect → التطبيق:
1. **App Information**:
   - Subtitle: `سوق رقمي ذكي - بيع، اشترِ، استأجر`
   - Category: Shopping (Primary), Lifestyle (Secondary)
2. **Pricing and Availability**: Free, جميع الدول العربية
3. **App Privacy**:
   - Data collected: Email, Name, Phone, Photos, Location
   - Privacy Policy URL: `https://alhraj.online/privacy`
4. **App Review Information**:
   - Sign-in required: Yes
   - Demo Account: 
     - Email: `demo@alhraj.online`
     - Password: `DemoUser2026!`
   - Contact: your email + phone
5. **Version Information**:
   - Description (4000 char Arabic)
   - Keywords: `حراج, سوق, إعلانات, سيارات, عقارات, جوالات`
   - Support URL: `https://alhraj.online/contact`
   - Marketing URL: `https://alhraj.online`
6. Screenshots: 6.5" iPhone (1284×2778) - 3 to 10 صور

### 5f. Submit for Review

اضغط **Submit for Review** → ⏳ Apple تستغرق 24-48 ساعة عادةً.

---

## 🔑 معلومات حسّاسة تحتاجها للإعداد

### Google Play Service Account (للنشر التلقائي)

1. https://console.cloud.google.com → اختر مشروعك
2. IAM → Service Accounts → Create
3. Name: `eas-publish-haraj`
4. Role: Service Account User
5. Keys → Add Key → JSON → حمّله
6. ضع الملف في `mobile/google-play-service-account.json`
7. **مهم**: في Play Console → Setup → API access → Link this service account

### Apple Team ID & App Store Connect App ID

في `eas.json` → `submit.production.ios`:
- **appleId**: بريدك في Apple Developer
- **ascAppId**: من App Store Connect → App Information → "Apple ID"
- **appleTeamId**: من https://developer.apple.com/account#MembershipDetailsCard

---

## ⚡ سكربت اختصار للنشر السريع

بعد الإعداد الأول، استخدم هذه الأوامر فقط:

### Android Quick Deploy
```bash
cd mobile
eas build --platform android --profile production --auto-submit
```

### iOS Quick Deploy
```bash
cd mobile
eas build --platform ios --profile production --auto-submit
```

---

## 🐛 مشاكل شائعة وحلولها

| المشكلة | الحل |
|---|---|
| "Project ID not found" | شغّل `eas init` مرة أخرى |
| "Bundle identifier already exists" | غيّر في `app.json` → `ios.bundleIdentifier` |
| "Keystore generation failed" | شغّل `eas credentials` → Android → Generate new |
| "Build queue is full" | انتظر أو ادفع للحصول على priority queue |
| iOS build fails on EAS | تأكد من Apple Developer membership active |

---

## 📊 ما بعد النشر

### تتبع الأرقام
- **Play Console**: Statistics → Installs, Ratings, Crashes
- **App Store Connect**: Analytics → Impressions, Downloads, Sessions
- **Expo**: Dashboard → Builds, Updates, Crashes

### إصدار تحديث جديد

```bash
# عدّل version في app.json (مثلاً 1.0.0 → 1.0.1)
# عدّل ios.buildNumber و android.versionCode
cd mobile
eas build --platform all --profile production --auto-submit
```

أو **OTA Updates** (بدون مراجعة المتجر):
```bash
eas update --channel production --message "إصلاحات وتحسينات"
```

---

## ✅ Checklist نهائي قبل الإطلاق

- [ ] حساب Expo جاهز (`eas login` يعمل)
- [ ] `app.json` فيه bundleIdentifier و package فريدة
- [ ] الـ icons موجودة في `mobile/assets/` (icon.png, splash.png, adaptive-icon.png)
- [ ] Backend (`https://alhrajplus.onrender.com`) يعمل
- [ ] Cloudinary، Resend، Google OAuth كلها مضبوطة في Render
- [ ] Privacy Policy منشورة على `https://alhraj.online/privacy`
- [ ] Terms of Service منشورة على `https://alhraj.online/terms`
- [ ] حساب demo جاهز لمراجعي Apple/Google
- [ ] Screenshots جاهزة (3-10 لكل منصة)

🎉 **بالتوفيق في النشر!**
