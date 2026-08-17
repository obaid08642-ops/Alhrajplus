# Alhrajplus — Release Gate Report

**التاريخ:** 2026-08-17

## خلاصة القرار

تم تنفيذ مراجعة رجعية واسعة وإصلاحات فعلية عبر Backend وWeb وMobile، ثم إعادة بناء واختبار المكونات المتأثرة. الحالة الحالية هي **Release Candidate يحتاج إغلاق حواجز staging قبل إعلان Production Ready**؛ لا يصح اعتبار المشروع جاهزًا نهائيًا اعتمادًا على build فقط، لأن اختبارات التكامل الكاملة تحتاج MongoDB/بيئة staging، كما أن اختبار WebRTC الحقيقي يتطلب جهازين وصلاحيات ميكروفون.

## ما تم تنفيذه والتحقق منه

| المجال | النتيجة |
|---|---|
| Design System وBottom Navigation | تم توحيد tokens وألوان الشريط وحالات التحديد بين Web وMobile، مع إزالة حالات الأبيض/الشفاف غير المقصودة. |
| الحقول المتخصصة | تم توحيد عقود السيارات والجوالات والعقار والوظائف بين Web وMobile وBackend، وإضافة تحقق فعلي قبل النشر. |
| الوسائط و3D | تم دعم GLB/GLTF، إزالة/استبدال النموذج من Web وMobile، وتنظيف الوسائط المحذوفة من Cloudinary عند التعديل/الحذف. |
| AI | تم نقل autofill وsuggest-category وassistant إلى orchestrator موحد مع fallback وtelemetry، وتفعيل weighted rotation وcooldown. |
| Coins وWallet | تم فصل Coins عن Wallet النقدية الافتراضية، وإصلاح atomic spend وسباقات boost. |
| Profiles والتفاعل | تم تدعيم عزل الدولة في seller listings وtrust والمؤشرات العامة. |
| Chat وWebRTC | تم تحسين أحداث realtime، buffering لـICE، وحالات signaling error/close. |
| Notifications | تم دعم payload وlink وdeep_link وcold start للموبايل، وفتح هدف الإشعار الصحيح، بما في ذلك فتح المزايدة. |
| Country isolation | تم تقييد OG، similar/neighbors، SearchPage، seller endpoints، وقرارات العروض بالدولة المختارة. |
| Localization | تم دعم اللغة التلقائية في Web، وإضافة خيار Auto فعلي في Mobile مع حفظ الاختيار اليدوي وتحديث RTL/LTR. |
| Moderation | تم ربط زر الإبلاغ في ListingDetail بالـBackend مع نموذج سبب البلاغ وحالات النجاح/الفشل، وحماية مسارات debug الحساسة بـAdmin. |
| Performance | تم تحديد حد أقصى لقاموس metrics لمنع نمو الذاكرة غير المحدود، مع استمرار rate limiter الحالي وتوثيق أنه in-process. |

## نتائج الاختبارات المحلية

نجح `python3 -m py_compile backend/server.py` و`git diff --check`. نجحت اختبارات Web الحالية الخاصة بالترجمة: **2/2**. نجح Web production build. نجح Mobile Expo web export. كما نجح smoke test لصلاحيات مسارات debug في منع الزائر غير الموثق.

تم تشغيل Suite Backend الكاملة في بيئة محلية، لكنها ليست Release Gate صالحة بسبب اعتمادها على MongoDB/بيئة تكامل خارجية غير متاحة محليًا. انتهت المحاولة بعد 612 ثانية عند **76 failed، 41 passed، 46 skipped، 81 errors**؛ بدأت معظم الأخطاء من فشل تسجيل المستخدم بإجابة 500، ولذلك يجب إعادة تشغيلها على staging مع MongoDB الحقيقي بدل تفسيرها كنجاح أو فشل نهائي للكود.

## نتائج staging الخارجي

حمّل `https://www.alhraj.online` الواجهة الرئيسية وظهرت عناصر البحث، القصص، المزادات، الخريطة، الفئات، وبطاقات الإعلانات. أعاد `https://alhrajplus.onrender.com/api/health` الحالة `status=ok` و`db=connected`. أعاد endpoint القوائم العامة نتائج `SA` تحمل `country_code=SA` فقط، ونتائج `EG` تحمل `country_code=EG` فقط.

لكن smoke test كشف **تلوثًا في بيانات legacy** لا في شرط العزل البرمجي: يوجد إعلان موسوم `SA` بمدينـة `الإسكندرية`، كما توجد إعلانات موسومة `EG` بعملة `ر.س`. يجب تنفيذ migration/admin cleanup للتحقق من توافق `country_code` مع المدينة والعملة قبل الإنتاج النهائي، وإلا سيبقى الفصل التقني صحيحًا بينما تكون بعض البيانات القديمة غير منطقية.

## حواجز الإصدار المتبقية

لا يمكن اعتماد Production Ready نهائيًا قبل تشغيل اختبارات التكامل على MongoDB staging، والتحقق من التسجيل وتسجيل الدخول والتعليقات والعروض والتفاعلات والحذف وتنظيف Cloudinary في البيئة المنشورة. يجب كذلك اختبار WebRTC بين جهازين فعليين مع صلاحيات الميكروفون، وقياس سلوك Render تحت حمل تدريجي. ويجب تنظيف بيانات الدول/المدن/العملات القديمة أو عزلها إداريًا قبل فتح كل الدول للمستخدمين.

## ملفات التوثيق

السجل التفصيلي للمراجعة موجود في `regression_audit_2026-08-17.md`. ملفات خطة المشروع ومصفوفات المعمارية وتجارب المستخدم موجودة في ملفات `phase*_*.md` داخل جذر المشروع.

## حالة Git

التغييرات الحالية موجودة في working tree ولم يتم اعتبارها منشورة نهائيًا إلا بعد مراجعة commit ورفع النسخة إلى المستودع المقصود. يجب مراجعة الأسرار والـenvironment variables قبل أي deployment، وعدم وضع أي token داخل المستودع.
