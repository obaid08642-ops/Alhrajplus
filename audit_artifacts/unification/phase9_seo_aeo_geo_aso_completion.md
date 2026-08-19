# المرحلة 9 — توحيد SEO/AEO/GEO/ASO متعدد القنوات

## النتيجة

ثُبّتت حدود القنوات بصورة صحيحة: يظل الزحف و`robots.txt` و`sitemap.xml` وJSON-LD على صفحات Web القابلة للفهرسة، بينما يضمن Mobile أن رابط الإعلان نفسه يفتح التطبيق عند التثبيت أو صفحة Web العامة المطابقة عند عدمه. لا يحاول التطبيق React Native ادعاء أنه سطح قابل للفهرسة، ولا يتضمن `robots` أو sitemap أو JSON-LD وهميًا.

| المجال | Web / Backend | Mobile |
|---|---|---|
| المحتوى متعدد اللغات | ترجمة موثقة مرتبطة بـ`source_hash`، canonical و`hreflang` وsitemap لا تعلن لغة غير مترجمة. | `GET /listings/{id}?lang=` يعيد المحتوى المتاح للغة الجهاز؛ شاشة التفاصيل تعيد التحميل بلا عدّ مشاهدة مكرر. |
| البيانات المنظمة | Product وBreadcrumbList مبنيان من الحقول الظاهرة، مع price وseller وخصائص الفئة عند توفرها فقط. | لا JSON-LD داخل التطبيق؛ يفتح الرابط HTTPS الصفحة نفسها التي تحمل البيانات المنظمة. |
| روابط الإعلان | صفحة `https://alhraj.online/listing/{slug-or-id}` هي canonical. | React Navigation يطابق `listing/:id` ويقبل `alhraj.online` و`www.alhraj.online` و`alhrajplus.com` وscheme `harajplus`. |
| App / Universal Links | استضافة دلالات association عبر HTTPS في `.well-known` بعد ضبط metadata النشر الحقيقية. | `associatedDomains` وAndroid `autoVerify` يعلنان النطاقات نفسها. |
| attribution | Web يحتفظ بمشاركة الرابط وقابلية القياس الحالية. | يرسل التطبيق حدث `screen_view` من فئة `app_deep_link` عند فتح رابط نطاق موثوق، مع المسار ومعرّف الإعلان فقط عندما يكون موجودًا. |
| ASO | لا تُضاف meta tags متجر أو Smart App Banner بمعرّفات مخترعة. | ملف `mobile/store-metadata.json` مصدر مراجعة متعدد اللغات لتسمية ووصف وكلمات المتجر للغات الست. |

## التنفيذ

أضيف `POST /api/listings/discovery-preview` لحساب جاهزية الاكتشاف من حقائق النموذج الحالية فقط؛ لا يكتب إلى MongoDB ولا ينشئ نصًا ولا يستدعي LLM أو محرك بحث. تعرض شاشة النشر في Mobile النتيجة اختيارياً: النتيجة من `0` إلى `100`، الحقول الناقصة، الحقائق المتاحة، وكلمات مستخرجة من العنوان والفئة والموقع والحقول. توضح البطاقة صراحة أنها **لا تضمن ترتيبًا أو فهرسة**.

تستضيف Backend ملفي association عند ضبط متغيرات البيئة العامة التالية. لا توجد قيم افتراضية أو placeholders، ولذلك تعيد المسارات `404` إلى أن تهيأ قيم الإصدار الحقيقية، بدل نشر ملف نجاح مزيف.

| متغير البيئة | القيمة المطلوبة | الغرض |
|---|---|---|
| `ANDROID_APP_LINK_SHA256_CERT_FINGERPRINTS` | بصمات SHA-256 لشهادة الإصدار، مفصولة بفواصل. | إنشاء `/.well-known/assetlinks.json`. |
| `ANDROID_APP_LINK_PACKAGE` | اختياري؛ الافتراضي `com.harajplus.app`. | تطابق package في Android association. |
| `IOS_UNIVERSAL_LINK_APP_IDS` | App IDs بصيغة `TEAMID.com.harajplus.app`، مفصولة بفواصل. | إنشاء `/.well-known/apple-app-site-association`. |

أضيفت rewrites وheaders في `firebase.json` و`vercel.json` كي تخدم الملفات من **نطاق الموقع** بدل نطاق API. لا تعد هذه القيمة إعدادًا كاملاً بمفردها؛ يلزم أن تنشر المنصة هذه التعديلات على المضيف الفعلي لنطاق `alhraj.online`.

> تؤكد إرشادات Google أن deep links لا تغيّر ترتيب صفحة Web؛ يجب أن يعرض التطبيق المحتوى نفسه الذي تشير إليه الصفحة. كما أن data structured تمكن أهلية ظهور غني، ولا تضمنه. [1] [2]

## الاختبارات المنفذة

| بوابة التحقق | النتيجة |
|---|---|
| اختبار عقد SEO/AEO/GEO/ASO الجديد | ناجح — 5 passed؛ يغطي المعاينة غير المخزنة، association الشديد، deep links، attribution، JSON-LD، الاستضافة، metadata اللغات الست. |
| اختبارات SEO والترجمة المرتبطة | ناجح — 22 passed. |
| Android JavaScript bundle | ناجح — 7.27 MB. |
| صحة JSON للتكوينات | ناجح — `firebase.json` و`vercel.json` و`app.json` وmetadata المتجر. |
| حارس التعريب و`git diff --check` | ناجحان. |

## قيود الإطلاق والتحقق المطلوب

نتيجة الفحص الحي قبل التنفيذ كانت أن مساري `.well-known` لا ينشران association صالحًا بعد؛ كانا يجيبان بمحتوى fallback من الاستضافة. لا يمكن إتمام تحقق Android/iOS من دون بصمة شهادة Android وApple Team ID الحقيقيين، ولا ينبغي اختراعهما. بعد نشر Backend وrewrites وضبط المتغيرات، يجب التحقق من كل نطاق معلن بهذه الخطوات:

1. طلب `https://alhraj.online/.well-known/assetlinks.json` والتحقق من HTTP 200 و`application/json` وبصمة شهادة release الفعلية.
2. طلب `https://alhraj.online/.well-known/apple-app-site-association` والتحقق من HTTP 200 وApp ID الفعلي والمسارات المعلنة.
3. تثبيت Android release موقّع واستخدام Android App Links Assistant أو Play Console Deep Links لفحص `listing/{id}`.
4. تثبيت iOS signed build وفحص Universal Links على iPhone، ثم تأكيد fallback إلى Web عند إزالة التطبيق.
5. فتح URL إعلان بلغتين متاحتين ثم مراجعة Analytics وSearch Console؛ لا يُقاس النجاح بادعاء ترتيب، بل بفتح الرابط وظهور المحتوى المطابق ومؤشرات الفهرسة والأداء.

## المراجع

[1] [Google Search Central — App deep links](https://developers.google.com/search/blog/2025/05/app-deep-links)

[2] [Google Search Central — General structured data guidelines](https://developers.google.com/search/docs/appearance/structured-data/sd-policies)

[3] [Google Search Central — Localized page versions](https://developers.google.com/search/docs/specialty/international/localized-versions)

[4] [Google Search Central — Generative AI search guidance](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)
