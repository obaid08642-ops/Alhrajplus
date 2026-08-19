# المرحلة 5 — ملاحظات إثبات مسار المكالمات الأصلية

## الحقائق الموثقة حتى الآن

يعتمد Mobile حاليًا على `VoiceCallWebView` الذي يحمّل `voice-call.html` عن بُعد. يحافظ هذا المسار على مكالمة صوتية WebRTC ثنائية الطرف: يجلب خوادم ICE من `GET /voice/ice-servers`، يحصل على ميكروفون، وينقل `call_invite` و`call_offer` و`call_answer` و`call_ice` و`call_reject` و`call_hangup` عبر `/api/ws/chat`.

Backend لا يمرر الوسائط الصوتية؛ بل يتحقق من طرفي المحادثة، البلد، الحظر، وصلاحية جلسة مكالمة قصيرة العمر، ثم يمرر إشارات WebRTC فقط. نقطة ICE تبدأ بـSTUN وتدعم TURN من متغير البيئة `TURN_ICE_SERVERS_JSON` للمستخدمين المصادق عليهم.

يدعم مشروع Expo SDK 54 إمكانية `react-native-webrtc` عبر الإصدار المتوافق `124.0.6` وconfig plugin `13.0.0`، لكن لا يمكن تشغيله في Expo Go لأنّه يحتاج شفرة أصلية. يلزم development build بعد إضافة `expo-dev-client` والمكتبات الأصلية، ويعاد البناء كلما تغيرت dependencies الأصلية أو `app.json`. كما أن CallKeep يحتاج development build ويعمل فقط على أجهزة حقيقية؛ محاكيات iOS/Android لا تثبت تجربة CallKit/ConnectionService كاملة.

## الاستنتاج المبدئي

للصوت 1:1 الحالي، تبقى البنية المناسبة **P2P WebRTC مع TURN إلزامي للإنتاج عند تعذر المسار المباشر**. لا تحتاج المكالمة الصوتية الثنائية إلى SFU لكي تتصل؛ إدخال SFU في هذه المرحلة يضاعف متطلبات التشغيل دون فائدة لجودة مكالمة 1:1. تُعزل طبقة `CallSession` الأصلية خلف عقد إشارات قائم كي يمكن استبدال مسار الوسائط بمزوّد SFU لاحقًا عند إضافة مجموعات أو فيديو متعدد المشاركين.

## نقاط يجب التحقق منها قبل اعتماد الـ POC

| المجال | المطلوب |
|---|---|
| حزمة Mobile | التحقق من توافق `react-native-webrtc@124.0.6` و`@config-plugins/react-native-webrtc@13.0.0` مع Expo SDK 54 وReact Native 0.81. |
| الصوت | استبدال تحكم الصوت في WebView بمسار أصلي يدعم mute وسماعة الأذن/المكبر والتنظيف عند الإغلاق. |
| الاتصالات الواردة | تصميم تكامل CallKeep مع push data-only موثوق؛ لا يكفي WebSocket عندما يكون التطبيق في الخلفية أو موقوفًا. |
| TURN | توفير TURN حقيقي وإخراج قياس `relay_configured` قبل أي إطلاق للمكالمات؛ STUN وحده ليس ضمانًا للشبكات المقيدة. |
| الاختبار | الاختبار على جهاز Android حقيقي وiPhone حقيقي، وبين Wi-Fi وLTE، ومع NAT مقيد، مع قياس زمن الاتصال وفشل الميكروفون والمسارات الصوتية. |

## مصادر أولية

1. [Expo — Introduction to development builds](https://docs.expo.dev/develop/development-builds/introduction/)
2. [Expo config plugin for react-native-webrtc](https://www.npmjs.com/package/@config-plugins/react-native-webrtc)
3. [React Native CallKeep](https://www.npmjs.com/package/react-native-callkeep)

## متطلبات المكالمات الواردة في الخلفية

لا يكفي WebSocket للحالات التي لا يكون فيها التطبيق نشطًا. توثق Apple أن VoIP PushKit يوقظ التطبيق، وأن تطبيقات iOS 13 SDK وما بعده تستخدم CallKit عند معالجة VoIP pushes، مع معرّف مكالمة فريد ومدة انتهاء قصيرة للطلب. وعلى Android 14 وما بعده، تكون نية الإشعار بكامل الشاشة مخصصة لتطبيقات الاتصال أو المنبه، مع فحص قدرة المستخدم على منحها واختبار حالتي المنح والرفض.

بناءً على ذلك، يعد مسار المرحلة 6 **واجهة مكالمة داخل التطبيق عند النشاط + إشعار نظام مكالمة واردة عند الخلفية**. لا يجوز الادعاء بمستوى مكالمات منافس قبل ربط iOS PushKit/CallKit وAndroid incoming-call notification/ConnectionService واختبارها على أجهزة فعلية. يظل الإشعار العادي المؤقت fallback مرئيًا، لكنه ليس مكافئًا لسلوك مكالمة واردة أصلية.

### مصادر إضافية

4. [Apple — Responding to VoIP Notifications from PushKit](https://developer.apple.com/documentation/pushkit/responding-to-voip-notifications-from-pushkit)
5. [Android Open Source Project — Full-screen intent limits](https://source.android.com/docs/core/permissions/fsi-limits)
