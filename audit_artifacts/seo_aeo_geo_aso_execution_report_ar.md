# تقرير تنفيذ منظومة اكتشاف الإعلانات

**المشروع:** الحراج بلس — Alhraj Plus

**النطاق:** الإعلانات الجديدة، واجهات Web وMobile وBackend

**التاريخ:** 19 أغسطس 2026
**إعداد:** Manus AI

## الخلاصة التنفيذية

تم توسيع العمل من SEO تقليدي إلى منظومة متكاملة تشمل **SEO وAEO وGEO وASO وmetadata والروابط العميقة وواجهات قراءة آمنة للوكلاء**. المبدأ الذي يحكم التنفيذ هو أن أي إشارة لمحرك بحث أو مساعد ذكاء اصطناعي يجب أن تستند إلى نص الإعلان وحقوله المنشورة فعلًا، ولا تُنشئ مراجعات أو علامات تجارية أو أسعار أو تواريخ صلاحية أو لغات غير موجودة.

> لا يمكن ضمان المركز الأول أو الظهور في كل إجابة مولدة، لأن الفهرسة والترتيب والاختيار داخل محركات البحث ونماذج الذكاء الاصطناعي قرارات خارجية. لكن التنفيذ يجعل صفحة الإعلان **قابلة للزحف والفهم والقياس**، وهي شروط لازمة للأهلية والظهور.

## الخطة المنفذة

| المرحلة | الحالة | التنفيذ الفعلي |
|---|---:|---|
| تحديث المعايير | مكتملة | مراجعة إرشادات Google للبحث التوليدي وAI Overviews/AI Mode، وإرشادات Apple وGoogle Play للصفحات والروابط العميقة. |
| HTML وmetadata | مكتملة | مسار `/listing/{slug}` يعيد وثيقة إعلان كاملة للروبوتات ومعاينات المشاركة؛ يحافظ على React shell للزوار العاديين عند توافره. |
| البيانات المنظمة | مكتملة | مولد JSON-LD دقيق لـProduct، ويضيف Car وخصائص السيارة أو الفئة عند توفرها فقط. |
| دورة حياة الفهرسة | مكتملة | إبطال sitemap وإرسال إشارات التحديث أو الإزالة عند النشر والتعديل والإيقاف والاستئناف وإعادة النشر والبيع والحذف. |
| AEO/GEO والروبوتات | مكتملة | robots صريح لـOAI-SearchBot وClaude-SearchBot وPerplexityBot، مع استمرار حجب admin وAPI من الزحف العام. |
| تعدد اللغات | مكتملة | العربية أساس، وتُولد ترجمات discovery للإنجليزية والأوردية والهندية والبنغالية والفرنسية في الخلفية. لا يصدر hreflang إلا إذا كانت الترجمة حديثة ومطابقة لبصمة النص الأصلي. |
| جودة المحتوى | مكتملة | تقييم خاص لصاحب الإعلان يستخرج حقائق وكلمات من البيانات الفعلية فقط ويعرض عناصر النقص دون حشو أو اختلاق. |
| ASO وdeep links | موثق وجاهز من المصدر | خريطة الروابط العميقة وإعدادات App Links وUniversal Links قائمة؛ توثيق شروط النشر الخارجية أُضيف. |
| feeds وAI agents | مكتملة | واجهة عامة مقيدة للقراءة فقط: `GET /api/discovery/listings`، دون أرقام تواصل أو بيانات البائع أو أي معاملة تغيّر حالة الإعلان. |
| التحقق والقياس | مكتملة محليًا | اختبارات، بناء Web، تصدير Mobile Web، فحص JSON، وفحص git diff. |

## ما تغير في الكود

### صفحة الإعلان القابلة للفهرسة

تم توجيه `/listing/**` في Firebase وVercel إلى الخلفية، ثم إضافة استجابة HTML دلالية للإعلان للروبوتات المعروفة ومحركات المشاركة. تحتوي الوثيقة على العنوان والوصف والسعر والموقع والفئة والصورة وcanonical وOpen Graph وTwitter Card وJSON-LD. ويستمر المستخدم العادي في تلقي تطبيق React، مع fallback آمن يعرض وثيقة الإعلان إذا تعذر تحميل shell الخارجي.

تمت إضافة `OAI-SearchBot` إلى قائمة التعرف على الروبوتات، لأن اكتشاف ChatGPT Search منفصل عن `GPTBot` الخاص بضوابط التدريب. ويبقى قرار السماح بـGPTBot قابلًا للتحكم من إعداد robots في الإدارة.

### البيانات المنظمة

تستعمل صفحة الإعلان نوع `Product` كنقطة مشتركة للإعلانات المبوبة. في فئة السيارات تضيف النوع `Car`، وخصائص مثل الماركة والطراز والسنة والعداد وVIN عند وجودها في `custom_fields`. لا تُضاف Offer عند عدم وجود سعر موجب، ولا يُنشأ `priceValidUntil` افتراضي، ولا تُدّعى علامة تجارية لمنصة الحراج بلس بدل المنتج، ولا يُنشأ تقييم أو مراجعة أو شحن غير منشور.

