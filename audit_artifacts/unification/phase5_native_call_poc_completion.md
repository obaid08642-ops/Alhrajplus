# المرحلة 5 — إثبات مسار المكالمات React Native الأصلي

## القرار المعماري

اعتمدت المرحلة مسار **WebRTC صوتي 1:1 بين الطرفين** مع خادم TURN عند الحاجة، وليس SFU في هذه الخطوة. هذا يتوافق مع طبيعة المكالمة الحالية الثنائية؛ لا تمر الوسائط عبر Backend بل يمر عبره فقط signaling موثق ومصرح به. تؤدي إضافة SFU قبل إضافة الفيديو أو المكالمات الجماعية إلى عبء تشغيلي وزمن انتقال إضافي من دون منفعة لازمة لمكالمة صوتية بين شخصين.

| طبقة | قرار المرحلة 5 | سبب القرار |
|---|---|---|
| الوسائط | `react-native-webrtc@124.0.6` | نقل `getUserMedia` و`RTCPeerConnection` وSDP وICE إلى React Native أصلي. |
| التهيئة | `@config-plugins/react-native-webrtc@13.0.0` وExpo development build | هذه النسخة موثقة لتوافق Expo SDK 54؛ لا يدعم Expo Go مكوّنات WebRTC الأصلية. [1] [2] |
| الإشارة | إعادة استعمال `/api/ws/chat` | يحتفظ بالخادم القائم الذي يحقق من طرفي المحادثة، الحظر، البلد، وصلاحية الجلسة قبل تمرير `call_invite` وSDP وICE. |
| الاتصال | P2P مع TURN fallback | STUN وحده ليس ضمانًا على شبكات NAT/الشبكات المقيدة؛ يجب تهيئة `TURN_ICE_SERVERS_JSON` قبل الإطلاق. |
| المكالمات الخلفية | CallKit/PushKit على iOS وConnectionService/إشعار وارد على Android في المرحلة 6 | WebSocket لا يوقظ تطبيقًا موقوفًا؛ Apple تتطلب CallKit عند استخدام VoIP PushKit. [3] [4] |

## ما نُفذ

أضيف `NativeVoiceCall.native.js`، وهو POC أصلي لا يستورد `WebView`. يحصل على خوادم ICE المصادق عليها، يلتقط مسار الصوت، ينشئ peer connection، ويرسل ويستقبل offer/answer ومرشحي ICE من خلال عقد الإشارة الموجود. يعالج طابور إشارات بدل الاعتماد على آخر رسالة فقط، حتى لا تضيع مرشحات ICE التي تصل قبل تثبيت الـ remote description.

أضيفت تبعيات Expo المتوافقة وplugin WebRTC إلى الإعداد الديناميكي، وأضيف `expo-dev-client` لأن الاختبار الفعلي يستلزم development build على جهاز حقيقي. كما حدّث وصف إذن الميكروفون ليذكر المكالمات الصوتية والرسائل الصوتية.

ربطت شاشة المحادثة POC خلف `EXPO_PUBLIC_NATIVE_CALL_POC=1`. تبقى القيمة **مطفأة افتراضيًا**؛ لذلك لا تتغير تجربة المستخدم أو مسار WebView القائم قبل اكتمال اختبار جهازين حقيقيين وتوفير TURN. عند تفعيلها، تمر شاشة المحادثة كل إشارات المكالمة إلى المكوّن الأصلي عبر `onSignal={wsSend}`. يستعمل تصدير الويب ملفًا مخصصًا `NativeVoiceCall.web.js` يحافظ على تطبيق Web الحالي، فلا تُضمّن مكتبة WebRTC الأصلية في web bundle.

## ما تم التحقق منه

