# 🔑 خدمات خارجية — كيف تحصل على كل مفتاح

> دليل بصيغة **انقر → سجّل → انسخ → الصق في Render** فقط.
> لا حاجة لمعرفة تقنية. كل القيم اختيارية — الموقع يعمل بدون أي منها.

---

## 1️⃣ Google Analytics 4 (تتبع الزوار والإحصائيات)

### الفائدة
ترى عدد الزوار، الصفحات الأكثر مشاهدة، الدول، الأجهزة — مجاناً وللأبد.

### كيف تحصل عليه (3 دقائق)
1. افتح: **https://analytics.google.com**
2. **Start measuring** → Account name: `Haraj Plus`
3. Property name: `alhraj.online` → Time zone: Saudi Arabia → Currency: SAR
4. Business details: Online → Select all
5. اختر **Web** → Website URL: `https://alhraj.online`
6. **Stream name**: `alhraj-web` → Create stream
7. انسخ **Measurement ID** (شكله: `G-XXXXXXXXXX`)

### الإضافة على Vercel
- Vercel Dashboard → Settings → Environment Variables → Add:
  - Key: `REACT_APP_GA_ID`
  - Value: `G-XXXXXXXXXX` (الذي نسخته)
- اضغط **Redeploy**

✅ بعد 5 دقائق، تستطيع رؤية الزوار الأحياء على https://analytics.google.com

---

## 2️⃣ Google Search Console (لظهور الموقع في بحث Google)

### الفائدة
- Google يفهرس إعلاناتك (تظهر في نتائج البحث)
- ترى الكلمات التي يأتي بها الزوار
- تستطيع إعادة إرسال أي رابط لإعادة فهرسته

### كيف تحصل عليه (5 دقائق)
1. افتح: **https://search.google.com/search-console**
2. **Add Property** → اختر **URL Prefix**
3. أدخل: `https://alhraj.online` → Continue
4. اختر **HTML tag** verification → سيظهر لك:
   ```html
   <meta name="google-site-verification" content="XXXXXX..." />
   ```
5. انسخ **فقط القيمة من `content="..."`** (الجزء بين علامتي الاقتباس)

### الإضافة على Vercel
- Environment Variables → Add:
  - Key: `REACT_APP_GSC_TOKEN`
  - Value: `XXXXXX...` (الذي نسخته)
- **Redeploy**

### الخطوة الأخيرة في Google
- ارجع لـ Search Console → اضغط **Verify**
- ✅ سيؤكد ملكية الموقع
- اذهب إلى **Sitemaps** → أضف: `sitemap.xml` → Submit

🎉 خلال 24-72 ساعة، Google يبدأ في فهرسة الموقع.

---

## 3️⃣ Bing Webmaster Tools (لظهور الموقع في Bing + DuckDuckGo)

### الفائدة
- Bing يفهرس الموقع
- IndexNow بالفعل مُفعّل تلقائياً من الكود
- DuckDuckGo يستخدم Bing index

### كيف تحصل عليه (3 دقائق)
1. افتح: **https://www.bing.com/webmasters**
2. سجّل دخول بحساب Microsoft
3. **Add a site** → `https://alhraj.online`
4. **Import from Google Search Console** (الأسهل) — أو يدوياً:
5. اختر **Meta tag** verification → ستظهر قيمة طويلة من `content="..."`
6. انسخ القيمة فقط

### الإضافة على Vercel
- Environment Variables → Add:
  - Key: `REACT_APP_BING_TOKEN`
  - Value: `XXXXXX...`
- **Redeploy**

### الخطوة الأخيرة
- ارجع لـ Bing → اضغط **Verify** → ✅

---

## 4️⃣ Google Indexing API (إرسال فوري لـ Google عند كل إعلان)

### الفائدة
- Google يفهرس الإعلانات الجديدة **خلال ساعة** بدلاً من أسابيع
- بدون انتظار crawl

### كيف تحصل عليه (10 دقائق - أصعب قليلاً)
1. افتح: **https://console.cloud.google.com**
2. اختر المشروع نفسه الذي فيه Google OAuth
3. APIs & Services → Enable APIs → ابحث عن **Indexing API** → Enable
4. IAM & Admin → **Service Accounts** → **+ CREATE SERVICE ACCOUNT**
5. اسم: `haraj-indexing` → CREATE
6. Role: تخطّى → DONE
7. اضغط على الـ Service Account الذي أنشأته → **Keys** → ADD KEY → JSON
8. سيُحمَّل ملف JSON على جهازك (احتفظ به آمناً!)
9. افتح الملف وانسخ **كامل المحتوى** (من `{` حتى `}`)