### تعدد اللغات

تُحفظ الترجمات في `seo_localizations` منفصلة عن النص الأصلي ولا تستبدله. وتخزن معها بصمة SHA-256 لنص العنوان والوصف. إذا تغير الإعلان، تصبح الترجمة القديمة غير صالحة تلقائيًا فلا تُستخدم في metadata أو hreflang أو sitemap. بعد النشر أو تعديل النص، تُشغّل مهمة خلفية غير حاجبة لتوليد الترجمات المسموح بها عند توفر مفتاح نموذج اللغة. لا يفشل النشر إذا تعذرت الخدمة.

### واجهة discovery للوكلاء

توفّر `/api/discovery/listings` صفحة JSON عامة لقراءة الإعلانات المنشورة فقط. تدعم الدولة والفئة والمدينة والبحث واللغة وcursor والحد الأقصى. وهي تستبعد حقول الاتصال ومالك الإعلان وبيانات البائع وإشارات المراجعة، وتضع `X-Agent-Read-Only: true`. لا يوجد endpoint للمساومة أو الدفع أو النشر أو الحذف، ولذلك لا يمكن للوكيل تنفيذ معاملة عبر هذه الواجهة.

## مؤشرات القياس المقترحة

| المجال | المؤشر | مصدر القياس |
|---|---|---|
| الفهرسة | صفحات الإعلانات المفهرسة وأخطاء canonical وsitemap | Google Search Console وBing Webmaster Tools |
| البحث التوليدي | ظهور ونقرات ووقت تفاعل صفحات الإعلانات من ميزات Google AI | تقرير الأداء التوليدي في Search Console عند تفعيله للحساب |
| الجودة | نسبة الإعلانات ذات درجة discovery أعلى من 80 | endpoint `discovery-profile` ولوحة الإدارة المستقبلية |
| تعدد اللغات | نسبة الإعلانات التي تملك ترجمة طازجة لكل لغة | حقل `seo_localizations` ومراقبة أخطاء المهام الخلفية |
| المشاركة | نجاح Open Graph/Twitter card وفتح روابط الإعلان | أدوات معاينة المنصات والتحليلات |
| التطبيق | تغطية Android App Links ومعدل فتح الرابط في التطبيق | Play Console Deep Links، App Analytics، Firebase/GA4 إن كان مفعّلًا |

## التحقق المنفذ

| الفحص | النتيجة |
|---|---:|
| اختبارات Backend المتخصصة | **13 اختبارًا ناجحًا** |
| اختبارات Web | **19 اختبارًا ناجحًا** ضمن 5 suites |
| Web production build | ناجح |
| Mobile Web export | ناجح |
| JSON لإعدادات Firebase وVercel وExpo | صالح |
| `git diff --check` | ناجح |

## الحواجز الخارجية الصريحة

لا يمكن إغلاق البنود التالية من المستودع وحده، ولم تُنشر أي قيم وهمية بدلًا منها.

| البند | ما يلزم |
|---|---|
| Android App Links | ملف `/.well-known/assetlinks.json` يحتوي بصمة SHA-256 الحقيقية لشهادة توقيع إصدار Google Play. |
| iOS Universal Links | ملف `apple-app-site-association` يحتوي Apple Team ID الحقيقي مع `com.harajplus.app`. |
| Smart App Banner | App Store ID رسمي فقط. |
| ASO في المتاجر | حسابات Apple App Store Connect وGoogle Play Console، صفحات متجر مترجمة، صور حقيقية، وتجارب A/B. |
| قياس AI في Google | إثبات الملكية وإتاحة تقارير Search Console للحساب. |
| النشر الحي | Cloud Run أو Render للـBackend، ثم Firebase أو Vercel للواجهة؛ بعدها فحص URL Inspection ومعاينات الشبكات الاجتماعية على URL إعلان فعلي. |

للتفاصيل التشغيلية للمتاجر والروابط العميقة، راجع ملف [قائمة ASO والروابط العميقة](aso_deep_links_release_checklist_ar.md).

## المراجع

[1] [Google Search Central: Optimizing your website for generative AI features](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)

[2] [Google Search Central: AI features and your website](https://developers.google.com/search/docs/appearance/ai-features)

[3] [Google Search Central: Guidance on generative AI content](https://developers.google.com/search/docs/fundamentals/using-gen-ai-content)

[4] [web.dev: Build agent-friendly websites](https://web.dev/articles/ai-agent-site-ux)

[5] [Apple: Creating your product page](https://developer.apple.com/app-store/product-page/)

[6] [Google Play Console: Verify and maintain deep links](https://support.google.com/googleplay/android-developer/answer/12463044?hl=en)

[7] [Android Developers: App Links](https://developer.android.com/training/app-links)

[8] [Apple: Universal links](https://developer.apple.com/documentation/xcode/allowing-apps-and-websites-to-link-to-your-content)
