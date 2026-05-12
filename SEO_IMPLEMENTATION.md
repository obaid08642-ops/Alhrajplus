# 🔍 SEO Implementation — Haraj Plus

> دليل شامل لكل ميزات SEO المُنفّذة في المشروع.

---

## ✅ ما تم تنفيذه (Production-Ready)

### 1. Sitemap.xml ديناميكي
- `GET https://alhraj.online/sitemap.xml` — يولّد تلقائياً من قاعدة البيانات
- يحتوي كل الإعلانات النشطة + الصفحات الثابتة
- يتحدث فوراً عند إضافة أي إعلان (لا cache)
- مرجع في `<head>` HTML

### 2. Robots.txt مع AI Bots
- `GET https://alhraj.online/robots.txt`
- يسمح صراحةً لـ:
  - **GPTBot** (ChatGPT)
  - **ClaudeBot** (Anthropic)
  - **PerplexityBot**
  - **Google-Extended** (Bard/Gemini)
  - **Applebot-Extended** (Siri)
- يمنع `/admin` و `/api/` من الفهرسة

### 3. JSON-LD Structured Data
في `index.html` (Organization schema) + في `SEO.js` (Product schema لكل إعلان):
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "...",
  "image": ["..."],
  "offers": { "@type": "Offer", "price": "..." }
}
```

### 4. Meta Tags ديناميكية (React Helmet)
- Title، Description، Keywords — **تلقائية لكل إعلان** من العنوان+الوصف+الفئة+المدينة
- Canonical URL
- Open Graph (Facebook، WhatsApp، Telegram)
- Twitter Cards
- Article tags (للأخبار)

### 5. Bot Prerendering
- `GET /api/seo/listing/{id}` — يكتشف User-Agent ويُرجع HTML كامل مع JSON-LD
- يخدم: facebookexternalhit, Twitterbot, WhatsApp, LinkedInBot, Slackbot, Discordbot, AI bots
- بقية المستخدمين يرون SPA عادي (سريع)

### 6. **🆕 IndexNow — إرسال فوري لمحركات البحث (Feb 2026)**
عند إنشاء/تعديل أي إعلان، يُرسَل URL فوراً إلى:
- ✅ **Bing**
- ✅ **Yandex**
- ✅ **Seznam**
- ✅ **Naver**
- ✅ **DuckDuckGo** (يستخدم Bing index)

**كيف يعمل:**
- `POST /api/listings` → background task يرسل URL لـ `https://api.indexnow.org/IndexNow`
- ملف التحقق: `https://alhraj.online/{KEY}.txt` (مُنشأ تلقائياً)
- Fire-and-forget: لا يبطئ إنشاء الإعلان أبداً

### 7. Google Sitemap Ping
- عند admin يضغط "Resubmit All" → يُستدعى `GET https://www.google.com/ping?sitemap=...`
- ⚠️ Google أنهى دعم هذا 2023 لكنه ما زال يعمل لبعض المواقع (best-effort)

### 8. Auto-Search Indexing (Internal)
- كل إعلان جديد يحصل تلقائياً على `search_blob` (عربي مُطبَّع + إنجليزي)
- يدعم البحث الفوري + Fuzzy matching للأخطاء الإملائية

---

## 📊 Endpoints الإدارية

| Endpoint | الوصف |
|---|---|
| `GET /api/seo/indexnow/key` | عرض مفتاح IndexNow + URL التحقق |
| `POST /api/seo/indexnow/resubmit-all` | إعادة إرسال كل الإعلانات (admin only) |
| `GET /api/sitemap.xml` | السايتماب |
| `GET /api/robots.txt` | الـ robots |
| `GET /api/seo/listing/{id}` | Bot prerender |

---

## 🌐 خطوات بعد النشر (يدوية - 5 دقائق)

