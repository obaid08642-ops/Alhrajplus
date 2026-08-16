# Alhrajplus Premium — تقرير التدقيق الإنتاجي الموسع

**تاريخ التدقيق:** 16 أغسطس 2026  
**الفرع:** `production-readiness-premium`  
**آخر commit:** `9205dd9`  
**نطاق التدقيق:** الويب، Expo/الموبايل، FastAPI/MongoDB/Redis/WebSocket، الإعدادات، الشات، SEO/Geo، تجربة الاستخدام، واختبارات التشغيل.

## الخلاصة التنفيذية

المشروع تحسن بوضوح وأصبح أقرب إلى نسخة **pre-production قوية** من كونه نموذجًا أوليًا. تم إصلاح عيوب أمنية ومرئية، إضافة حقول متخصصة، CRM وتحليلات، تحسين الترجمة، دعم اكتشاف إعدادات الجهاز، تقوية الشات، إضافة readiness وRedis Pub/Sub اختياريًا، ومنع الشاشة البيضاء الناتجة عن استجابة API غير صالحة.

مع ذلك، **المشروع ليس مثبتًا بعد على مستوى حراج أو دوبزل أو السوق المفتوح، وليس من المهني إعلان قدرته على ملايين المستخدمين قبل اختبار حمل حقيقي على staging**. القوة الحالية هي اتساع الوظائف وتعدد verticals، أما الفجوات الكبيرة فهي عمق taxonomy والـ discovery، الاعتمادية الموزعة، SEO server-side متعدد اللغات، أدوات البائع، الثقة والمعاملات، وغياب اختبار حقيقي على أجهزة iOS/Android/Huawei وبيانات إنتاج معزولة.

## ما تم تنفيذه في هذه الجولة

| المجال | التغيير | حالة التحقق |
|---|---|---|
| لغة الجهاز | الويب وExpo يكتشفان لغة الجهاز عند أول تشغيل، مع أولوية الاختيار المحفوظ والتغيير اليدوي | build/export ناجحان، ويلزم اختبار أجهزة فعلية |
| الثيم | system/light/dark تلقائيًا في الويب والموبايل، مع حفظ اختيار المستخدم؛ أضيف selector صريح في إعدادات الويب | build ناجح |
| الدولة | أولوية المستخدم/GPS/الشبكة ثم locale الجهاز، مع picker يدوي محفوظ | smoke test محلي نجح لمسار الاختيار اليدوي |
| الشاشة البيضاء | تطبيع categories في HomePage وإضافة Error Boundary مرئي | تم اكتشاف العطل فعليًا وإصلاحه، smoke test نجح |
| الشات | حذف الرسالة للمرسل، بث message_deleted، optimistic UI سابق، وRedis Pub/Sub اختياري للتوسع الأفقي | py_compile واختبارات ChatHub المحلية: 2/2 |
| readiness | `/api/health/ready` يفحص Mongo وRedis، وRender يستخدمه بدل sitemap | syntax ناجح؛ يحتاج staging حقيقي |
| الاختبارات | conftest يمنع crash عند غياب متغير URL، واختبارات ChatHub مستقلة بلا خدمات خارجية | collection ناجح، 2/2 ناجحة |
| التوثيق | أبحاث مباشرة لحراج ودوبزل والسوق المفتوح ومراجع Google الرسمية | موثق في ملفات المنافسين وSEO |

## إعدادات الجهاز والاختيار اليدوي

المنطق المطلوب أصبح موجودًا في المستوى الأساسي: أول تشغيل يتبع الجهاز، وبعد تغيير المستخدم يُحفظ الاختيار ولا يُستبدل تلقائيًا. في الثيم، قيمة `system` تبقى محفوظة بدل تحويلها إلى light/dark، لذلك يستمر النظام في متابعة تغيير إعداد الجهاز. في اللغة، يتم حفظ اللغة النهائية وتحديث `lang` و`dir` للـ RTL/LTR. في الدولة، يستخدم التطبيق الكشف المتاح ثم locale كـ fallback، ويظل picker اليدوي أعلى أولوية.

