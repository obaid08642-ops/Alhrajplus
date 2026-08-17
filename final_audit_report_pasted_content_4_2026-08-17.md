# تقرير إعادة التدقيق والتنفيذ — Alhrajplus

**التاريخ:** 17 أغسطس 2026

## خلاصة تنفيذية

أُعيدت قراءة `pasted_content_4.txt` كاملًا، ثم حُوّلت عناوينه ومتطلباته إلى سجل تتبع، وأُجري جرد معماري للكود وربط بين Web وReact Native وBackend وAdmin. بعد ذلك نُفذت إصلاحات محددة واختُبرت كل مرحلة ببوابة مستقلة. النتيجة ليست ادعاءً بأن المنتج أصبح مكتملًا بلا قيود؛ بل هي نسخة أقوى مع تمييز صريح بين ما تم بناؤه والتحقق منه، وما تحقق بنيويًا فقط، وما يحتاج بيئة staging حقيقية أو جهازًا فعليًا.

## مصفوفة المراحل

| المرحلة | النتيجة | الدليل |
|---|---|---|
| 1. سجل المتطلبات | مكتملة | `pasted_content_4_traceability.md` |
| 2. الجرد المعماري | مكتملة | `phase2_architecture_gap_matrix_2026-08-17.md` وبوابة build baseline |
| 3. AI rotation وquota وAdmin | مكتملة برمجيًا، وfailover الحي غير مثبت | `phase3_ai_audit_completion_2026-08-17.md` |
| 4. البحث الصوتي والصوري | Web مكتمل برمجيًا؛ Mobile marketplace search ما زال فجوة parity | `phase4_search_completion_2026-08-17.md` |
| 5. Coins/referral/phone | Coins وreferral موجودان، وعقد الهاتف في Web أُصلح | `phase5_coins_phone_completion_2026-08-17.md` |
| 6. Notifications/deep links | Web maps والـlocale أُصلحت؛ push cold-start يحتاج جهازًا وcredentials | `phase6_notifications_completion_2026-08-17.md` |
| 7. Localization | relative time وWallet وListingCard أُصلحت؛ توجد مواضع legacy RTL موثقة | `phase7_localization_completion_2026-08-17.md` |
| 8. Listing UX/swipe | Web وMobile متصلان بـneighbors المقيدة بالدولة والفئة | `phase8_listing_ux_completion_2026-08-17.md` |
| 9. Admin/trust/transactions | guard audit وإصلاح idempotency race وفهارس unique | `phase9_security_admin_completion_2026-08-17.md` |
| 10. المنافسون | تدقيق مباشر لـHaraj وOpenSooq، مع حد واضح لمصدر Dubizzle | `phase10_competitor_audit_completion_2026-08-17.md` |
| 11. التحقق | Web/Mobile/compile وlive read-only smoke ناجحة؛ pytest التاريخي غير صالح كـproduct gate | `phase11_validation_completion_2026-08-17.md` |

## أهم التعديلات الفعلية

أصبح البحث في Web يملك حالات واضحة للطلب والاستماع والتحويل والنجاح والخطأ، مع معاينة الصورة أثناء تحليلها وواجهة `aria-live` للحالة. أُصلح عقد نشر الهاتف في Web ليصرّح بما إذا كان الإعلان يستخدم رقم الحساب أو رقمًا مخصصًا أو يخفي الهاتف، مع تحقق من الرقم المخصص.

تم توحيد deep-link في صفحة الإشعارات Web لتشمل المحادثة والتعليقات والبحث المحفوظ والمتابعة والمزاد، وأصبح تنسيق التاريخ والاتجاه تابعًا للغة النشطة. أُضيف swipe-native في Mobile Detail باستخدام endpoint الجيران نفسه الذي يفرض الدولة والفئة، مع عدم اعتراض السحب الرأسي أو carousel الصور.

تمت معالجة سباقات idempotency في Coins spend/grant ومكافأة الترحيب: إذا فاز طلب متزامن بنفس المفتاح، يُعاد الرصيد في الطلب الخاسر ويُعاد سجل الحركة الفائز. أُضيفت unique indexes آمنة على ledger وwelcome bonus، مع safe-index wrapper حتى لا يمنع legacy data تشغيل الخادم.

## نتائج الاختبار

| الاختبار | النتيجة |
|---|---|
| Backend `py_compile` | ناجح |
| Web production build | ناجح |
| Mobile Expo web export | ناجح |
| Render `/api/health` | HTTP 200، و`db: connected` |
| Render metadata/listings/ads read-only smoke | HTTP 200 |
| الموقع العام | يستجيب |
| pytest التاريخي الكامل | غير صالح كحكم منتج: 149 فشلًا و122 خطأ بسبب preview URL/HTTP harness/Mongo test environment، لا بسبب إثبات خطأ واحد في الإصلاحات الحالية |

## الفجوات التي لم أعتبرها مكتملة

لا يمكن إثبات push notification بعد إغلاق التطبيق، صلاحيات iOS/Android، أو WebRTC على جهاز حقيقي من sandbox. كما أن failover بين مزودين AI يحتاج مفاتيح staging حقيقية لمزودين اثنين على الأقل. Coins والـreferral والتزامن وCloudinary deletion تحتاج قاعدة staging منفصلة وحسابات اختبار.

