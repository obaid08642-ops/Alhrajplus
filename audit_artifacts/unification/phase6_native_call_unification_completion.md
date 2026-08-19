# المرحلة 6 — توحيد المكالمات وإزالة WebView

## النتيجة

أزيل مكوّن المكالمات القائم على `WebView` من تطبيق Mobile نهائيًا. صار مسار المكالمة الصوتية في Android وiOS يستخدم **React Native WebRTC** للوسائط و**CallKeep** لواجهة نظام الاتصال. لا يستخدم التطبيق صفحة `voice-call.html` أو مكوّن WebView للمكالمات بعد هذه المرحلة.

> تظل WebView الخاصة بالخريطة والنماذج ثلاثية الأبعاد خارج نطاق هذه المرحلة، وستزال في المرحلة 7. لم يبقَ أي مرجع `VoiceCallWebView` في Mobile.

| طبقة المكالمة | التنفيذ الحالي | ضمان التوافق |
|---|---|---|
| الصوت وWebRTC | `NativeVoiceCall.native.js` مع `react-native-webrtc` | يحصل على الميكروفون، ينشئ `RTCPeerConnection`، ويرسل/يستقبل SDP وICE عبر قناة الإشارة القائمة. |
| مكالمات النظام | `react-native-callkeep@4.3.16` مع plugin SDK 54 | CallKit في iOS وConnectionService في Android للمكالمة الصادرة والواردة وإنهائها والمسار الصوتي. [1] [2] |
| معرف الجلسة | `expo-crypto.randomUUID()` | معرف UUID v4 آمن ومتوافق مع CallKeep بدل معرفات نصية مخصصة. [3] |
| الاستيقاظ من Push | ممر استرداد إشارات محدود العمر | يمرر Push معرف المكالمة؛ عند فتحه يسترد العميل SDP/ICE المخزن والمصرح به فقط. |
| Web | `NativeVoiceCall.web.js` مترجم خالٍ من WebView | هدف Expo Web معاينة فقط؛ موقع Web له واجهة الاتصال الخاصة به. |

## تفاصيل التنفيذ

استبدلت شاشة Chat اختيار POC التجريبي بمكوّن `NativeVoiceCall` دائم في تطبيق Native، وحذفت ملف `mobile/src/components/VoiceCallWebView.js`. يستعمل الاتصال الصادر UUID واحدًا في CallKeep وجلسة الإشارة، كما تربط حالات اتصال WebRTC بـCallKeep: تحدد Android المكالمة نشطة عند وصول الصوت ثنائي الاتجاه، وتسجل iOS الاتصال الصادر متصلًا، وتزامن كتم الميكروفون ومكبر الصوت مع طبقة النظام عند دعم المنصة.

أضيفت طبقة `mobile/src/calls/nativeCallSystem.native.js`. وهي لا تتعامل مع الوسائط؛ بل تدير CallKit/ConnectionService، وتعيد أحداث القبول والإنهاء والكتم إلى Chat، وتحفظ وصفًا محدودًا للمكالمة في الذاكرة. تمرر Chat نصوص CallKeep عن طريق `t()` بدل تثبيت لغة عربية داخل النظام، بما يطابق لغة التطبيق/الجهاز مع fallback المشروع.

عالجت المرحلة خطأ العلامة الافتراضية في plugin CallKeep. ينشئ `mobile/plugins/withCallKeepBranding.js` الآن خدمة Android بعنوان `@string/app_name` بدل `Wazo` ويضيف `FOREGROUND_SERVICE_MICROPHONE` و`FOREGROUND_SERVICE_PHONE_CALL`. أكد prebuild المعزول وجود خدمة `VoiceConnectionService` بالنوع `phoneCall|microphone` والصلاحيات المطلوبة.

## استرداد مكالمة واردة

يؤدي إشعار المكالمة الواردة الآن إلى Route يحمل `to` و`convo` و`call_id`. ينشئ Backend جلسة مكالمة قصيرة العمر وبها `pending_signals` محدودة إلى 64 حدثًا. لا يحفظ Invite أو Hangup، بل يحفظ offer/answer/ICE فقط إلى الطرف المقصود، وتعيد `GET /api/voice/calls/{call_id}/signals` الإشارات الموجهة للمستخدم المصادق عليه فقط. لا يمكن لطرف غير مشارك قراءتها؛ كما لا تعاد بعد انتهاء الجلسة. وبذلك لا تضيع offer أو ICE إن فتح المستقبل التطبيق من Push بعد أن كان WebSocket غير متصل.