لكن يجب التمييز بين **اكتشاف locale** و**تحديد الدولة الحقيقي**. locale الهاتف قد يكون `en-US` لمستخدم موجود في السعودية، لذلك لا يجب الاعتماد عليه وحده. الإنتاج يحتاج IP geolocation موثوقًا مع موافقة الخصوصية، وGPS اختياريًا، ومؤشر ثقة، وإمكانية رفض التحديد. smoke test المحلي لم يجد backend فظهر picker، وهذا سلوك صحيح في بيئة بلا خدمة Geo وليس دليلًا على فشل production.

## تدقيق المسارات والشاشات والـ workflows

تم جرد مسارات الويب وشاشات Expo، لكن النجاح الحقيقي لكل مسار يتطلب اختبار الأدوار والحالات وليس مجرد وجود الملف. المصفوفة التفصيلية موجودة في `route_matrix_audit.md`.

| مجموعة المسارات | الوظائف الحالية | أهم سيناريوهات لم تثبت بعد باختبار E2E كامل |
|---|---|---|
| الهوية | login/register/reset/verify/social callbacks | انتهاء token، refresh متزامن، بريد غير مؤكد، deep link من iOS/Android/Huawei |
| السوق | home/category/search/map/listing detail | no API، صور تالفة، pagination، country isolation، back/forward، مشاركة رابط crawler |
| البيع | post listing وحقول متخصصة | upload فاشل، استئناف، moderation، duplicate submit، حقول كل vertical على كل جهاز |
| التواصل | chat/conversations/media/typing/read/delete | reconnect، duplicate events، multi-device، فقدان Redis، offline queue، read receipts |
| التجارة/التفاعل | favorites, alerts, auctions, reels, deals, wallet | صلاحيات، race conditions للمزايدات، payment/webhook، انتهاء السعر، moderation |
| الحساب | profile/seller profile/settings/notifications | حذف الحساب، تصدير البيانات، block/report، locale/theme persistence |
| الإدارة | CRM/SEO/users/listings/reports/ads | صلاحيات admin، pagination، bulk actions، audit log، export jobs، load تحت بيانات كبيرة |
| الموبايل | شاشات Home/Search/Post/Chat/Profile/Wallet وغيرها | native permission flows، iOS keyboard/safe area، Android back، Huawei push/map، offline |

**الحكم:** لا توجد حاليًا شهادة بأن كل زر وكل workflow يعمل على iOS وAndroid وHuawei بمختلف الإصدارات والمقاسات. الذي تم إثباته هو source audit، build الويب، Expo web export، وsmoke test للويب المحلي. اختبار الأجهزة الحقيقية وApp Store/Play/AppGallery release QA ما زال مطلوبًا.

## المقارنة الدقيقة مع المنافسين

تم فحص الصفحات الرسمية مباشرة، وليس الاعتماد على انطباع عام. التفاصيل المصدرية محفوظة في `competitor_haraj_findings.md` و`competitor_dubizzle_findings.md` و`competitor_opensooq_findings.md`.