البحث الصوتي والصوري في Web محسّن ومبني على العقد الحالي، لكن Mobile لا يعرض بعد نفس top-level marketplace search state machine؛ الموجود في Mobile يخص وسائط الشات. كذلك توجد مواضع legacy RTL ثابتة في callback screens وبعض نصوص Admin، وقد سُجلت في inventory ولم تُخفَ تحت ادعاء parity كامل.

## مقارنة المنافسين

أظهر فحص Haraj الرسمي وجود taxonomy واسعة، اختصارات للعلامات والمناطق، Near discovery، وتفريعات عميقة للسيارات والعقار والأجهزة [1]. أظهر فحص OpenSooq الرسمي محدد المدينة والفئة، المفضلة، المنشورات، الإشعارات، Add Listing، Reviews & Ratings، Sell Now، اكتشاف الإعلانات الجديدة، وتبويبات العلامة/المدينة/السنة، إلى جانب landing sections محلية [2]. لم يكن جذر Dubizzle العام قابلًا للقراءة في جلسة sandbox، لذلك لم تُنسب إليه ميزات غير مثبتة؛ يلزم فحص إقليمي/حساب رسمي منفصل.

الأولويات المتبقية الأعلى قيمة هي: native snap-photo-to-draft في Mobile، شاشة واضحة لإدارة saved-search alerts، إبراز reviews/ratings في listing detail، توسيع landing pages القابلة للفهرسة حسب الفئة/العلامة/المدينة، واستكمال full localization sweep.

## متطلبات staging المقترحة قبل إعلان production-ready

ينبغي تشغيل نسخة staging منفصلة عن الإنتاج بقاعدة Mongo disposable، وحسابي مستخدمين تجريبيين، ومفتاحي AI لمزودين مختلفين، Cloudinary test folder، Push credentials، وTURN إن كان مطلوبًا خارج STUN. بعدها تُعاد اختبارات mutation، التزامن، الرسائل، المكالمات، الإحالة، Boost، رفع الوسائط، حذف Cloudinary، وdeep-link من cold start على Android وiOS.

## مراجع المنافسين

[1]: https://haraj.com.sa/en/ "Haraj official English homepage"
[2]: https://www.opensooq.com/en "OpenSooq official homepage"


## ملحق إعادة التدقيق والإصلاح — الجولة الأخيرة

أُعيد فتح الفجوات التي ظهرت بعد التدقيق السابق ولم تُعامل كمكتملة تلقائيًا. تم إنشاء resolver مركزي في `frontend/src/lib/notificationLinks.js` يتعامل مع payload object أو JSON string ويغطي إشعارات الرسائل، الإعلانات، التعليقات، المزادات، البحث، المتابعة، والتنبيهات الإدارية. تم توصيله بكل من `NotificationBell` و`NotificationsPage` لمنع fallback غير المقصود إلى الصفحة الرئيسية.

تم تعديل قائمة الإشعارات لتتمركز حول منتصف الشاشة، مع عرض متجاوب أصغر وحدود viewport واضحة ومنع قص العناصر أفقيًا. كما تم توحيد locale والاتجاه في السطحين المختصر والكامل.

أُجري تدقيق شامل لمفاتيح الترجمة العربية الثابتة؛ أضيفت 69 ترجمة إلى اللغات المدعومة: الإنجليزية، الأردية، الهندية، البنغالية، والفرنسية. أعاد تدقيق المفاتيح نتيجة فارغة `[]` بعد الإصلاح. أُصلحت أيضًا صياغة relative time والأرقام في البطاقات والمحفظة.

أُكمل Mobile image search في `SearchScreen.js`: اختيار صورة، إرسالها إلى نفس `/api/ai/image-search` المستخدم في Web، عرض حالة الرفع والتحليل، ثم وضع query وتشغيل النتائج تلقائيًا. مسار voice search والبحث المحفوظ موجودان ومختبران تجميعيًا.

أثبت التدقيق أن snap-photo-to-draft موجود فعليًا في Web وMobile عبر `/ai/listing-autofill`؛ لذلك لم يُنشأ مسار مكرر. أضيفت `PageSEO` إلى صفحات الفئات مع الدولة والمدينة والفئة وcanonical وkeywords ديناميكية.

### نتائج بوابة الإصدار الأخيرة

| الفحص | النتيجة |
|---|---|
| Python compile لـBackend وAI orchestrator | ناجح |
| Web production build | ناجح |
| Mobile Expo web export | ناجح |
| `/api/health` على Render | ناجح، وMongoDB متصل |
| `/api/meta/theme` على Render | ناجح، وإعدادات theme حقيقية |
| فحص مفاتيح الترجمة الناقصة | `[]` بعد الإصلاح |

تبقى اختبارات الأجهزة الفعلية، push بعد إغلاق التطبيق، صلاحيات مكتبة الصور/الميكروفون، وتحقق AI بمفاتيح مزودين حقيقية اختبارات ميدانية لا يمكن إثباتها من build محلي أو طلبات قراءة عامة فقط. لا يُنسب لهذه العناصر نجاح كامل دون تشغيلها على staging حقيقي وأجهزة Android/iOS.