### 1. Google Search Console
1. اذهب إلى https://search.google.com/search-console
2. **Add Property** → اختر **URL Prefix** → أدخل `https://alhraj.online`
3. اختر طريقة التحقق: **HTML tag** أو **DNS**
4. بعد التحقق: **Sitemaps** → أضف `https://alhraj.online/sitemap.xml`
5. **Request Indexing** للصفحة الرئيسية يدوياً
6. Google سيبدأ الـ crawling خلال 24-72 ساعة

### 2. Bing Webmaster Tools
1. اذهب إلى https://www.bing.com/webmasters
2. **Add a site** → `https://alhraj.online`
3. **Import from Google Search Console** (إذا حسابك مربوط) أو تحقق يدوياً
4. **Sitemaps** → أضف `https://alhraj.online/sitemap.xml`
5. ✨ **IndexNow** نشط بالفعل من الكود — Bing سيستقبل التحديثات فوراً

### 3. Yandex Webmaster
1. https://webmaster.yandex.com
2. أضف الموقع → تحقق ملكية → أضف sitemap
3. ✨ IndexNow يعمل تلقائياً

### 4. Apple Spotlight (SEO للـ iOS)
- ✅ موجود من خلال `Applebot-Extended` في robots.txt
- لا إعدادات إضافية مطلوبة

### 5. Schema.org Validator
اختبر إعلاناتك:
- https://validator.schema.org → أدخل أي رابط إعلان
- يجب أن يعرض Product + Offer schema بدون أخطاء

---

## 🤝 Social Media Sharing

عندما يشارك أحد رابط إعلان على هذه المنصات، يظهر تلقائياً مع صورة وعنوان جميل:

| المنصة | الحالة | لماذا |
|---|---|---|
| WhatsApp | ✅ | Open Graph + Bot prerender |
| Twitter / X | ✅ | Twitter Cards (summary_large_image) |
| Facebook | ✅ | Open Graph + fb:app_id ready |
| LinkedIn | ✅ | Open Graph |
| Telegram | ✅ | Open Graph |
| Discord | ✅ | Open Graph |
| Slack | ✅ | Open Graph |
| iMessage (Apple) | ✅ | OG + Applebot |

---

## 🤖 AI Agents (ChatGPT, Claude, Perplexity)

عندما يبحث مستخدم في ChatGPT عن منتج من إعلاناتك، الـ AI سيقرأ موقعك ويستشهد به لأن:
- ✅ `GPTBot` مسموح في robots.txt
- ✅ Bot prerender يخدم HTML كامل مع structured data
- ✅ JSON-LD Product schema (Anthropic + OpenAI يفضّلونه)
- ✅ كل إعلان له URL ثابت + canonical link
- ✅ Sitemap محدث

---

## 📈 توقعات الـ Traffic

| الوقت من الإطلاق | الأداء المتوقع |
|---|---|
| اليوم 1 | Bing/Yandex يبدؤون فهرسة الإعلانات (عبر IndexNow) |
| الأسبوع 1 | Google يفهرس الصفحة الرئيسية + 50-100 إعلان |
| الشهر 1 | Indexed pages: 500-2000، AI agents يبدؤون الاستشهاد |
| الشهر 3 | Organic traffic ~30% من إجمالي الزيارات |

---

## 🎯 ما يجب فعله الآن (Action Items)

1. ✅ **الكود جاهز** — لا تعديلات مطلوبة
2. 🔴 **يدوي**: سجل الموقع في Search Console + Bing Webmaster (10 دقائق)
3. 🟠 **يدوي**: تحقق من ملف IndexNow:
   ```bash
   curl https://alhraj.online/$(curl -s https://alhrajplus.onrender.com/api/seo/indexnow/key -H "Authorization: Bearer YOUR_TOKEN" | jq -r .key).txt
   ```
4. 🟡 **اختياري**: أضف Privacy Policy + Terms of Service إلى الـ footer
5. 💡 **اختياري**: شارك رابط الموقع على وسائل التواصل لتسريع الـ indexing
