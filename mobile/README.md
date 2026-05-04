# الحراج بلس — تطبيق الجوال (React Native / Expo)

تطبيق الحراج بلس لنظامي **iOS و Android**، مبني بـ Expo + React Native، ويتصل بنفس الـ Backend (FastAPI) الذي يستخدمه موقع الويب.

## ✨ الميزات المنفذة (Phase 3 — Foundation)
- ✅ تسجيل الدخول / التسجيل (JWT)
- ✅ الصفحة الرئيسية مع بحث + تصنيفات أفقية + شبكة إعلانات
- ✅ تفاصيل الإعلان (صور، معرض مصغّر، معلومات البائع، اتصال/واتساب)
- ✅ AI Smart Pricing Badge
- ✅ إدارة الإعلان (تجديد / تم البيع) للمالك
- ✅ الملف الشخصي + كود الإحالة
- ✅ واجهة RTL عربية كاملة
- ✅ مشاركة الـ Backend نفسه (`REACT_APP_BACKEND_URL`)

## 🚧 Phase 3 — المخطط للجلسات القادمة
- 🔜 إرسال الصور بالكاميرا (expo-image-picker)
- 🔜 الخريطة التفاعلية (react-native-maps)
- 🔜 الدردشة الحية مع إشعارات (Expo Push Notifications)
- 🔜 المفضلة + البحث + المزادات
- 🔜 تسجيل دخول Google عبر Expo Auth Session
- 🔜 Reels/Stories video feed
- 🔜 نشر على App Store و Google Play

## 🚀 التشغيل المحلي (للتجربة على جوالك)

```bash
cd /app/mobile
yarn install
npx expo start
```

ثم امسح QR code ببرنامج **Expo Go** على جوالك (iOS App Store / Google Play).

## 🏗️ بناء APK / IPA للتوزيع

```bash
# Android APK
eas build --platform android --profile preview

# iOS (يحتاج Apple Developer Account)
eas build --platform ios --profile preview
```

## 📦 هيكل المشروع

```
mobile/
├── App.js                          # التنقل الرئيسي + AuthProvider
├── app.json                        # إعدادات Expo (الاسم، الأيقونة، صلاحيات)
├── package.json
└── src/
    ├── api.js                      # Axios + JWT from AsyncStorage
    ├── AuthContext.js              # إدارة تسجيل الدخول
    ├── theme.js                    # ألوان الحراج بلس (Baby Blue + Navy)
    ├── components/
    │   └── ListingCard.js
    └── screens/
        ├── HomeScreen.js
        ├── AuthScreens.js          # Login + Register
        ├── ListingDetailScreen.js
        └── ProfileScreen.js
```

## 🔑 Backend URL
يتم قراءته من `app.json` → `expo.extra.backendUrl`. عدّله إن تغيّر رابط الـ preview/production.

## ملاحظات
- الجوال يستخدم **Bearer Token** عبر AsyncStorage (بدلاً من الـ Cookies في الويب).
- RTL مفروض تلقائياً عبر `I18nManager.forceRTL(true)`.
