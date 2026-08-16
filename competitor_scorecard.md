# Alhrajplus مقابل المنافسين — Scorecard واقعي

**طريقة التقييم:** درجة من 10، مبنية على الكود الموجود والتدقيق السابق للمواقع الرسمية. الدرجة تقيس النضج التشغيلي الحالي، لا حجم الفرصة المستقبلية. لا تعني أن المنافس يضمن جودة كل إعلان أو كل شاشة.

| البعد | Alhrajplus الآن | Haraj | Dubizzle UAE | OpenSooq | تفسير الفجوة |
|---|---:|---:|---:|---:|---|
| اتساع الفئات والـ taxonomy | 6.0 | 9.0 | 8.5 | 9.0 | لدينا 23 فئة و118 subcategory و140 field، لكن معظم المنافسين يملكون عمقًا وبيانات وروابط landing أكثر |
| جودة النشر والحقول المتخصصة | 6.5 | 8.0 | 8.5 | 8.0 | السيارات/العقار/الوظائف تحسنت، لكن لا توجد بعد تكاملات VIN/valuation/employer workflow |
| البحث والـ discovery | 5.5 | 8.5 | 9.0 | 8.5 | نحتاج semantic intent search، saved searches أقوى، recommendations قابلة للتفسير |
| الثقة ومكافحة الاحتيال | 5.0 | 8.5 | 8.5 | 8.0 | Trust Graph ما يزال مقترحًا؛ المنافسون لديهم تاريخ وثقة وحجم إشارات أكبر |
| أدوات البائعين والشركات | 4.5 | 7.5 | 9.0 | 9.0 | لا توجد منظومة storefront/agency/lead CRM/promotions بعمق كافٍ |
| العقار | 5.5 | 8.0 | 9.0 | 8.5 | ينقص valuation، agents، projects/off-plan، floor plans، booking، area guides |
| السيارات | 6.0 | 8.0 | 8.5 | 8.0 | ينقص Price Passport، VIN/inspection integrations، price comparison، history |
| الوظائف | 5.5 | 7.5 | 8.5 | 8.5 | ينقص JobPosting lifecycle، employer pages، apply tracking، CV matching |
| الشات والـ realtime | 6.5 | 7.5 | 8.0 | 7.5 | تحسن Redis Pub/Sub والـ delete، لكن delivery/read/offline/multi-device تحتاج إثبات حمل |
| الويب UX/UI | 6.5 | 8.0 | 8.5 | 8.0 | لغة وثيم ودولة وأيقونات Premium تحسنت؛ يلزم polish واختبار conversion طويل |
| تطبيقات Android/iOS/Huawei | 5.5 | 7.5 | 8.5 | 8.5 | Expo export نجح، لكن لا توجد شهادة أجهزة فعلية وpush/deep links/offline لكل منصة |
| SEO/Geo | 5.0 | 8.5 | 8.5 | 8.5 | metadata موجود، لكن multilingual SSR/URLs/hreflang/sitemap segmentation/monitoring غير مكتملة |
| الأداء والتوسع | 4.5 | 8.5 | 8.5 | 8.5 | لا يوجد load test، وRedis مطلوب للإنتاج، والbackend monolith والـ jobs تحتاج فصلًا |
| CRM/Analytics/Admin | 6.0 | 7.5 | 8.5 | 8.5 | CRM موجود مبدئيًا؛ ينقص event pipeline، audit log، bulk jobs، seller/lead intelligence |
| **المتوسط التقريبي** | **5.6** | **8.1** | **8.7** | **8.4** | Alhrajplus في مرحلة pre-production متقدمة وليس parity production بعد |

## ما تم أخذه فعليًا من أفكار السوق

تم تنفيذ أساسيات الفئات المتخصصة للسيارات والعقار والوظائف، المرشحات والفئات الفرعية، البروفايل، المراجعات، المفضلة، المزادات، reels، التنبيهات، CRM/analytics، SEO metadata/JSON-LD/sitemap، الترجمة، الدولة والثيم، WebSocket chat، Redis readiness وPub/Sub، وإعدادات البائع الأساسية.

## ما لم يُنفذ بعد أو لم يُثبت

لم يُنفذ بعمق كافٍ: semantic AI search شبيه Dubizzle، valuation للعقار، Price Passport للسيارات، Trust Graph قابل للتفسير، storefront وagency CRM، saved-search copilot، employer/job lifecycle، booking/lead management، area guides، offline chat queue، delivery/read guarantees، fraud graph، durable jobs، load tests، device matrix، وmultilingual server-rendered SEO.

## خطة التفوق

الطريق الواقعي ليس نسخ كل المنافسين دفعة واحدة؛ الأولوية هي **كتالوج أعمق، بحث عربي دلالي، Trust Graph، Price Passport، seller storefront، وصفحات SEO جغرافية حقيقية، وشات موثوق**. بعد ذلك تأتي vertical workflows للعقار والوظائف، ثم network effects وشراكات الفحص والتمويل والوكالات. التفوق لن يأتي من إضافة زر أو أيقونة منفردة، بل من تقليل وقت الوصول للنتيجة وزيادة الثقة وتحويل الإعلان إلى عملية قابلة للإتمام.