| الفحص | النتيجة |
|---|---|
| اختبار عقد POC | ناجح — 3 passed |
| اختبارات authorization وICE في Backend | ناجح — 7 passed |
| Expo config الناتج | ناجح — يظهر plugin WebRTC ووصف إذن الميكروفون الصحيح |
| Android prebuild معزول | ناجح — تولد AndroidManifest ويحتوي `RECORD_AUDIO` و`MODIFY_AUDIO_SETTINGS` |
| iOS prebuild معزول | ناجح — تولد `Info.plist` ويحتوي وصف إذن الميكروفون للمكالمات |
| Android JS bundle | ناجح — 6.94 MB؛ جرى تجميع `react-native-webrtc` وPOC بواسطة Metro |
| Mobile web export | ناجح — 4.9 MB؛ يحل ملف `.web.js` بدل المكوّن الأصلي |

## المراجعة والقيود قبل المرحلة 6

لا يثبت compile أو prebuild جودة مكالمة فعلية. اختبار مكالمة 1:1 يتطلب build أصليًا مثبتًا على **جهاز Android حقيقي وجهاز iPhone حقيقي**، كما يتطلب حساب نشر وبيانات مصادقة وجهازين تجريبيين. لم تُنشأ بيانات إنتاج ولم تُعدّل.

قبل تحويل POC إلى البديل الافتراضي وإزالة WebView نهائيًا، يجب أن تتحقق المرحلة 6 من الجدول التالي.

| المتطلب الحاجب | سبب الحجب | إثبات القبول |
|---|---|---|
| TURN حقيقي | يمنع فشل مكالمات NAT المقيد، ولا يكفي STUN وحده | `relay_configured=true` ومكالمة ناجحة بين Wi-Fi وLTE/NAT مقيد. |
| development/production build | Expo Go لا يحمل native WebRTC أو CallKeep | تشغيل POC على جهاز Android فعلي وiPhone فعلي. |
| مكالمة واردة في الخلفية | WebSocket لا يعمل عند إيقاف التطبيق | iOS PushKit + CallKit، وAndroid UX مكالمة واردة مع FSI/ConnectionService. |
| توجيه الصوت | POC الحالي يوفر زر مكبر Android فقط؛ iOS يحتاج تكامل CallKit/audio session | نجاح earpiece/speaker/Bluetooth/سماعة سلكية وعودة audio session بعد الإنهاء. |
| مراقبة الجودة | الادعاء بمستوى منافس يتطلب قياسًا لا تصميمًا فقط | قياس زمن الاتصال، نسبة النجاح، relay rate، jitter، packet loss، وحالات رفض الأذونات. |

## المراجع

[1] [Expo — Introduction to development builds](https://docs.expo.dev/develop/development-builds/introduction/)

[2] [Expo config plugin for react-native-webrtc](https://www.npmjs.com/package/@config-plugins/react-native-webrtc)

[3] [Apple — Responding to VoIP Notifications from PushKit](https://developer.apple.com/documentation/pushkit/responding-to-voip-notifications-from-pushkit)

[4] [Android Open Source Project — Full-screen intent limits](https://source.android.com/docs/core/permissions/fsi-limits)

## نتيجة فحص Expo والتوافق مع البنية الحديثة

بعد توحيد إصدارات Expo SDK 54 وحل ازدواج `expo-constants`، مرّ **17 من 18** فحصًا في Expo Doctor. التحذير الوحيد المتبقي مصدره دليل React Native Directory ويصف `react-native-webrtc` بأنه غير مختبر هناك على New Architecture. لا أخفي هذا التحذير باستثناء اصطناعي. توثق مناقشة المشروع نفسها دعم Old/New Architecture بدءًا من React Native 0.76، كما يوثق README دعم Expo من خلال `expo-dev-client` وconfig plugin؛ لكن يجب اعتبار ذلك **ادعاء توافق للمكتبة لا تحققًا على جهاز الحراج بلس**. لذلك يبقى اختبار Android/iOS الحقيقي مع البنية الافتراضية في Expo SDK 54 بوابة إلزامية في المرحلة 6. [5] [6]

[5] [React Native WebRTC — New Architecture discussion](https://github.com/react-native-webrtc/react-native-webrtc/issues/1557)

[6] [React Native WebRTC — package documentation](https://www.npmjs.com/package/react-native-webrtc)
