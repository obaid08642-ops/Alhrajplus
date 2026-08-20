# تدقيق البناء النظيف لـ Web وPWA وMobile وBackend

## الحكم العملي

لا يمكن الجزم بأن أي نظام برمجي خالٍ من جميع الأخطاء الممكنة، ولا سيما عبر الأجهزة والشبكات وحسابات الإنتاج. لكن **المسارات التي يمكن إعادة إنتاجها محليًا اجتازت بوابات البناء والاختبار المحددة أدناه**. عالج هذا التدقيق سببًا مرجحًا لأخطاء بناء Mobile: تم تعطيل New Architecture صراحةً لأن مكتبات المكالمات الأصلية الحالية (`react-native-callkeep` و`react-native-webrtc`) غير مختبرة عليها. لم تُخف الأخطاء؛ بل جرى توثيق سبب الاستثناء في إعداد Expo نفسه وتشغيل الفحص الرسمي بنجاح.

| القناة | التحقق المنفذ | النتيجة |
|---|---|---|
| Backend | `compileall`، ثم بوابة الاختبارات الحتمية للمرحلة وعقد الحادث. | نجاح الترجمة و`110 passed`. |
| Web وPWA | اختبارات CRA/CRACO وبناء إنتاج. | `5` مجموعات و`19` اختبارًا ناجحًا؛ بناء الإنتاج ناجح. |
| Mobile Android JavaScript | `expo export --platform android`. | ناجح؛ حزمة Hermes بحجم `7.28 MB`. |
| Mobile Web | `expo export --platform web`. | ناجح؛ حزمة Web بحجم يقارب `4.9 MB`. |
| تهيئة Native | `expo prebuild --clean --no-install` في نسخة مؤقتة لنظامي Android وiOS. | ناجح؛ لم يظهر خطأ plugin أو config. |
| توافق Expo | `expo install --check` و`expo-doctor --verbose`. | الاعتماديات متوافقة و`18/18` فحصًا ناجحًا. |
| TypeScript | جرد ملفات `*.ts` و`*.tsx` و`tsconfig.json` خارج الحزم المولدة. | لا توجد مصادر أو إعدادات TypeScript في المشروع؛ الشفرة الحالية JavaScript، لذا لا يوجد فحص TypeScript قابل للتشغيل. |
| الجودة | حارس التعريب و`git diff --check`. | ناجحان. |

## التعديلات التي شملت كل قناة

| المجال | الملفات الرئيسية | الأثر |
|---|---|---|
| Web | `frontend/src/lib/useChatSocket.js` و`frontend/src/pages/ListingDetail.js`. | توحيد عنوان WebSocket مع `API_BASE` وإعادة إرسال إشارات المكالمة ومطابقة التعليق المحفوظ بعد خطأ نقل مؤقت. |
| Mobile | `mobile/src/useChatSocket.js` و`mobile/src/screens/ChatScreen.js` و`mobile/src/screens/ListingDetailScreen.js`. | الاحتفاظ بإشارات المكالمة خلال إعادة الاتصال، استقصاء الرسائل عند غياب socket، وإعادة استخدام معرّف التعليق ومطابقته تلقائيًا. |
| إعداد بناء Mobile | `mobile/app.json` و`mobile/package.json`. | تعطيل New Architecture صراحةً وتوثيق استثناء فحص المكتبتين غير المختبرتين على تلك البنية. |
| Backend | لم يتطلب تدقيق البناء الأخير تعديل شفرة Backend. | اجتازت الشفرة الاختبارات والترجمة؛ تعديلات الاتصال السابقة كانت في العملاء لأن مسارات HTTP وBackend كانت تعمل وتملك عقود حماية سليمة. |

## تحذيرات وقيود لا يجوز إخفاؤها

لا يوجد حاليًا TypeScript في المصدر، لذلك ليس من الدقيق الادعاء بأن فحص TypeScript اجتاز؛ لا يوجد فحص TypeScript قابل للتطبيق أساسًا. كذلك أظهر Metro تحذيرًا غير حاجب من `event-target-shim` حول `exports`، لكنه أكمل تصدير Android بنجاح. هذا تحذير من حزمة تابعة ولا يمثل خطأ بناء في التطبيق الحالي.

يبقى بناء EAS الموقّع غير قابل للتحقق من هذه البيئة لأن `mobile/app.json` يحتوي `REPLACE_WITH_YOUR_EAS_PROJECT_ID` بدل معرّف مشروع EAS حقيقي، ولم تكن هناك هوية EAS مسجلة الدخول. لن أضع معرّفًا تخمينيًا أو أنشئ مشروعًا باسم المالك دون إذن. كما أن بيئة التدقيق لا تحتوي Android SDK/`adb` ولا Xcode، وبالتالي لا يمكن هنا تشغيل Gradle لإنشاء APK/AAB موقّع أو بناء iOS موقّع. نجاح `expo prebuild` و`expo export` يثبت سلامة التكوين والـ bundling، لا التوقيع أو النشر.

> قبل تنفيذ `eas build`، يجب على مالك حساب Expo تسجيل الدخول، ربط التطبيق بمشروع EAS الصحيح لاستبدال placeholder، ثم إعداد Android keystore وApple Team ID وشهادات iOS. بعد ذلك ينفذ بناء Preview وProduction على EAS، ثم يختبر على جهاز Android وجهاز iOS حقيقيين، خصوصًا المكالمات وWebRTC وCallKeep.

يوجد تعارض `pip check` في بيئة التدقيق العامة بين `pyhanko` المثبت خارج المشروع ونسخة `cryptography` المقيدة في `backend/requirements.txt`. لا يعتمد المشروع `pyhanko` ولا يستورده؛ وتثبت اختبارات Backend و`compileall` أن اعتماديات المشروع تعمل. يظل عزل Backend في virtual environment أو Docker أفضل ممارسة لمنع حزم البيئة العامة من إظهار تعارضات غير متعلقة بالتطبيق.
