# تقرير التحقق الإنتاجي: GEO وSEO وAEO وقابلية فهرسة الحراج بلس

**التاريخ:** 2026-08-23  
**النطاق العام النهائي:** `https://www.alhraj.online`  
**إصدار GEO الأساسي:** `44e0b69b8f1276fed6940eebf635e804d19b194e`  
**تصحيح canonical الإنتاجي:** `2803180bdc29c05d18e9966f6d3706fa01d80674`

## النتيجة التنفيذية

تم نشر وتنفيذ مسار الفهرسة والاكتشاف العام للإعلانات وصفحات الفئات على الإنتاج. كل إعلان **عام، نشط، ومقبول** يدخل في sitemap الديناميكي باستخدام رابط slug قانوني، وصفحات الفئات غير الفارغة تقدم محتوى HTML قابلًا للزحف وMarkdown منظمًا للوكلاء. يعتمد النطاق القانوني الآن على `www.alhraj.online` في sitemap وrobots وcanonical وJSON-LD وروابط IndexNow؛ وبذلك لا تعلن المنصة محركات البحث عن عنوان apex الذي يعيد التوجيه.

> لا يضمن هذا التنفيذ ترتيبًا أولًا أو سرعة فهرسة محددة؛ قرار الزحف والفهرسة والعرض في نتائج ومحركات الإجابة يبقى قرارًا لكل محرك. لا يوجد schema أو meta tag خاص بالذكاء الاصطناعي يضمن الظهور. تعتمد ميزات Google المدعومة بالذكاء الاصطناعي على أساسيات SEO المعتادة، وصفحات قابلة للفهرسة ومحتوى مفيد وبيانات منظمة متطابقة مع المحتوى الظاهر. [1]

| مجال التحقق | الحالة | الدليل أو الأثر |
| --- | --- | --- |
| صحة Backend | **ناجح** | `GET https://alhrajplus.onrender.com/api/health/ready` أعاد `mongo: ok` و`redis: on`. |
| sitemap index العام | **ناجح** | `GET https://www.alhraj.online/sitemap.xml` أعاد `200` و`application/xml` و`<sitemapindex>`. |
| تقسيم sitemap | **ناجح** | الفهرس يحيل إلى `/sitemaps/static.xml` و`/sitemaps/listings/1.xml` على نطاق `www`. |
| روابط الصفحات الثابتة والفئات | **ناجح** | sitemap الثابت يستخدم روابط `https://www.alhraj.online/...` ويضم فئات ذات مخزون عام فقط. |
| روابط الإعلانات | **ناجح** | sitemap الإعلانات يعرض روابط slug العامة على نطاق `www`، وظهر في العينة 14 رابطًا عامًا. |
| صفحة إعلان للزاحف | **ناجح** | عينة إعلان أعادت `200`، وcanonical مباشرًا على `www`، وJSON-LD و`BreadcrumbList`. |
| صفحة فئة للزاحف/الوكيل | **ناجح سابقًا** | فئة السيارات أعادت `200` و`CollectionPage` و`ItemList` للزاحف، وMarkdown منظمًا عند `Accept: text/markdown`. |
| robots.txt | **ناجح** | طلب `HEAD` أعاد `200` والملف يعلن `Sitemap: https://www.alhraj.online/sitemap.xml`. |
| طابور IndexNow | **منفذ ومختبر بالعقود** | outbox دائم في MongoDB، وإعادة محاولة/backoff وflush محدود في المراقبة؛ لم تُنشأ بيانات إنتاجية فقط لاختبار إرسال جديد. |
| Google Search Console وBing | **مؤجل بطلب المالك** | لم يتم تسجيل الدخول أو ربط حسابات خارجية في هذه المرحلة. |

## ما أصبح آليًا عند دورة حياة الإعلان

عند نشر الإعلان أو تحديثه أو إخفائه أو حذفه، تستخدم المنصة الرابط القانوني المعتمد على slug وتبطل cache الخاصة بـsitemap. تتلقى محركات البحث خريطة الموقع المحدثة عند الزحف التالي، ويُسجل عنوان الإعلان في طابور IndexNow الدائم للمحركات المشاركة. لا يوقف إرسال التنبيه المستخدم ولا يحول النشر إلى عملية متزامنة هشة؛ تبقى الإعادة والمراقبة على الخادم.

| حالة الإعلان | أثر قابلية الفهرسة | الإشارة التلقائية |
| --- | --- | --- |
| منشور، عام، نشط، ومقبول | يدخل sitemap الإعلانات ويمتلك صفحة زاحف canonical وبيانات منظمة حقيقية | إدراج URL في IndexNow outbox. |
| تعديل محتوى أو slug | يتجدد الرابط القانوني وتُبطل cache | إرسال الرابط الجديد، ومعالجة الرابط السابق عند تغير slug. |
| إخفاء أو حذف أو خروج من الحالة العامة | لا يبقى كصفحة عامة صالحة للفهرسة | إرسال إشارة إزالة للمحركات المشاركة؛ يبقى المحرك صاحب القرار النهائي في الاستبعاد. |
| فئة بلا إعلانات عامة | لا تنشأ لها صفحة hub ضعيفة ولا تدخل sitemap الثابت | لا يوجد أثر فهرسة مصطنع. |