| البعد | Alhrajplus الحالي | حراج | دوبزل UAE | OpenSooq | الفجوة ذات الأولوية |
|---|---|---|---|---|---|
| taxonomy | فئات وحقول متخصصة بدأت في الزيادة | taxonomy عميق جدًا وروابط علامات/أنواع ومدن، يشمل سيارات وعقار وخدمات ووظائف وفئات كثيرة | تقسيم Motors/Property/Jobs/Classifieds مع فئات فرعية واضحة | أكثر من 120 فئة فرعية وفق الصفحة الرسمية | بناء taxonomy مركزي versioned مع landing pages لكل category/brand/city |
| discovery | بحث ومرشحات تقليدية مع مؤشرات AI جزئية | تصفح سريع ومرشحات جغرافية وعلامات | AI search بلغة طبيعية ظاهر في الواجهة | saved searches ومرشحات وإشعارات | semantic search عربي/إنجليزي، فهم السعر والموقع والنية |
| السيارات | حقول وفحص/حوادث أضيفت | علامات، موديلات، قطع، شاحنات، مصابة، كلاسيكية، تنازل/تأجير | used/new/rental/export cars | Autos كقطاع رئيسي واسع | price passport، VIN/inspection integrations، مقارنة سيارات وتنبيهات |
| العقار | حقول عقار، virtual tour بدأت | أراضٍ، شقق، فلل، محلات، مزارع، شاليهات، مدن كثيرة | TruEstimate، agents/agencies، holiday homes، new projects، off-plan | قطاع عقار إقليمي واسع | valuation، agent CRM، floor plans، mortgage/rent calculators، booking |
| الوظائف | حقول وظائف وremote/verified company | فئة وظائف قابلة للتصفح | تخصصات وظيفية كثيرة | Recruitment كقطاع رئيسي | JobPosting lifecycle، apply tracking، employer pages، CV matching |
| الثقة | moderation، ratings، Trust Graph مقترح | شبكة سوق كبيرة وثقة متراكمة | verification واضح ومعلن | متابعة بائعين وإحصاءات وتواصل متعدد | verification levels، seller reliability، fraud signals، dispute/report workflow |
| البائع التجاري | profile وإعلانات | حضور سوق قوي | agents/agencies وميزات property partners | dedicated online shop، account managers، stats، promotion، video reel | seller storefront، analytics، lead inbox، campaigns، reels |
| التواصل | WebSocket وتحسينات realtime وdelete/reactions | معيار السوق العام | Chats وsaved searches وbookings | call/chat وإشعارات | Redis production، offline queue، delivery/read guarantees، multi-device presence |
| المنصات والدول | ويب وExpo مع دعم اتجاهات ولغات | السعودية أساسًا | الإمارات مع مدن ودول مرتبطة | 20 سوقًا وiOS/Android/Huawei وفق الصفحة | country rollout model، currency/tax/local policy، regional SEO |
| SEO | meta وJSON-LD وsitemap وIndexNow موجودة | صفحات taxonomy قابلة للفهرسة | روابط مدن وفئات وخدمات قرار | Area Guide ومسارات دول ولغات | server rendering حقيقي، hreflang صحيح، sitemap index، lifecycle indexing |

### ما الذي يتفوقون به علينا حتى الآن؟

يتفوق المنافسون حاليًا في **الثقة المتراكمة، كثافة البيانات الحقيقية، عمق التصنيفات، حجم العرض والطلب، SEO التاريخي، أدوات البائع التجارية، والاختبار التشغيلي طويل المدى**. دوبزل يتقدم في AI search وTruEstimate والوكلاء وHoliday Homes وBookings. OpenSooq يتقدم في الانتشار الإقليمي، المتجر للبائع، Account Managers، إحصاءات leads، saved searches، follow seller وvideo reel. حراج يتقدم في كثافة taxonomy السعودية والروابط الجغرافية والانتقال السريع بين العلامات والفئات.

هذا لا يعني أن Alhrajplus ضعيف؛ لديه فرصة تميز في **سوق خليجي موحد متعدد الدول، Trust Graph، Price Passport، بحث عربي دلالي، محادثة فورية ممتازة، وإنشاء إعلان ذكي يختلف حقله حسب القطاع**. لكن هذه فرصة roadmap وليست تفوقًا مثبتًا اليوم.

## SEO وGeo الحديث

