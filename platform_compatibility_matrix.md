# مصفوفة توافق Alhrajplus — Web وReact Native

## منهجية الحكم

لا تكفي نتيجة Expo export أو Web build لإثبات التوافق مع كل الأجهزة. تعتمد هذه المصفوفة على ثلاثة مستويات: **تم التحقق محليًا**، **قابل للاختبار عبر emulator/simulator**، و**يتطلب جهازًا وخدمة staging فعلية**. لا يُعتمد الإصدار الإنتاجي إلا بعد مرور المسارات الحرجة في المستوى الثالث.

| المنصة | نطاق التغطية المطلوب | ما تم التحقق منه حاليًا | ما يزال مطلوبًا |
|---|---|---|---|
| Web desktop | Chromium/Edge/Firefox/Safari، 1280–1920px | React mount، الصفحة الرئيسية، service worker `/sw.js`، Web build | Safari/Firefox الفعلي، Web Push على Chrome/Safari، Lighthouse وCore Web Vitals |
| Web tablet | 768–1024px، portrait/landscape | CSS build وresponsive classes compilation | اختبار بصري كامل لكل route وkeyboard/touch |
| Web mobile | 320–430px، Android Chrome وiOS Safari | Web build وsmoke desktop؛ responsive code موجود | اختبار iPhone SE/standard/Pro Max وAndroid narrow viewport وPWA install |
| Android | Android 10–15، phone/tablet، low/mid/high DPI | Expo web export، JS bundling، notification/deep-link code review | APK/AAB على أجهزة حقيقية، cold start push، background/terminated push، camera/location/audio، back gesture |
| iOS | iOS 15+، iPhone SE إلى Pro Max وiPad | Expo export، notification/deep-link code review؛ Dubizzle نفسه يعلن iOS 15+ كمرجع توافق [1] | Xcode build/TestFlight، APNs permission، terminated push، universal links، audio/keyboard/safe area |
| Huawei | EMUI/HarmonyOS حسب خدمة HMS المتاحة | مسارات React Native العامة فقط | APK/HMS أو build مدعوم، Huawei Push Kit، maps/location، deep links، متجر AppGallery |

## مسارات القبول الإلزامية

يجب اختبار التسجيل وتسجيل الدخول، اكتشاف اللغة والثيم والدولة، البحث والاقتراحات، فتح الفئة والـ subcategory، نشر إعلان لكل vertical، رفع صور وفيديو، تفاصيل الإعلان، Like، Favorite، Comment، View count، Share، Call، WhatsApp، Chat، Make Offer، قبول/رفض العرض، متابعة البائع، صفحة البائع، الإشعار، الضغط على الإشعار إلى الإعلان أو الشات، auction، saved search، logout، token refresh، وإعادة الاتصال بعد قطع الشبكة.

## معايير الأداء

يجب قياس زمن أول رسم، زمن ظهور نتيجة البحث، زمن فتح تفاصيل الإعلان، زمن تسليم رسالة WebSocket داخل جلسة مفتوحة، زمن وصول Push من staging، crash-free sessions، memory growth، وحجم bundle. لا تُسجل قيمة 9.8 أو 9.9 إلا إذا كانت الأرقام موثقة على عينات حقيقية وبـ p95، مع عدم وجود فشل حرج في المسارات السابقة.

## ملاحظات تشغيلية

Push للموبايل يحتاج Expo/APNs/FCM أو build native مناسب، وPush للويب يحتاج VAPID وHTTPS وservice worker. لا يمكن إثبات وصول الإشعار عند إغلاق التطبيق من داخل sandbox وحده. كذلك لا يمكن إثبات Huawei Push بدون حساب/مفاتيح HMS أو جهاز Huawei فعلي.

## المراجع

[1] [Dubizzle App Store listing](https://apps.apple.com/us/app/dubizzle/id892172848?l=es-MX)

[2] [OpenSooq official platform](https://www.opensooq.com/en)
