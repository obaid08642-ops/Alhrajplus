# تقرير إغلاق Phase 3 — عزل الدولة وسلامة البيانات

**التاريخ:** 17 أغسطس 2026  
**الحالة النهائية:** **PASS WITH BLOCKERS**  
**نطاق المرحلة:** عزل السوق حسب الدولة من جهة الخادم، منع mutations المتضاربة، تجهيز إصلاح بيانات legacy قابل للعكس، والتحقق على staging بعد النشر.

## ملخص النتيجة

اكتملت طبقة الحماية الفعلية لعزل الدول في النسخة المنشورة. لا تعتمد الحماية على اختيار الواجهة فقط؛ بل يفرض Backend دولة الحساب عند إنشاء الإعلان أو تعديله، ويتحقق من علاقة المدينة والحي والعملة بالدولة المرجعية. كما أُغلقت أسطح autocomplete وsearch history وtrending التي كان يمكن أن تخلط سلوك البحث بين الدول.

> **التمييز المهم:** تم نشر واختبار آلية إصلاح بيانات legacy القابلة للـrollback، لكن لم يُشغّل `apply` على بيانات Render الحقيقية لغياب جلسة Admin مخصصة. لذلك لا يجوز الادعاء بأن المخالفات القديمة حُذفت أو صُححت بالفعل.