الجزء الحالي يحتوي على meta tags وOpen Graph وJSON-LD وsitemap وIndexNow، لكنه لا يزال يحتاج تغييرات جوهرية كي يطابق أحدث الممارسات. استخدام `?lang=ar` و`?lang=en` على نفس صفحة SPA ليس ترجمة مستقلة كافية، وHelmet client-side وحده لا يضمن أن crawler غير JavaScript يرى المحتوى. كما أن `keywords` meta القديمة ليست محرك الترتيب الأساسي.

وفق Google Search Central، يجب أن تكون النسخ المحلية ذات URLs كاملة، وتربط كل نسخة بنفسها وبالنسخ الأخرى عبر hreflang ثنائي الاتجاه، ويمكن إدارتها في HTML أو HTTP headers أو sitemap. كما يجب وضع structured data في صفحة الإعلان المفردة الأكثر تفصيلًا، مع استخدام `JobPosting` للوظائف المفتوحة فقط وتحديث `validThrough` أو إزالة الصفحة عند انتهاء الوظيفة. وتظل Core Web Vitals أهدافًا مهمة: LCP أقل من 2.5 ثانية، INP أقل من 200ms، CLS أقل من 0.1.

| المرحلة | الأتمتة المطلوبة عند نشر/تعديل الإعلان |
|---|---|
| 1 | تطبيع الاسم والوصف والسعر والعملة والفئة والمدينة والحي والإحداثيات والمواصفات |
| 2 | إنشاء slug ثابت وغير متغير، مع redirect من slug القديم |
| 3 | إنشاء title/description عربية وإنجليزية حقيقية؛ AI translation يجب أن يكون queueable مع مراجعة أو fallback واضح، وليس ترجمة وهمية |
| 4 | استخراج entities: category, make, model, year, city, neighborhood, price band, condition, remote status |
| 5 | توليد JSON-LD حسب vertical مع مطابقة ما يظهر للمستخدم، ومنع الحقول الوهمية |
| 6 | توليد canonical وhreflang ثنائي الاتجاه وx-default لنسخ URL فعلية، وليس query params وهمية |
| 7 | تحديث sitemap index وملف segment مناسب، مع lastmod، image، وrobots policy |
| 8 | إرسال IndexNow للصفحات الجديدة/المعدلة/المحذوفة، واستخدام Google Indexing API للوظائف وفق الأهلية والسياسات |
| 9 | إنشاء social preview وalt text وOG image، وتحسين الصور WebP/AVIF وlazy loading |
| 10 | مراقبة Search Console، crawl errors، coverage، CTR، Core Web Vitals، schema validation، وspam/duplicate pages |

**ملاحظة:** لا يمكن ضمان الظهور في المركز الأول؛ الخوارزميات لا تمنح ترتيبًا مضمونًا. أفضل استراتيجية هي محتوى أصلي عالي الجودة، صفحات قابلة للزحف، بيانات منظمة صحيحة، سرعة، روابط داخلية، ثقة، وبيانات استخدام حقيقية.