لم يُستخدم Google Indexing API للإعلانات السوقية؛ فالواجهة الرسمية لهذا API مخصصة لإشعارات `JobPosting` و`BroadcastEvent` المباشر، وليس لإعلانات السوق العامة. المسار الصحيح هنا هو sitemap والروابط الداخلية وأدوات المشرفين عند توافر الحساب. [2]

## التحقق الحي بعد النشر

أُجري التحقق النهائي في **2026-08-23T09:43:01Z** دون إنشاء إعلان أو تعديل بيانات إنتاجية. كان مسار الطلب هو النطاق العام عبر Vercel ثم Backend المنشور، وليس فحصًا محليًا.

| الاختبار الحي | النتيجة الفعلية |
| --- | --- |
| `/api/health/ready` على Backend | `{"status":"ready","checks":{"mongo":"ok","redis":"on"}}` |
| `/sitemap.xml` على النطاق العام | `200`، `application/xml`، وsitemap index بروابط `www`. |
| `/sitemaps/static.xml` | روابط الصفحات الثابتة والفئات على `www`. |
| `/sitemaps/listings/1.xml` | روابط إعلانات عامة على `www` باستخدام slug. |
| `/listing/ayfwn-2881db` مع User-Agent زاحف | `200`، `rel="canonical" href="https://www.alhraj.online/listing/ayfwn-2881db"`، وJSON-LD وBreadcrumb. |
| `/robots.txt` | يعلن sitemap النهائي على `www`. |

تحتفظ ملفات الأدلة الخام بالطلبات والاستجابات المختصرة في:

- `audit_artifacts/agent_readiness/geo_live_verification_2026-08-23.txt`
- `audit_artifacts/agent_readiness/geo_live_deep_verification_2026-08-23.txt`
- `audit_artifacts/agent_readiness/canonical_production_verification_2026-08-23.txt`

## اختبار الكود وضمانات الانحدار

بعد تصحيح النطاق القانوني، نفذت الحزمة المستهدفة التالية بنجاح: 

```text
pytest -q tests/test_geo_sitemap_contract.py \
  tests/test_phase10_seo_model_unit.py \
  tests/test_agent_discovery_contract.py

27 passed
```

تغطي الاختبارات sitemap index وصفحات الإعلانات والفئات وروابط slug وcanonical وschema وrobots وسلوك IndexNow وعقود Agent Discovery. لم تُعرض نتيجة suite كاملة باعتبارها نجاحًا؛ فهناك اختبارات تكامل تاريخية تعتمد على بيانات وخدمات منفصلة ولا تمثل بوابة موثوقة لهذا الإصدار المحدد.

## العلاقة بين Web وMobile

قابلية الفهرسة العامة تتحقق بواسطة صفحات Web القابلة للزحف وsitemap وrobots، لأن متصفحات ومحركات البحث تفهرس URLs الويب. تطبيق الهاتف لا ينشئ sitemap منفصلًا ولا يجب أن يفعل ذلك؛ بل يشارك عقد الإعلان وslug وروابط deep link وواجهة تقييم جاهزية الظهور قبل النشر. كما أن عقد أخطاء API المركزي في Mobile يعالج حالات المصادقة والتحقق والحدود والشبكة والخادم، ولا يتضمن أي checkout أو token دفع صوري.

## الحدود والتأجيلات الصريحة

| بند | الحالة | سبب التأجيل أو الحد |
| --- | --- | --- |
| تسجيل sitemap في Google Search Console | مؤجل | يتطلب جلسة حساب مالك؛ طُلب تجاوز أي تسجيل دخول خارجي الآن. |
| تسجيل sitemap في Bing Webmaster Tools وAI Performance | مؤجل | يتطلب حساب مالك خارجي. |
| اختبار إرسال IndexNow حيًا | مؤجل | يتطلب إنشاء أو تعديل إعلان حقيقي أو تنفيذ إجراء Admin؛ لم يُجرَ أي تغيير إنتاجي صناعي. |
| OAuth العملي وتسجيل الوكلاء | مؤجل | لا يوجد مزود هوية مُعتمد؛ تظل metadata صادقة وتعلن عدم توفر التسجيل. |
| DNS-AID وDNSSEC | مؤجل صراحة | لا تغيير على DNS أو nameservers، ولا انتقال إلى Cloudflare. |

تنفيذ IndexNow لا يعني أن كل محرك زحف أو فهرس URL؛ هو إشعار للمحركات المشاركة عند الإضافة والتحديث والحذف، ويشترط بقاء URL متاحًا وخدمة مفتاح الملكية من نفس المضيف. [3]

## الخطوة التالية عند رفع التأجيل

عند السماح بتسجيل الدخول الخارجي، تكون الخطوة الوحيدة المطلوبة في Google Search Console هي فتح property الصحيحة للمجال وإضافة `https://www.alhraj.online/sitemap.xml`، ثم مراجعة تقارير sitemap وPage indexing وURL Inspection لعينة من إعلان جديد. وفي Bing Webmaster Tools يضاف العنوان نفسه ثم تراجع تقارير الزحف وAI Performance إن كانت متاحة للحساب. هذه العملية تقيس ما رآه المحرك فعلًا ولا تستبدل الأساس الفني المنشور في هذا التقرير.

## المراجع

[1]: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide "Google Search Central — AI features and your website"
[2]: https://developers.google.com/search/apis/indexing-api/v3/quickstart "Google Indexing API Quickstart"
[3]: https://www.indexnow.org/documentation "IndexNow Documentation"