| البند | النتيجة |
|---|---|
| Commit الوظيفة | [`390baeb`](https://github.com/obaid08642-ops/Alhrajplus/commit/390baeb8094b13bedb29c56c3fe0db2122549f4a) — `feat: enforce strict country integrity boundaries` |
| فرعا النشر | `main` و`production-readiness-premium` متطابقان عند `390baeb` |
| Backend المنشور | Render أعاد `200` من health مع `db=connected` بعد النشر [1] |
| Web المنشور | Vercel حمّل bundle `main.2aab8bc6.js` من النسخة الحالية [2] |
| قبول staging | نجح اختبار عزل دولة SA/EG ورفض tampering بلا أي mutation ناجح |

## ما نُفذ

أُضيفت وحدة `backend/country_policy.py` لتكون المرجع الوحيد لقواعد الدولة والمدينة والحي والعملة. تقبل الوحدة الاسم الإنجليزي للمدينة عند وجوده ثم تحوله إلى الاسم العربي المرجعي، وترفض المدن أو الأحياء أو العملات التي لا تخص السوق المختار. كما أن country codes الغائبة أو غير المدعومة في مسارات العرض العامة تعود إلى السعودية بدل تحويل الاستعلام إلى corpus عالمي أو سوق فارغ.

عند `POST /listings` أصبحت دولة الحساب المحفوظة هي الحد الخادمي؛ يستطيع العميل أن يرسل `country_code` مساويًا لها فقط، وإلا يحصل على `409`. يرفض الخادم المدينة المتعارضة أو العملة الخاطئة بـ`422`. وعند `PUT /listings/{id}` لا يمكن تغيير دولة الإعلان، ولا يمكن لمستخدم تعديل إعلان دولة أخرى قبل تبديل الدولة النشطة. كما أن `PUT /users/me` يرفض country codes غير المدعومة، ويطبع المدينة أو يمسح مدينة قديمة لا تنتمي إلى الدولة الجديدة بدل الاحتفاظ بتضارب.

| السطح | الإجراء المنفذ | النتيجة الأمنية |
|---|---|---|
| إنشاء الإعلان وتعديله | `country_code` الحسابي + تطبيع city/district/currency | منع تخزين إعلان في سوق أو بعملة أو موقع متعارض |
| تحديث Profile | country/city/phone مرتبطة بالدولة الهدف | منع Profile سعودي مع مدينة مصرية بعد التبديل |
| Listing feed / detail / map / auctions | exact country filter القائم + fallback آمن | لا تظهر إعلانات EG في SA والعكس |
| Autocomplete | `suggest()` أصبح يستخدم `public_listing_filter_for_country()` | لا يصبح autocomplete عالميًا عند غياب country |
| Search log / trending / history | مفاتيح وتصفية `country_code` منفصلة | لا تختلط اهتمامات البحث بين الأسواق |
| Web Post Listing | مزامنة عملة الإعلان الجديد مع الدولة النشطة | لا يبقى default سعودي عند اختيار دولة أخرى |
| Data integrity | dry-run، confirmation، preimage، rollback مع `$unset` للـfield الغائب | إصلاح قابل للعكس دون تحويل absent field إلى `null` |

## سلامة البيانات القديمة

عُدلت آلية integrity لتكتشف خمسة أصناف: `country_code_missing`، و`country_code_unsupported`، و`city_country_mismatch`، و`city_not_in_reference`، و`currency_country_mismatch`. الإصلاح التلقائي محافظ: يصحح العملة عندما تكون العلاقة المرجعية غير ملتبسة، ويمسح city/district فقط إذا كانت المدينة معروفة لدولة أخرى، ويعلّم المدن الحرة غير المرجعية بـ`location_needs_review=true` بدلاً من تخمين نقل الإعلان إلى دولة أخرى. كما يعيد بناء `search_blob` إن مُسحت المدينة حتى لا تبقى نتائج بحث قديمة.

الفحص السابق قرأ مخالفة مدينة مصرية في إعلان سعودي وأربع عملات سعودية في إعلانات مصرية. لم يطبَّق الإصلاح على live database لعدم توفر Authorization إداري؛ بقيت هذه حالات تحتاج dry-run إداري ثم confirmation صريح، وليست فشلًا في طبقة الحماية الجديدة.

## الاختبارات المنفذة

| الاختبار | النتيجة | الدليل |
|---|---:|---|
| Python compile للـBackend | PASS | `compileall` نجح |
| اختبارات country policy، mutation handlers، public visibility، integrity | **21 PASS** | `backend/tests/test_phase3_country_policy.py` مع اختبارات Phase 2 ذات الصلة |
| Web unit tests | **3 suites / 11 PASS** | `accessControl` و`i18nSmoke` و`notificationLinks` |
| Web production build | PASS | CRACO build نجح |
| Expo export | PASS | Web وAndroid وiOS نجحت في `expo export --platform all` |
| Render health بعد النشر | PASS | `{"status":"ok","db":"connected"}` [1] |
| Fallback لدولة غير مدعومة | PASS | `country_code=UA` أعاد إعلان SA فقط و`total=10` |
| Cross-country public matrix | PASS | SA وEG عبر listings/map/auctions/recommended/trending/deals؛ لا item بدولة خاطئة |
| Detail negative test | PASS | طلب إعلان EG مع `country_code=SA` أعاد `404` |
| Server-side mutation negative suite | PASS | cross-country create=`409`، city mismatch=`422`، currency mismatch=`422`، unsupported profile country=`422` |
| Admin data integrity anonymous boundary | PASS | `GET /admin/data-integrity` أعاد `401` |

أُجري أيضًا تشغيل شامل لمجلد `backend/tests`. لم يعد هذا harness صالحًا للتشغيل standalone في sandbox لأنه يوجّه مئات الاختبارات HTTP إلى `127.0.0.1:8000` من دون تشغيل خادم محلي؛ نتج عنه `145 failed, 122 errors` بسبب `ConnectionRefusedError`، وليس assertion فشل وظيفي لPhase 3. لا تُحسب هذه النتيجة نجاحًا أو دليل regression؛ عالجتها باختبارات unit/handler معزولة ثم acceptance حقيقية على Render.

## القضايا التي وُجدت وحُلّت

| المشكلة المثبتة | الإصلاح |
|---|---|
| Clients يمكنهم إرسال `country_code` مختلف عند إنشاء الإعلان | صار Backend يقارن الطلب بدولة الحساب ويعيد `409` قبل الإدراج |
| تعديل الإعلان يسمح بتجاوز active country أو تغيير market | أُضيف scope صريح، ومنع نقل الإعلان بين الدول، وتحقق fields المتغيرة |
| Profile يسمح بدمج country/city غير متوافقين | تطبيع/رفض city ومسح city قديمة عند تبديل market |
| Autocomplete بلا country قد يقرأ corpus غير مقيد | أصبح كل استعلام suggestion مقيدًا بـcountry آمن |
| Trending/history لا يعزلان السوق | فصل التخزين والاسترجاع والتنظيف حسب `country_code` |
| Rollback يخلط absent field و`null` | preimage يخزن `present/value` ويستخدم `$unset` عند الحاجة |
| مسح المدينة يتركها في search blob | إعادة بناء `search_blob` في repair |

## الحواجز والقيود المتبقية

يتطلب تنفيذ migration live فعليًا تسجيل دخول Admin صالحًا ثم استدعاء `/admin/data-integrity` بـdry-run ومراجعة plan، وبعدها `apply=true` و`confirm=REPAIR_COUNTRY_INTEGRITY`. لن أستخدم حساب مستخدم عادي أو أخمّن بيانات Admin لتجاوز هذا الحد. وبعد التطبيق يجب فحص batch ثم rollback اختياري لعينة محدودة قبل اعتماد التنظيف النهائي.

لا يشمل قبول هذه المرحلة اختبار UX يدويًا كاملًا على أجهزة Android وiOS فعلية، ولا يلغي الحاجة إلى إعادة اختبار country switch بصريًا بعد نشر mobile builds. لكنه يثبت أن عقد Backend الموحد الذي يستخدمه Web وMobile يعمل، وأن Mobile export مرّ بنجاح.

## الخلاصة

**Phase 3 مكتملة وظيفيًا ومختبرة على staging، مع blocker إداري محدد فقط لتنظيف البيانات القديمة فعليًا.** لن أبدأ Phase 4 من الخطة الأصلية حتى يصل أمر صريح منك: **Proceed to Phase 4**.

## المراجع

[1]: https://alhrajplus.onrender.com/api/health "Render health endpoint"
[2]: https://www.alhraj.online "Alhraj Plus Web deployment"
