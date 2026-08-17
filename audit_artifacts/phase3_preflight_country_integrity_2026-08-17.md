# Phase 3 — مراجعة تمهيدية لعزل الدولة وسلامة البيانات

**التاريخ:** 17 أغسطس 2026  
**النطاق:** مراجعة فقط؛ لم تُنفذ أي migration أو mutation للبيانات في هذه الخطوة.

## Baseline حي على staging

شُغّلت أدوات القراءة فقط على Render عبر SA وEG وAE. أظهرت مسارات `listings` و`map` عزلًا exact-country في النتائج المتاحة؛ SA أعادت 11 إعلانًا سعوديًا فقط وEG أعادت 4 إعلانات مصرية فقط. طلب تفاصيل إعلان مصري تحت `country_code=SA` أعاد `404`، وتحت `country_code=EG` أعاد `200`. لم تكن هناك نتائج في بعض أسطح البحث/التوصيات/المزاد، ولذلك لا يثبت هذا baseline سوى عدم leakage في الاستجابات الفارغة لا تكامل هذه الأسطح مع بيانات حقيقية.

## البيانات القديمة الظاهرة للعلن

فحص public listings كشف تضاربًا فعليًا ما زال موجودًا في البيانات، حتى مع نجاح العزل بين الدول:

| دولة الإعلان | تضارب مثبت | السياسة الآمنة المقترحة |
|---|---|---|
| SA | إعلان في السعودية يحمل المدينة `الإسكندرية` المصرية. | لا يُنقل الإعلان تلقائيًا؛ تُمسح المدينة والدائرة فقط ويُوسم `location_needs_review=true` مع preimage قابل للrollback. |
| EG | أربعة إعلانات مصرية تعرض عملة سعودية `ر.س`. | تُصحّح تلقائيًا إلى عملة مصر المرجعية `ج.م` و`EGP` لأنها علاقة غير ملتبسة، مع preimage وbatch قابل للrollback. |
| SA | مدن مثل `بلدية الشمال` و`منطقة الرياض` ليست أسماء مدن مرجعية دقيقة. | لا تُحذف تلقائيًا؛ تُسجَّل كـ`city_not_in_reference` للتدقيق اليدوي فقط. |

## فجوات الكود المثبتة

1. `search_engine.suggest()` كان يستخدم `public_listing_filter()` ويضيف country فقط إذا وصل parameter غير فارغ. لذلك autocomplete بلا parameter يستطيع نظريًا أن يصبح global؛ يجب تحويله إلى `public_listing_filter_for_country()` مع fallback SA.
2. `POST /search/log` و`GET /search/trending` لا يحملان/يفلتران `country_code`، لذا يمكن للـtrending أن يخلط اهتمامات الدول. يلزم فصل key بـcountry وإتاحة parameter موحّد.
3. `POST /listings` يتحقق من supported country فقط، لكنه لا يتحقق من تطابق البلد المختار مع preference الحساب أو من city/currency المرجعية لتلك الدولة.
4. `PUT /listings/{id}` يملك ownership check جيدًا، لكنه لا يتحقق من active account country ولا من city/currency بعد التعديل.
5. `PUT /users/me` يقبل `city` و`country_code` مستقلين، ما يسمح بحفظ مدينة مصرية مع profile سعودي.
6. data-integrity migration الحالية تملك dry-run/confirmation/preimage/rollback، لكنها لا ترصد `city_not_in_reference` ولا تغيّر search blob بعد إزالة city، كما أن rollback لا يفرق بين field absent وfield value `null`.

## ما هو موجود وصحيح بالفعل

- `public_listing_filter_for_country()` يفرض exact equality ولا يعطي feed عامًا عند غياب parameter؛ fallback هو SA.
- معظم أسطح الاكتشاف العامة الأساسية (feed، detail، similar، favorites، comments، reels عبر listings، map، auctions، offers) تستخدم الفلتر الموحد وفق المسح الثابت.
- Web وMobile يحفظان اختيار الدولة ويحقنانه في requests. Mobile يزامن currency code في نموذج النشر؛ Web يرسل country active لكنه يبدأ بعملة سعودية جامدة ولا يعيد مزامنتها عند switch.
- data-integrity endpoints محمية عبر `admin_router` ذي dependency `require_admin`، ولا يمكن تشغيل dry-run staging بلا جلسة admin.

## قرار التنفيذ

سيُبنى patch مركزي لسياسة city/currency وactive-country، ويُحدَّث Web فقط لمزامنة عملة نموذج نشر جديد مع الدولة المختارة. لن يُشغَّل apply على staging بلا حساب admin مخصص، ولن تُنقل أي listing بين الدول من اسم مدينة وحده.


## ملاحظة نشر محدثة

بعد رفع commit `390baeb` إلى `main` ثم مزامنته إلى `production-readiness-premium` (وهو الفرع الذي كان متأخرًا عن `main`)، بدأ Render مرحلة إعادة نشر ظاهرة عبر توقف الوصول. بعد ذلك أعادت طلبات `curl` إلى الخدمة خطأ TLS `SSL_ERROR_SYSCALL` بدل health response. لوحة Render في بيئة المتصفح بقيت فارغة بلا عناصر أو حالة يمكن قراءتها، لذلك لا يمكن من هذه الجلسة تأكيد سجل build أو تشغيل deploy يدويًا. لا تُشغَّل اختبارات mutation السلبية على staging حتى تعود `/api/health` وتثبت نسخة Phase 3.
