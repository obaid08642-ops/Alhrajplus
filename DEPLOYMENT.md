# 🚀 دليل النشر — الحراج بلس (Haraj Plus)

> هذا الملف يشرح كيفية نشر تطبيق "الحراج بلس" على Google Cloud Run (Backend) + Firebase Hosting (Frontend) + MongoDB Atlas (Database).
> الهدف: نشر بضغطة واحدة بعد إعداد المفاتيح.

---

## 🎯 ملخص المعمارية للنشر

```
┌─────────────────────────────────────────────────────────────┐
│  المستخدم  →  https://alhraj.online                         │
│              │                                               │
│              ▼                                               │
│  Firebase Hosting (Static React Build)                       │
│              │  /api/**  proxy                               │
│              ▼                                               │
│  Google Cloud Run (FastAPI Container)                        │
│              │                                               │
│              ▼                                               │
│  MongoDB Atlas (Free M0 Cluster)                             │
└─────────────────────────────────────────────────────────────┘
```

**التكلفة الشهرية المتوقعة لاستخدام خفيف-متوسط: $0**

---

## 📋 المتطلبات قبل النشر

| الأداة | الرابط | السبب |
|---|---|---|
| Google Cloud SDK (gcloud) | https://cloud.google.com/sdk/install | للنشر على Cloud Run |
| Firebase CLI | `npm i -g firebase-tools` | للنشر على Firebase Hosting |
| Node.js 20+ | https://nodejs.org | لبناء الفرونت‌إند |
| Yarn | `npm i -g yarn` | حزم npm |
| Git | https://git-scm.com | لإدارة الكود |

---

## 🔑 المفاتيح والـ Environment Variables

### قائمة المفاتيح المطلوبة:
| المتغير | الوصف | كيف تحصل عليه |
|---|---|---|
| `MONGO_URL` | رابط MongoDB Atlas | https://cloud.mongodb.com → Cluster → Connect |
| `DB_NAME` | اسم قاعدة البيانات (ثابت: `haraj_plus_db`) | يُحدّد منك |
| `JWT_SECRET` | سر JWT (سلسلة عشوائية 64+ حرف) | `openssl rand -hex 32` |
| `GEMINI_API_KEY` | مفتاح Google Gemini للذكاء الاصطناعي | https://aistudio.google.com/apikey |
| `CLOUDINARY_CLOUD_NAME` | اسم سحابة Cloudinary | https://cloudinary.com → Dashboard |
| `CLOUDINARY_API_KEY` | مفتاح Cloudinary API | نفس المكان |
| `CLOUDINARY_API_SECRET` | سر Cloudinary | نفس المكان |
| `RESEND_API_KEY` | مفتاح Resend للإيميلات | https://resend.com/api-keys |
| `SENDER_EMAIL` | إيميل المرسل (موصى به: `noreply@alhraj.online`) | يُحدّد منك |
| `FRONTEND_URL` | رابط الموقع المنشور | `https://alhraj.online` |
| `X_CLIENT_ID` | OAuth X (Twitter) | https://developer.x.com |
| `X_CLIENT_SECRET` | سر X | نفس المكان |
| `SNAPCHAT_CLIENT_ID` | Snap Kit Client ID | https://kit.snapchat.com/portal |
| `SNAPCHAT_CLIENT_SECRET` | Snap Kit Secret | نفس المكان |

⚠️ **مهم**: `EMERGENT_LLM_KEY` لن يعمل خارج Emergent. الكود سيستخدم `GEMINI_API_KEY` مباشرة كبديل.

---

## 🚀 خطوات النشر — أول مرة (One-Time Setup)

### الخطوة 1: إعداد MongoDB Atlas (5 دقائق)
1. اذهب إلى https://cloud.mongodb.com → سجّل حساب
2. **Create Cluster** → اختر **M0 (Free)** → AWS Frankfurt أو Mumbai (الأقرب للخليج)
3. **Database Access** → Add User → username + قوي password (احفظهم)
4. **Network Access** → Add IP → `0.0.0.0/0` (Allow from anywhere — Cloud Run يستخدم IPs ديناميكية)
5. **Connect** → Drivers → Python → انسخ Connection String:
   ```
   mongodb+srv://USER:PASSWORD@cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. ⚠️ **استبدل `<password>` بكلمة السر**، وأضف اسم قاعدة البيانات قبل `?`:
   ```
   mongodb+srv://USER:PASSWORD@cluster.xxxxx.mongodb.net/haraj_plus_db?retryWrites=true&w=majority
   ```

### الخطوة 2: إعداد Google Cloud Project (10 دقائق)
```bash
# 1. سجّل دخول
gcloud auth login