| سيناريو | السلوك المنفذ |
|---|---|
| المستقبل داخل Chat | تصل `call_invite` عبر WebSocket وتظهر واجهة CallKeep أو Alert داخل التطبيق إذا لم تتوفر واجهة النظام. |
| المستخدم يضغط Push | تفتح Chat بالـ `call_id`، تسترجع الإشارات المخولة، ثم تظهر واجهة CallKeep/واجهة التطبيق لقبول أو رفض المكالمة. |
| المستخدم غير مشارك | يعيد Backend `403` ولا يعرض أي SDP أو ICE. |
| الجلسة انتهت | يعيد API قائمة إشارات فارغة؛ لا يعيد إحياء مكالمة منتهية. |

## الاختبارات المنفذة

| بوابة التحقق | النتيجة |
|---|---|
| اختبار استرجاع الإشارات وحجب غير المشاركين | ناجح — 5 passed |
| اختبار عقد إزالة WebView وCallKeep وPush recovery | ناجح — 3 passed |
| بوابة Backend الحتمية الكاملة | ناجح — 103 passed |
| اختبارات Web | ناجح — 19 passed في 5 suites |
| Web production build | ناجح |
| Android JavaScript bundle | ناجح — 6.97 MB |
| Mobile Web export | ناجح — 4.91 MB |
| Android prebuild المعزول | ناجح — خدمة CallKeep بعلامة التطبيق والصلاحيات الحديثة |
| iOS prebuild المعزول | ناجح — `NSMicrophoneUsageDescription` و`UIBackgroundModes: voip` |
| Expo Doctor | 17/18؛ التحذير المتبقي: دليل React Native Directory لا يسجل اختبار New Architecture لـ`react-native-webrtc` و`react-native-callkeep` |

## القيود وبوابة الإطلاق

لا يعد prebuild أو Metro اختبارًا لصوت حقيقي. ظهر أثناء Android Metro تحذير resolver غير حاجب من `event-target-shim/index` داخل اعتماد WebRTC؛ أكمل Metro الحزمة بنجاح، لكنه يبقى ضمن اختبار الجهاز الفعلي قبل التفعيل العام. لا يمكن الادعاء بمستوى FaceTime أو Messenger أو Emo قبل قياس مكالمات حقيقية. يجب قبل تفعيل الإصدار للمستخدمين تنفيذ اختبار Android حقيقي واختبار iPhone حقيقي، مع شبكة Wi-Fi ثم LTE/NAT مقيد، وتسجيل وقت الاتصال ونسبة نجاح ICE والـ jitter وفقد الحزم ومكبر الصوت والسماعات السلكية وBluetooth.

لا يكفي Expo Push لإيقاظ تطبيق iOS موقوف وعرض CallKit دون تفاعل المستخدم. يلزم في خطوة إطلاق مكالمات الخلفية الكاملة إعداد VoIP PushKit entitlement وخادم موفر PushKit وسياسة Apple المناسبة. أُنجز هنا مسار فتح Push واسترداد الإشارات؛ ولم تضاف مفاتيح Apple أو بيانات إنتاج أو إعداد TURN سري. كما يبقى TURN عاملاً حاجبًا لموثوقية الاتصالات عبر NAT المقيد؛ يجب إعداد `TURN_ICE_SERVERS_JSON` وتشغيل اختبار relay حقيقي قبل التفعيل العام. [1] [4]

## المراجع

[1] [React Native CallKeep — NPM documentation](https://www.npmjs.com/package/react-native-callkeep)

[2] [Expo config plugin for React Native CallKeep](https://www.npmjs.com/package/@config-plugins/react-native-callkeep)

[3] [Expo Crypto — randomUUID](https://docs.expo.dev/versions/latest/sdk/crypto/)

[4] [Apple — Responding to VoIP notifications from PushKit](https://developer.apple.com/documentation/pushkit/responding-to-voip-notifications-from-pushkit)
