# مصفوفة متطلبات Pasted_content_12

## نطاق المستخدم المباشر

| المعرّف | المتطلب | Web | React Native | Backend/Staging | معيار القبول |
|---|---|---:|---:|---:|---|
| R01 | إزالة كل mock/demo/stale data من الواجهات والصفحات والـfallbacks غير المقبولة | نعم | نعم | نعم | لا توجد بيانات تجريبية معروضة؛ كل قائمة تأتي من API أو حالة empty واضحة |
| R02 | توحيد لون الشريط السفلي مع primary الحقيقي للمنتج | نعم | نعم | نعم | TopBar، BottomNav، Floating/Standalone TabBar، FAB والحالات النشطة تستخدم design tokens نفسها |
| R03 | إصلاح شاشة المزادات العامة | نعم | نعم | نعم | تحميل حقيقي، loading/error/empty، فلاتر وحالات bidding فعالة، أزرار قابلة للاختبار |
| R04 | إصلاح صفحة تفاصيل المزاد والإعلان | نعم | نعم | نعم | الصور، السعر الحالي، الحد الأدنى للزيادة، انتهاء المزاد، سجل المزايدات، bid/counter flows حقيقية |
| R05 | إصلاح صفحة القصص/الفيديوهات | نعم | نعم | نعم | فيديو حقيقي، mute/play، انتقال سلس، back/close واضح، حالات عدم وجود محتوى، عدم وجود emoji بديل |
| R06 | تحسين بطاقات الإعلانات | نعم | نعم | نعم | carousel/snap أو swipe سلس، auto-advance مضبوط، dots، فتح التفاصيل، لا يتعطل favorite |
| R07 | تجهيز تحميل التطبيق للـApp Store وGoogle Play وAppGallery | نعم | نعم | نعم | أزرار مرتبطة بمتغيرات بيئة موثقة، لا placeholder links، disabled state واضح عند غياب الرابط |
| R08 | ضبط كل UI/UX لصفحة الإعلان والمنتج | نعم | نعم | نعم | hierarchy، actions، seller profile، reviews، views، favorites، comments، share/call/chat، responsive |
| R09 | اختيار الدولة الافتراضي السعودية عند تعذر التعرف | نعم | نعم | نعم | fallback = SA، auto-detection لا يستبدل اختيار المستخدم، profile switch persists and syncs |
| R10 | استكمال الترجمات لكل النصوص | نعم | نعم | جزئي | لا نصوص عربية ثابتة في مسارات اللغات الأخرى؛ كل labels/buttons/empty/errors/dates مترجمة |
| R11 | إصلاح profile: ads count/status/phone visibility | نعم | نعم | نعم | الأعداد حقيقية، status واضح، phone show/hide/edit يعمل، validation وpermissions صحيحة |
| R12 | تحويل emoji والرموز العادية إلى Vector/Premium icons | نعم | نعم | جزئي | inventory شامل لكل emoji في source؛ استبدالها بـLucide/SVG أو مكوّن vector موحد |
| R13 | تصحيح hero headline: Sell/Buy/Rent/Hire والعربية | نعم | نعم | لا | نص حقيقي قابل للترجمة، لا حروف مشوهة أو AI-looking، typography صحيحة |
| R14 | ضبط TopBar والمقاسات والـsafe areas | نعم | نعم | لا | لا قص/overflow في الأجهزة الصغيرة والكبيرة، notch/status bar، RTL/LTR، keyboard/scroll |
| R15 | إصلاح Deals/صفقات اليوم وربطها بالبيانات الحقيقية | نعم | نعم | نعم | endpoint حقيقي، لا mock cards، حالات loading/error/empty، السعر والخصم محسوبان من المصدر |
| R16 | إصلاح الصفحة الرئيسية والـhome data | نعم | نعم | نعم | أقسام حقيقية، pagination/perf، cards، hero، category strips، no stale demo |
| R17 | إصلاح حجز الطيران | نعم | نعم | نعم | UI واضح، حقول/validation، API أو empty state صريح، عدم عرض CTA وهمي |
| R18 | إصلاح واجهة المحادثات العامة | نعم | نعم | نعم | قائمة حقيقية، unread، online/last seen، avatar، search، navigation، no truncated “متصل عبر” |
| R19 | إصلاح chat thread بالكامل | نعم | نعم | نعم | WebSocket/reconnect، send/read/typing/media/voice، push deep-link، بدون reload |
| R20 | اختبار شامل بعد التنفيذ | نعم | نعم | نعم | build، lint/type/syntax، API smoke، auth/private flows، responsive matrix، regression |
| R21 | staging على Render الحقيقي | نعم | نعم | نعم | health/db/theme/categories/listings + authenticated checks + Redis/Cloudinary/push where credentials permit |
| R22 | GitHub main والتقرير | نعم | نعم | نعم | latest verified commit on origin/main، changelog، env matrix، known limitations |

## قواعد التنفيذ

1. لا تُعتبر الميزة مكتملة بوجود UI فقط؛ يجب إثبات endpoint، الحالة الفارغة، الخطأ، التحميل، RTL/LTR، Web/Mobile، ثم اختبارها.
2. لا تُحذف seed definitions الخاصة بالفئات والحقول دون تمييزها عن demo listings؛ الممنوع هو بيانات marketplace الوهمية في الإنتاج.
3. لا تُضاف روابط متاجر أو API وهمية. القيم تكون Environment Variables موثقة، وحالة عدم وجودها تكون واضحة وغير مضللة.
4. الدولة الافتراضية عند فشل الكشف هي SA، بينما اختيار المستخدم اليدوي هو المصدر الأعلى أولوية.
5. أي emoji أو رمز موجود في الواجهة يجب أن يدخل inventory ويُستبدل أو يُبرر استثناؤه.
6. كل إصلاح يجب أن ينعكس على Web وReact Native ما لم يوجد سبب تقني موثق.