# 2. أنشئ مشروع جديد (أو استخدم موجود)
gcloud projects create haraj-plus --name="Haraj Plus"
gcloud config set project haraj-plus

# 3. فعّل الـ APIs المطلوبة
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  firebasehosting.googleapis.com

# 4. أنشئ Artifact Repository (لتخزين Docker images)
gcloud artifacts repositories create haraj-images \
  --repository-format=docker \
  --location=me-central1 \
  --description="Haraj Plus container images"
```

### الخطوة 3: حفظ المفاتيح في Google Secret Manager
```bash
# أنشئ كل secret على حدة (انسخ القيم الفعلية)
echo -n "mongodb+srv://..." | gcloud secrets create MONGO_URL --data-file=-
echo -n "$(openssl rand -hex 32)" | gcloud secrets create JWT_SECRET --data-file=-
echo -n "AIzaSy..." | gcloud secrets create GEMINI_API_KEY --data-file=-
echo -n "your_cloudinary_secret" | gcloud secrets create CLOUDINARY_API_SECRET --data-file=-
echo -n "re_..." | gcloud secrets create RESEND_API_KEY --data-file=-
echo -n "x_client_secret" | gcloud secrets create X_CLIENT_SECRET --data-file=-
echo -n "snap_client_secret" | gcloud secrets create SNAPCHAT_CLIENT_SECRET --data-file=-

# امنح Cloud Run access إلى Secret Manager
PROJECT_NUMBER=$(gcloud projects describe haraj-plus --format='value(projectNumber)')
for secret in MONGO_URL JWT_SECRET GEMINI_API_KEY CLOUDINARY_API_SECRET RESEND_API_KEY X_CLIENT_SECRET SNAPCHAT_CLIENT_SECRET; do
  gcloud secrets add-iam-policy-binding $secret \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
done
```

### الخطوة 4: تعديل `cloudbuild.yaml` بقيم البيئة العامة
افتح `/app/cloudbuild.yaml` واستبدل في السطر `--set-env-vars=`:
- `CLOUDINARY_CLOUD_NAME=YOUR_CLOUD_NAME` → اسم سحابتك
- `CLOUDINARY_API_KEY=YOUR_KEY` → مفتاح Cloudinary العام
- `X_CLIENT_ID=YOUR_X_ID` → معرّف X العام
- `SNAPCHAT_CLIENT_ID=YOUR_SNAP_ID` → معرّف Snap العام

---

## 🎯 النشر الفعلي (Deploy Command)

### Backend (Cloud Run) — أمر واحد
```bash
cd /path/to/haraj-plus
gcloud builds submit --config=cloudbuild.yaml \
  --substitutions=_SERVICE_NAME=haraj-api,_REGION=me-central1,_ARTIFACT_REPO=haraj-images
```

⏱️ يستغرق 5-8 دقائق. عند الانتهاء سترى:
```
Service URL: https://haraj-api-xxxxxxxx.me-central1.run.app
```
**انسخ هذا الـ URL** — ستحتاجه للـ Frontend.

### Frontend (Firebase Hosting)

#### 1️⃣ بناء الفرونت‌إند مع رابط الـ Backend
```bash
cd frontend
echo "REACT_APP_BACKEND_URL=https://haraj-api-xxxxxxxx.me-central1.run.app" > .env.production
yarn install
yarn build
```

#### 2️⃣ نشر على Firebase
```bash
cd ..   # العودة إلى /app
firebase login
firebase use --add  # اختر مشروع haraj-plus
firebase deploy --only hosting
```

⏱️ يستغرق 1-2 دقيقة. سترى:
```
Hosting URL: https://haraj-plus.web.app
```

---

## 🌐 ربط الدومين alhraj.online

### في Firebase Console:
1. https://console.firebase.google.com → haraj-plus → Hosting
2. **Add custom domain** → أدخل `alhraj.online`
3. Firebase يعطيك TXT record للتحقق + A records للربط
4. اذهب للوحة الدومين (Namecheap/GoDaddy/إلخ) وأضف:
   - **TXT** record للتحقق
   - **A** record(s) للربط
   - **CNAME** للنطاق الفرعي `www`
5. انتظر 5-30 دقيقة لانتشار DNS

### تحديث Environment Variables بعد ربط الدومين:
```bash
# Cloud Run service
gcloud run services update haraj-api \
  --region=me-central1 \
  --update-env-vars=FRONTEND_URL=https://alhraj.online
```

### تحديث OAuth Callback URLs:
- **X (Twitter)**: https://developer.x.com/apps → Callback URL: `https://alhraj.online/auth/x/callback`
- **Snapchat**: https://kit.snapchat.com → Redirect URLs: `https://alhraj.online/auth/snapchat/callback`
- **Google (Emergent)**: لن يعمل خارج Emergent — استبدله بـ Google OAuth مباشر إذا احتجت

