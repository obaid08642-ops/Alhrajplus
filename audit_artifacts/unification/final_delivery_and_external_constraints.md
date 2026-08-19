# سجل التسليم النهائي — توحيد Web وMobile

## حالة التنفيذ

اكتمل تنفيذ مراحل التوحيد المتبقية في هذه الدورة بعد المراحل السابقة: نقل قدرات Mobile إلى Web، اعتماد وتطبيق نظام التنقل premium الموحد، تحصين الأداء والأمن والموثوقية، ثم إعداد اختبارات متعددة القنوات وإطلاق مرحلي قابل للتراجع. رُفعت كل مرحلة مكتملة إلى فرع `main` بعد اجتياز بواباتها، ولم يُجر أي تعديل مباشر على بيانات الإنتاج.

| المرحلة | النتيجة | الالتزام المرفوع إلى `main` |
|---|---|---|
| نقل قدرات Mobile إلى Web | بحث بالصورة، التسجيل الصوتي الاحتياطي، وتحسين PWA لتجربة Web. | `1631cca` |
| نظام التنقل Premium | أيقونات خطية premium، هالة نشطة، زر نشر ليموني مستقل، وفتحة شفافة موحدة. | `a4bc9b3` |
| الأداء والأمن والموثوقية | رؤوس HTTP وقائية، فهارس اكتشاف مركبة، وترقيات Mobile علاجية محدودة. | `83cdf94` |
| الاختبار متعدد القنوات والإطلاق المرحلي | عقد feature flags موحد، kill switches، وخطة rollback موثقة. | `c8f2f73` |

## التكافؤ الحالي بين القنوات

| المجال | Web | Mobile | الحالة |
|---|---|---|---|
| البحث بالصورة | اختيار/التقاط صورة ثم `/ai/image-search`. | ImagePicker ثم نقطة الخدمة نفسها. | متكافئ؛ قابل للإيقاف بـ`image_search`. |
| البحث الصوتي | SpeechRecognition عند توفره، ثم `MediaRecorder` و`/ai/transcribe` كبديل. | `expo-audio` ثم `/ai/transcribe`. | متكافئ وظيفيًا؛ قابل للإيقاف بـ`voice_search`. |
| الملاحة | شريط سفلي premium بلون تديره الإدارة، وزر نشر ليموني وفتحة شفافة. | المكوّن الأساسي والمكوّن المستقل بالتصميم والأبعاد نفسها. | متكافئ؛ الهالة فقط قابلة للتراجع بـ`premium_navigation`. |
| تثبيت التطبيق | manifest وservice worker وزر PWA متدرج في Profile. | تطبيق Expo أصلي. | اختلاف مقصود حسب المنصة؛ تثبيت PWA ليس بديلًا عن Native. |
| المكالمات/الخريطة/3D | أسطح Web أصلية للمتصفح. | WebRTC + CallKeep وMapLibre وFilament أصلية بلا WebView. | اختلاف مقصود تبعًا للقدرات الأصلية؛ لا يوجد WebView في Mobile لهذه المسارات. |
| SEO/AEO/GEO/ASO | الصفحات القابلة للفهرسة وبيانات JSON-LD وsitemap وcanonical. | deep links وmetadata المتجر وفتح صفحة Web المطابقة عند عدم وجود التطبيق. | متكامل لا متطابق شكليًا؛ Mobile ليس سطح زحف. |

## آخر بوابة قبول ناجحة

| الاختبار | النتيجة |
|---|---|
| اختبارات عقود Backend الحتمية | `106 passed`. |
| اختبارات Web | `5` مجموعات و`19` اختبارًا. |
| Web production build | ناجح؛ bundle الرئيسي `398.99 kB` مضغوطًا. |
| Android export | ناجح؛ `7.28 MB`. |
| حارس التعريب | ناجح؛ لا نصوص عربية UI جديدة خارج `t()` أو `tr()`. |
| فحص التنسيق | ناجح؛ `git diff --check`. |

## تشغيل feature flags

