# ملاحظات SEO وGeo حديثة — 16 أغسطس 2026

توصيات Google الرسمية لا تختزل الظهور في قائمة كلمات مفتاحية. صفحات الإعلان يجب أن تعرض محتوى أصليًا قابلًا للزحف، وتستخدم structured data بما يعكس البيانات المرئية فعليًا، وتُحسن تجربة المستخدم الحقيقية.

## structured data

توصي Google بإضافة Product structured data، وتذكر أن البيانات قد تُستخدم في نتائج أغنى تشمل السعر والتوافر والتقييمات والمعلومات الإضافية، مع إمكانية الجمع بين structured data وMerchant Center feed عند ملاءمة الحالة. بالنسبة لـ Alhrajplus، يجب توليد JSON-LD تلقائيًا من الإعلان المعتمد مع منع القيم الوهمية، وإخراج نوع مختلف حسب vertical: Product للإعلانات العامة، Vehicle أو Product للسيارات وفق البيانات الفعلية، Residence/Offer للعقار، وJobPosting للوظائف فقط عند كون الوظيفة مفتوحة وقابلة للتقديم.

توصي Google لصفحات الوظائف بوضع JobPosting على صفحة الوظيفة المفردة الأكثر تفصيلًا، وليس صفحات نتائج البحث، مع العنوان والوصف وتاريخ النشر والانتهاء والجهة والموقع ونوع العمل والراتب عند توفره. الوظائف عن بعد تحتاج jobLocationType وapplicantLocationRequirements أو jobLocation المناسبين. وعند انتهاء الوظيفة يجب ضبط validThrough أو إرجاع 404/410 أو إزالة structured data، وإبلاغ محركات البحث بسرعة.

## تعدد اللغات والمناطق

توضح Google أن hreflang يجب أن يربط النسخة بنفسها وبكل النسخ البديلة بشكل ثنائي الاتجاه، وأن الروابط تكون كاملة، مع x-default عند الحاجة. يمكن إرسال ذلك في HTML أو HTTP headers أو sitemap؛ لا توجد فائدة عامة من إدارة الطرق الثلاثة معًا إذا كان أحدها مضبوطًا. لذلك يجب أن تكون للإعلان عناوين ثابتة من نوع `/ar/sa/...` و`/en/sa/...` أو بنية مكافئة، مع canonical وhreflang متطابقين، ونسخ مترجمة حقيقية للعنوان والوصف والحقول، لا ترجمة للواجهة فقط.

## الأداء وتجربة الصفحة

توصي Google باستهداف LCP خلال 2.5 ثانية، وINP أقل من 200ms، وCLS أقل من 0.1. يجب قياس هذه المؤشرات من مستخدمين حقيقيين عبر RUM، وليس الاعتماد على build ناجح فقط. يلزم كذلك اختبار الهاتف والشبكات البطيئة والصور الكبيرة والصفحة المفردة وصفحات البحث.

## الخطة التقنية المقترحة لـ Alhrajplus

عند إنشاء الإعلان: تطبيع الحقول، إنشاء عنوان SEO متعدد اللغات من بيانات الإعلان، استخراج كيانات مثل الفئة والعلامة والطراز والمدينة والسعر، إنشاء slug ثابت، إنشاء JSON-LD، إضافة canonical/hreflang، تحديث sitemap وlastmod، وإرسال إشعار indexing مناسب للصفحة الجديدة أو المعدلة. يجب وضع حدود تمنع spam أو تكرار الصفحات الرقيقة، وعدم فهرسة البحث الداخلي والتركيبات منخفضة القيمة. يجب أن تكون صفحة الإعلان قابلة للعرض server-side أو pre-rendered لمحركات البحث، مع صورة og:image وalt text وملخص محلي.

## مراجع Google

[1] [Product structured data](https://developers.google.com/search/docs/appearance/structured-data/product)

[2] [Localized versions and hreflang](https://developers.google.com/search/docs/specialty/international/localized-versions)

[3] [Core Web Vitals](https://developers.google.com/search/docs/appearance/core-web-vitals)

[4] [JobPosting structured data](https://developers.google.com/search/docs/appearance/structured-data/job-posting)