### الإضافة على Render
- Render Dashboard → Environment → Add:
  - Key: `GOOGLE_INDEXING_SA_JSON`
  - Value: **كامل محتوى ملف JSON كنص واحد**
- Save Changes

### الخطوة الأخيرة في Search Console
1. ارجع لـ Search Console → Settings → **Users and permissions**
2. **Add User** → بريد الـ service account (يكون بشكل `haraj-indexing@PROJECT.iam.gserviceaccount.com`)
3. Permission: **Owner** → Add

✅ من الآن، كل إعلان جديد يُرسَل لـ Google خلال 30 ثانية.

---

## 5️⃣ Yandex Webmaster (الأسواق الروسية + الشرق الأوسط)

### الفائدة
- IndexNow بالفعل مُرسِل لـ Yandex تلقائياً
- لكن تأكيد ملكية الموقع يفتح إحصائيات إضافية

### كيف
1. افتح: **https://webmaster.yandex.com**
2. Add Site → `https://alhraj.online`
3. اختر **Meta tag** → انسخ قيمة `content="..."`

### الإضافة (يدوياً في index.html — اطلب مني)
أو يمكنك إضافتها كـ env var مثل Google. أعلمني إذا تريدها.

---

## 6️⃣ Apple Search Ads / Apple App Site Association

### الفائدة
عند مشاركة رابط الموقع على iPhone، يظهر مع البطاقة الجميلة (يحدث تلقائياً عبر Open Graph الموجود).

### الإعداد
**لا شيء مطلوب** — Apple يقرأ Open Graph تلقائياً من الـ meta tags الموجودة بالفعل في الكود.

---

## 7️⃣ Facebook / Meta Business

### الفائدة
- مشاركة على Facebook تظهر مع بطاقة
- إمكانية تتبع conversions (إذا أردت إعلانات مدفوعة لاحقاً)

### كيف
1. افتح: **https://developers.facebook.com/apps**
2. Create App → Business → اسم: `Haraj Plus`
3. App ID يظهر في الأعلى

### الإضافة (للـ Open Graph المتقدم)
أعلمني إذا تريد ربط Facebook Pixel للإعلانات.

---

## 8️⃣ Cloudflare Web Analytics (بديل خصوصية أكبر من Google Analytics)

### الفائدة
- لا يستخدم cookies
- لا يبطئ الموقع
- مجاني وللأبد

### كيف
1. افتح: **https://www.cloudflare.com/web-analytics**
2. Add a site → `https://alhraj.online`
3. ستحصل على snippet JS

أعلمني إذا تريد إضافته (يحتاج تعديل index.html).

---

## 📋 الملخص: كل المتغيرات الجديدة

| المتغير | الموقع | الإلزامي؟ |
|---|---|---|
| `REACT_APP_GA_ID` | **Vercel** | اختياري (Analytics) |
| `REACT_APP_GSC_TOKEN` | **Vercel** | اختياري (Search Console) |
| `REACT_APP_BING_TOKEN` | **Vercel** | اختياري (Bing) |
| `GOOGLE_INDEXING_SA_JSON` | **Render** | اختياري (Google Indexing API) |

> 💡 **بدونها**: الموقع يعمل تماماً، فقط لن تحصل على إحصائيات أو فهرسة فورية في Google.
> 
> 💡 **معها**: ترى الزوار اللحظيين، الإعلانات تظهر في Google خلال ساعة، الكلمات المفتاحية مفهرسة في كل المحركات.

---

## ⚡ ترتيب الأولوية

1. 🔴 **افعلها أولاً** (5 دقائق): Google Search Console (بدونه Google لن يفهرس موقعك جيداً)
2. 🟠 **افعلها ثانياً** (3 دقائق): Google Analytics (لرؤية الزوار)
3. 🟡 **افعلها ثالثاً** (3 دقائق): Bing Webmaster (يكمّل IndexNow)
4. 🟢 **اختياري** (10 دقائق): Google Indexing API (للسرعة القصوى)

بعد كل واحدة → اضغط **Redeploy** على Vercel (للـ Frontend env vars) أو Render يعيد تلقائياً (للـ Backend).