يمكن للمدير قراءة المفاتيح من `GET /api/admin/feature-flags` وتحديثها عبر `PUT /api/admin/feature-flags`، بينما يستهلك العملاء `GET /api/meta/feature-flags`. لا توجد قيمة تخفي ميزات المستخدم افتراضيًا؛ جميع المفاتيح المعروفة تبدأ `true`. عند الحادث، يحمل متغير البيئة `FEATURE_FLAG_<NAME>=false` أولوية أعلى من إعداد الإدارة ويصبح مسار التراجع الأسرع بعد إعادة تشغيل/إعادة نشر الخدمة.

| اسم المفتاح | مثال إيقاف طارئ | نطاق الأثر |
|---|---|---|
| `image_search` | `FEATURE_FLAG_IMAGE_SEARCH=false` | إخفاء وإيقاف البحث بالصورة في Web وMobile. |
| `voice_search` | `FEATURE_FLAG_VOICE_SEARCH=false` | إخفاء وإيقاف البحث الصوتي في Web وMobile. |
| `pwa_install` | `FEATURE_FLAG_PWA_INSTALL=false` | إيقاف دعوة تثبيت PWA في Web. |
| `premium_navigation` | `FEATURE_FLAG_PREMIUM_NAVIGATION=false` | إزالة الهالة premium فقط، مع إبقاء الملاحة صالحة. |

## القيود الخارجية التي لا يمكن إنهاؤها من الشفرة

> لا تُملأ أي هوية أو بصمة أو رابط متجر بقيمة افتراضية أو placeholder؛ يجب أن تأتي من الجهة المالكة للحسابات والبناء الموقّع.

| القيد | المطلوب من الفريق/المالك | أثره |
|---|---|---|
| Android App Links | بصمة SHA-256 لشهادة Android release الحقيقية. | لا يمكن تحقق `assetlinks.json` وتشغيل App Links الموثوق حتى تقديمها. |
| iOS Universal Links | Apple Team ID وApp ID الحقيقيان. | لا يمكن اعتماد `apple-app-site-association` على iOS من دونها. |
| مكالمات iOS الأصلية | حساب Apple Developer وهوية حزمة وتكوين CallKit/PushKit. | لا يمكن اعتماد تجربة المكالمات الأصلية على جهاز iOS موقّع. |
| الأجهزة الحقيقية | أجهزة Android وiOS للاختبار. | يلزمها لفحص safe areas، MapLibre، Filament، WebRTC، CallKeep، والصلاحيات. |
| روابط المتاجر | روابط Google Play وApp Store وAppGallery الرسمية. | لا يمكن نشر Smart Banners أو إحالات متجر نهائية قبل توفيرها. |
| Redis وقياسات الإنتاج | `REDIS_URL` مُدار، وبيانات مراقبة حقيقية. | تحقق cache متعدد النسخ، قياسات p95، وخطة canary بالنسب لا يثبت محليًا. |
| التبعيات المتبقية | ترقية Expo/Metro/React Native وCRA في فروع مخصصة مع أجهزة حقيقية. | توجد تنبيهات transitive لا تُعالج بترقية قسرية آمنة. |

## إجراءات ما بعد النشر

تبدأ عملية الإطلاق بالنشر إلى بيئة staging ثم تنفيذ smoke tests بقراءة فقط: Health، قائمة الإعلانات، الترجمة، البحث، metadata، ورؤوس الحماية. بعدها تُفعّل المفاتيح لمجموعة داخلية، ثم تتسع تدريجيًا بعد مراجعة الأخطاء وزمن الاستجابة. يجب أن يبقى مفتاح التراجع متاحًا طوال نافذة المراقبة، وأن يتم فحص App Links وUniversal Links على builds موقعة فعلية فقط. [1] [2]

## المراجع

[1] [Google — Verify Android App Links](https://developer.android.com/training/app-links/verify-applinks)

[2] [Apple — Supporting Associated Domains](https://developer.apple.com/documentation/xcode/supporting-associated-domains)