---

## 🔄 النشر اللاحق (Updates)

### Backend update:
```bash
gcloud builds submit --config=cloudbuild.yaml \
  --substitutions=_SERVICE_NAME=haraj-api,_REGION=me-central1,_ARTIFACT_REPO=haraj-images
```

### Frontend update:
```bash
cd frontend && yarn build && cd ..
firebase deploy --only hosting
```

### CI/CD تلقائي (موصى به):
في Cloud Build → **Triggers** → ربط مع GitHub:
- Trigger 1: عند Push على `main` → نفّذ `cloudbuild.yaml`
- Trigger 2: عند Push على `main` → بناء + Firebase deploy (raise GitHub Action بدلاً)

---

## ⚙️ تعديلات في الكود قبل النشر الخارجي

### 1. CORS في `backend/server.py`
ابحث عن `CORSMiddleware` وحدّث `allow_origins`:
```python
allow_origins=[
    "https://alhraj.online",
    "https://www.alhraj.online",
    "https://haraj-plus.web.app",
    "https://haraj-plus.firebaseapp.com",
]
```

### 2. AI fallback إلى Gemini مباشرة
الكود الحالي يستخدم `EMERGENT_LLM_KEY`. للنشر الخارجي، أضف هذا الكود في بداية كل ملف يستخدم AI:
```python
# في server.py
import os
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY") or os.environ.get("GEMINI_API_KEY")
```

`emergentintegrations` لن يعمل، لكن Gemini SDK المباشر يعمل. إن أردت تحويل كامل لـ Gemini SDK مباشرة، اطلب من المطور.

---

## 📱 نشر تطبيق الموبايل (Expo)

```bash
cd /app/mobile
npm i -g eas-cli
eas login
eas build:configure

# Android (يحتاج Google Play Console — $25 لمرة واحدة)
eas build --platform android --profile production

# iOS (يحتاج Apple Developer — $99/سنة)
eas build --platform ios --profile production

# تقديم للمتاجر مباشرة
eas submit --platform android
eas submit --platform ios
```

---

## 🛡️ checklist قبل النشر النهائي

- [ ] جميع المفاتيح في Secret Manager
- [ ] CORS محدّث في server.py
- [ ] FRONTEND_URL يساوي الدومين الفعلي
- [ ] X و Snap callback URLs محدّثة في لوحات المطورين
- [ ] Resend domain (`alhraj.online`) موثّق DNS
- [ ] MongoDB Atlas: Network Access = 0.0.0.0/0
- [ ] Cloud Run: min-instances=0 (للتوفير) أو 1 (لتجنّب cold-start)
- [ ] Firebase Hosting custom domain verified
- [ ] أيقونة التطبيق + Splash screen + متاجر التطبيقات

---

## 💰 التكاليف المتوقعة

| الخدمة | الخطة المجانية | متى تدفع؟ |
|---|---|---|
| **Cloud Run** | 2M requests/شهر + 360K GB-sec | عند تجاوز |
| **Firebase Hosting** | 10GB storage + 360MB/يوم bandwidth | عند تجاوز |
| **MongoDB Atlas M0** | 512MB storage مدى الحياة | للترقية إلى M2+ ($9/شهر) |
| **Cloud Build** | 120 دقيقة بناء/يوم | عند تجاوز |
| **Secret Manager** | 6 secrets نشطة + 10K access/شهر | عند تجاوز |

**للموقع المتوسط (10K زائر/شهر): $0/شهر**
**للموقع الكبير (1M زائر/شهر): ~$30-80/شهر**

---

## 🆘 مشاكل شائعة

### Cloud Run يعطي 503 على `/api/*`
- تحقق من logs: `gcloud run services logs read haraj-api --region=me-central1`
- تأكد أن `MONGO_URL` صحيح في Secret Manager
- تأكد أن MongoDB Atlas Network Access = `0.0.0.0/0`

### Firebase Hosting يفتح index.html فقط بدون API
- تحقق من `firebase.json` → `rewrites` → `serviceId` يطابق اسم خدمة Cloud Run
- تأكد أن `_REGION` في cloudbuild.yaml = `me-central1` نفس Firebase

### CORS errors في المتصفح
- حدّث `allow_origins` في `server.py`
- أعد deploy الـ backend

---

## 📞 للدعم
- بريد: support@alhraj.online
- GitHub Issues على المستودع
- Cloud Run docs: https://cloud.google.com/run/docs

---

> آخر تحديث: فبراير 2026
> الإصدار: 1.0