المراجع: [Product structured data](https://developers.google.com/search/docs/appearance/structured-data/product)، [Localized versions/hreflang](https://developers.google.com/search/docs/specialty/international/localized-versions)، [Core Web Vitals](https://developers.google.com/search/docs/appearance/core-web-vitals)، [JobPosting](https://developers.google.com/search/docs/appearance/structured-data/job-posting).

## قابلية ملايين الزوار والمستخدمين

الـ build والـ async FastAPI لا يثبتان تحمل ملايين المستخدمين. النظام الحالي مناسب للتوسع التدريجي بعد استكمال البنية، لكنه ليس benchmarked على ذلك. تم تحسين ChatHub ليستخدم Redis Pub/Sub عند توفر `REDIS_URL`، لكن Render يجب أن يحصل على Redis مدار فعليًا، ويلزم اختبار worker/instance متعدد.

| طبقة | وضعها الحالي | المطلوب للملايين |
|---|---|---|
| CDN/صور | Cloudinary وfrontend hosting | CDN مضبوط، cache headers، image transformations، regional delivery |
| API | FastAPI monolithic، cache وrate limit جزئيان | فصل routers/services، autoscaling، timeouts، circuit breakers، tracing |
| MongoDB | Motor وفهارس موجودة | replica set/cluster، explain plans، read preference، archive/TTL، pagination |
| Redis | cache موجود وPub/Sub للشات اختياري | managed HA Redis، distributed rate limit، presence/session strategy |
| WebSocket | local + Redis Pub/Sub | load test connections، reconnect، backpressure، queue/delivery semantics |
| jobs | `asyncio.create_task` في عدة flows | durable queue مثل Celery/RQ/Cloud Tasks، retry، deduplication، dead-letter |
| sitemap | حتى 50,000 سجل في الذاكرة | sitemap index وsegments cursor-based للمخزون الضخم |
| analytics | custom privacy-conscious endpoints | event pipeline، retention، aggregation، export jobs، sampling |
| observability | metrics داخل العملية | Prometheus/OpenTelemetry، logs مركزة، alerting، SLOs، error tracking |

**الحكم الواقعي:** لا أستطيع القول إن النسخة الحالية تتحمل ملايين المستخدمين معًا. يمكن تجهيزها لذلك، لكن يجب إثباتها باختبار حمل على staging: 10k/50k/100k concurrent HTTP، WebSocket connections، read/write mix واقعي، upload bursts، search bursts، ومزايدات متزامنة، مع قياس p50/p95/p99، error rate، Mongo locks/CPU/IO, Redis memory/latency، queue lag، وعمليات autoscaling.

## الميزات المقترحة التي ترفع المشروع فوق المنافسين

| الميزة | القيمة للمستخدم | المتطلبات |
|---|---|---|
| Trust Graph | درجة موثوقية تشرح لماذا ارتفعت أو انخفضت، لا رقم غامض فقط | verification، معاملات مكتملة، reports، anti-gaming، privacy |
| Price Passport | تاريخ سعر الإعلان وتغييره ونطاق السوق وسبب التغير | snapshots، currency normalization، category models، منع التلاعب |
| AI Intent Search | «أريد Camry أقل من 80 ألف في الرياض» يتحول إلى filters | Arabic/English NLP، query parser، semantic retrieval، explainability |
| Seller Storefront | صفحة متجر احترافية للبائع والوكالة مع catalog وanalytics | roles، branding، subscriptions، moderation |
| Saved Search Copilot | تنبيهات ذكية لا ترسل spam وتلخص الجديد | notification preferences، dedupe، queue، digest |
| Listing Health Score | يخبر البائع ما ينقص الإعلان لرفع التحويل | completeness، image quality، price sanity، SEO validation |
| Safe Deal Flow | حجز/موعد/اتفاق وتوثيق تسليم دون الادعاء بحماية مالية قبل المتطلبات القانونية | booking state machine، dispute، audit، payment/compliance review |
| Vertical workspaces | workspace خاص للسيارات والعقار والوظائف بدل نموذج عام | taxonomy versioning، forms، search facets، schema |
| AI moderation + fraud graph | كشف إعادة نشر الصور/النص والأنماط الاحتيالية | perceptual hash، graph signals، human review |
| Offline-first chat | إرسال pending واستعادة عند عودة الشبكة | local queue، idempotency keys، server acknowledgements |

## قائمة الإطلاق المطلوبة

لا تنفذ deploy إلى production قبل توفير `REDIS_URL` مدار، Mongo production مع backup/restore مجرب، secrets غير افتراضية، staging database منفصلة، cleanup معتمد لبيانات `TEST_` وdemo، عقد إعلان موحد `image/iframe`، smoke tests للـ readiness، E2E للهوية والنشر والشات والإعلانات والمزايدات والإدارة، اختبارات iOS/Android/Huawei على أجهزة أو emulators مدعومة، وload test موثق.

## حالة الاختبارات الحالية

| الاختبار | النتيجة |
|---|---|
| Python compile لـ server.py وchat_hub.py | ناجح |
| `git diff --check` | ناجح في الجولة السابقة والحالية قبل commits |
| Web `CI=true npm run build` | ناجح بعد آخر تعديل |
| Expo web export | ناجح بعد آخر تعديل |
| ChatHub unit tests | 2 ناجحة |
| targeted network suite | 8 ناجحة، 9 skipped، 21 failed، 8 errors عند غياب backend/staging؛ لا تُعد نتيجة production |
| Web runtime smoke | فشل أولًا بشاشة بيضاء، تم تشخيصه وإصلاحه، ثم نجح في إظهار الصفحة وحالة no-results والـ country picker |
| أجهزة iOS/Android/Huawei فعلية | لم تُثبت في هذه البيئة |
| ملايين concurrent users | لم يُثبت load test |

## القرار النهائي

**الحالة: Pre-production / staging candidate، وليست production-ready نهائيًا بعد.** التعديلات الحالية آمنة للرفع إلى branch المراجعة ثم إلى staging، وليست سببًا لعمل deploy مباشر على الإنتاج قبل تجهيز Redis وMongo staging واختبار workflows. بعد إغلاق القائمة السابقة وإعادة تشغيل load/E2E/device matrix يمكن إصدار قرار production رسمي بثقة.

## جرد الكتالوج والأيقونات — تحديث 16 أغسطس 2026

التحليل البرمجي المباشر لـ`backend/seed_data.py` وجد **23 فئة رئيسية، 118 subcategory، 140 field، منها 82 select و38 text/url**. كل الفئات الرئيسية الحالية تملك اسم icon قابلًا للحل في Lucide، لكن ذلك لا يعني أن التجربة كانت Premium: كان هناك تكرار دلالي، ولم تكن للـ subcategories registry مستقل أو vector خاص بها، كما أن الفئات الجديدة قد تعرض fallback عامًا.

تمت إضافة `frontend/src/lib/categoryIcons.js` و`mobile/src/categoryIcons.js` مع semantic registry للفئات والـ subcategories، وربط HomePage وCategoryPage في الويب وHomeScreen في Expo. كل عنصر يملك fallback vector مضمونًا، وأضيفت قواعد CSS للحركة والمحاذاة. نجح `CI=true npm run build` و`npx expo export --platform web` بعد الإضافة.

| المقياس | قبل الجولة | بعد الجولة |
|---|---:|---:|
| الفئات الرئيسية في seed | 23 | 23 |
| subcategories في seed | 118 | 118 |
| الأيقونات الرئيسية القابلة للحل | موجودة لكن generic/مكررة أحيانًا | registry دلالي Premium |
| subcategory vectors | غير موحدة/غير موجودة | registry للويب، وأساس موحد للموبايل |
| fallback عند category جديدة | غير مضمون بصريًا | `CircleDotDashed/CircleDot` مضمون |

## متطلبات API وEnvironment وRedis

### المتغيرات الأساسية المطلوبة للإنتاج

| المتغير | الاستخدام | إلزامي؟ |
|---|---|---|
| `MONGO_URL` | اتصال MongoDB production | نعم |
| `DB_NAME` | اسم قاعدة البيانات | نعم |
| `JWT_SECRET` | توقيع الجلسات والتوكنات | نعم، قوي وفريد |
| `ADMIN_EMAIL` و`ADMIN_PASSWORD` | إدارة أولية | نعم، كلمة قوية غير افتراضية |
| `REDIS_URL` | cache مشترك، rate-limit المستقبلي، WebSocket Pub/Sub | نعم عند أكثر من instance |
| `FRONTEND_URL` و`CORS_ORIGINS`/`CORS_ORIGIN_REGEX` | CORS والروابط | نعم |
| `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET` | رفع وتحويل الصور والفيديو | نعم للوسائط |
| `RESEND_API_KEY` و`RESEND_FROM` أو `SENDER_EMAIL` | البريد والتحقق والتنبيهات | مطلوب لتدفق البريد |
| `CRON_SECRET` | حماية jobs والعمليات المجدولة | نعم إذا jobs مفعلة |
| `VAPID_PUBLIC_KEY` و`VAPID_PRIVATE_KEY` و`VAPID_CLAIM_EMAIL` | Web Push | مطلوب للإشعارات الويب |
| `GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI` | Google OAuth | اختياري حسب تفعيل الدخول |
| `APPLE_*` | Apple Sign-In | اختياري حسب iOS OAuth |
| `X_CLIENT_ID/SECRET` و`SNAPCHAT_CLIENT_ID/SECRET` | Social OAuth | اختياري |
| `GEMINI_API_KEY` أو `EMERGENT_LLM_KEY` | AI features/SEO suggestions | مطلوب فقط عند تفعيل AI |
| `GOOGLE_INDEXING_SA_JSON` أو مسار service account | Google Indexing API وفق الأهلية | اختياري، يحتاج مراجعة صلاحيات |
| `BACKEND_PUBLIC_URL` | روابط server-side/webhooks/SEO | مطلوب للروابط الكاملة |
| `REACT_APP_BACKEND_URL` | build-time web API | نعم للـ build إلا إذا استُخدم `public/config.js` |
| `EXPO_PUBLIC_BACKEND_URL` | mobile API | نعم لتطبيق Expo |
| `REACT_APP_PLAYSTORE_URL/APPSTORE_URL/APPGALLERY_URL` | روابط المتاجر | مطلوب قبل النشر العام |

### أي Redis نحتاج؟

المطلوب ليس Redis محليًا داخل نفس process أو container؛ المطلوب **Managed Redis** خارجي عالي التوافر، مثل Redis Cloud أو Upstash أو AWS ElastiCache/MemoryDB. يجب وضع URI في `REDIS_URL` مع TLS عند مزود الخدمة، وACL/password، وحدود اتصال، ومراقبة memory/evictions/latency. Render starter الحالي `0.5 CPU / 512 MB` مناسب للتجربة أو staging فقط، وليس وعدًا بملايين المستخدمين.

يستخدم Redis حاليًا للكاش المشترك، وChatHub يستخدم Redis Pub/Sub للتوزيع بين instances. لكن Pub/Sub ليس message queue durable: الرسالة المنشورة أثناء انقطاع subscriber لا تُعاد تلقائيًا. لذلك يجب إضافة queue durable مثل Redis Streams أو خدمة jobs موثوقة لأعمال SEO، الإشعارات، media processing، وretry، مع idempotency وdead-letter.

### ما ينقص API قبل deploy واسع

ينقص توحيد API contracts بإصدارات واضحة، pagination cursor-based بدل الصفحات الثقيلة، rate limit موزع عبر Redis بدل ذاكرة العملية، idempotency للنشر والرفع والمزايدات، request correlation IDs، OpenTelemetry، timeouts وcircuit breakers للتكاملات الخارجية، background queue durable، endpoint metrics/SLO، وcontract tests بين web/mobile/backend. كما يجب ألا يُعلن readiness نجاحًا إذا كان Redis أو Mongo غير متاحين في وضع production.

## التقييم الرقمي

التقييم التفصيلي المحدث موجود في `competitor_scorecard.md`. المتوسط الواقعي الحالي: **Alhrajplus 5.6/10، Haraj 8.1/10، Dubizzle UAE 8.7/10، OpenSooq 8.4/10**. هذه ليست نتيجة شكلية؛ أكبر خصم لدينا في الثقة وحجم العرض والطلب وأدوات الشركات وSEO والتوسع المثبت. بعد تنفيذ semantic search وTrust Graph وPrice Passport وseller storefront وSEO server-side وload/device QA يمكن استهداف 7.5–8.2 في verticals محددة قبل محاولة منافسة الحجم العام.
