# إعادة تدقيق Alhrajplus — قائمة الفجوات المؤكدة ومسودة خطة الإغلاق

> هذه مسودة مبنية على أدلة runtime والكود الحالي. لا تعتبر أي ميزة مكتملة لمجرد نجاح build.

## أولا: أعطال مؤكدة

| المعرّف | المجال | الدليل | الأثر |
|---|---|---|---|
| CONF-01 | Web BottomNav | computed style في runtime أعاد `background: rgba(0,0,0,0)` رغم class `bg-[var(--primary)]/95` | الشريط يظهر شفافًا/أبيضًا ولا يطابق primary |
| CONF-02 | Web API configuration | Console أعاد `[api] BACKEND_URL = (empty!)` عند تشغيل build الحالي | صفحات listings/deals/auctions/chat قد تعرض تعذر أو empty غير صحيح عند غياب runtime config |
| CONF-03 | Web translations | الصفحة الرئيسية في runtime عرضت `Sell, Buy, Rent, Hire` و`Home/Story/Chat/More` | اللغة الافتراضية/حل الترجمة لا يطابق طلب لغة الجهاز/العربية في جلسة الفحص |
| CONF-04 | Mobile StandaloneFloatingTabBar | المكوّن يستخدم `colors.primary` و`colors.primaryDeep` الثابتة ولا يقرأ `palette` الحية، وFAB وborder ثابتان | بعض شاشات Stack مثل Map قد تعرض لونًا مختلفًا عن FloatingTabBar أو أبيض/شفاف |
| CONF-05 | notification deep links | `notifications.js` لا يعالج `/reels` أو `/auctions` أو `/map` أو `/offers` أو `/notifications` | الضغط على إشعار أو deep link لهذه المسارات قد يسقط إلى fallback بدل الشاشة الصحيحة |
| CONF-06 | authenticated staging | اختبارات admin أعادت 401 بسبب بيانات الدخول المضمنة القديمة | chat/private notifications/admin/Cloudinary/Redis لم تُثبت end-to-end |

## ثانيًا: فجوات تنفيذ مؤكدة أو جزئية

| المعرّف | البند | الحالة الحالية |
|---|---|---|
| GAP-01 | Reels Web parity | Web يطلب `/listings?limit=30` ويصفّي `videos` فقط، بينما Mobile يستخدم source buckets تشمل `subcategory=story`؛ لا يوجد parity فعلي في مصدر البيانات |
| GAP-02 | Reels runtime data | Web وMobile يفتحان empty state محليًا، لكن لم يُثبت workflow رفع Story، نشر الفيديو، التشغيل على جهاز حقيقي، أو وجود بيانات video صالحة |
| GAP-03 | Auctions entrypoints | وجود `AuctionsScreen/Page` وroutes لا يثبت أن كل CTA/notification/deep-link يفتحها؛ bid detail وopenBidFor يحتاجان اختبارًا من كل نقطة دخول |
| GAP-04 | Translations | وجود مفاتيح القاموس لا يثبت runtime translation. توجد نصوص ثابتة/alerts وEmoji في ملفات عديدة، ويجب إعادة مسحها بعد build على كل لغة |
| GAP-05 | Bottom navigation parity | يوجد أكثر من implementation: Web BottomNav، Mobile FloatingTabBar، Mobile StandaloneFloatingTabBar. لم تكن موحدة بالكامل، وStandalone bypasses remote palette |
| GAP-06 | Payment/wallet | المحفظة تعرض `قريباً عبر بوابة الدفع`؛ الدفع الحقيقي غير موصول، لذلك لا يجوز اعتباره مكتملًا |
| GAP-07 | Push notification | إعداد foreground/cold-start موجود، لكن route coverage وreal device delivery وclosed-app behavior لم تُثبت |
| GAP-08 | Chat | Web/Mobile يحتويان WebSocket handlers، لكن authenticated two-user test وreconnect/closed-app push/media/voice لم تُثبت على staging |
| GAP-09 | Environment deployment | الكود يدعم runtime `/public/config.js` وbuild env، لكن local runtime أثبت أن BACKEND_URL فارغ عندما لا يمرر Render config؛ لا توجد حماية واجهة كافية تمنع نتائج `تعذر` غير المفسرة |
| GAP-10 | Full route matrix | build/export نجحا، لكن لم تُختبر كل routes وbuttons وforms على Web/Mobile؛ لذلك عبارة "كل الشاشات تفتح" غير مثبتة |

## ثالثًا: ما لا يجوز اعتباره فشلًا قبل بيانات حقيقية

قائمة الصفقات الفارغة من endpoint حقيقي ليست mock data ولا crash. يجب عرض empty state مترجمة، لكن لا يجوز إنشاء صفقات وهمية لإخفاء عدم وجود بيانات.

## رابعًا: خطة الإغلاق الإلزامية

1. **تثبيت بيئة الاختبار:** توفير `REACT_APP_BACKEND_URL` أو `window.__APP_CONFIG__.BACKEND_URL` في Web، و`EXPO_PUBLIC_BACKEND_URL` في Mobile، وتسجيل القيم الفعلية دون أسرار.
2. **إصلاح البنية المشتركة أولًا:** إزالة alpha syntax غير المولدة من Tailwind أو تحويل لون الشريط إلى inline CSS variable، وتوحيد StandaloneFloatingTabBar مع palette الحية، ثم اختبار computed styles.
3. **إصلاح اللغة:** جعل أول render يتبع device locale، إضافة آلية reset إلى system، واختبار العربية والإنجليزية ولغتين RTL/LTR على runtime لا على القاموس فقط.
4. **إصلاح route/deep-link matrix:** اختبار كل route من TopBar/Home/BottomNav/Profile/Notification/URL، وإضافة handlers المفقودة لـReels/Auctions/Map/Offers/Notifications.
5. **إغلاق Reels/Auctions:** توحيد API source بين Web/Mobile، إضافة loading/error/empty، واختبار upload/play/back/close/favorite/share/contact وbid/openBidFor.
6. **تدقيق API/forms:** ربط كل شاشة بالendpoint الصحيح، تسجيل status/body في حالة الفشل، ومراجعة حقول register/post/listing/auction/offer/chat.
7. **اختبار authenticated staging:** يتطلب حساب staging أو token صالحًا لاختبار chat, notifications, profile, admin, Cloudinary deletion, Redis, push.
8. **Regression matrix:** Web desktop/mobile viewport، Expo web، Android/iOS device run، RTL/LTR، light/dark/system، logged-in/guest، success/error/empty.
9. **تحديث المصفوفة والرفع:** لا تُرفع `main` إلا بعد أن يكون لكل بند دليل اختبار أو حالة blocked موثقة بوضوح.

## أدلة Runtime إضافية من إعادة التدقيق

| المعرّف | المسار/المكوّن | النتيجة المؤكدة |
|---|---|---|
| CONF-07 | Web `/map` | AppErrorBoundary؛ console: `TypeError: a.map is not a function` في MapPage بعد `setItems(data)` بدون guard |
| CONF-08 | Web `/register` | AppErrorBoundary؛ console: `TypeError: X.find is not a function` بعد وضع `/meta/countries` response مباشرة في state |
| CONF-09 | Web `/post` | AppErrorBoundary في نفس build؛ PostListing يستخدم `categories.find` و`countries.find` ويحتاج response validation وAPI config |
| CONF-10 | Web `/reels` | المسار يفتح empty state محليًا، لكن مصدر Web يختلف عن Mobile ولا يثبت upload/play/device flow |
| CONF-11 | Web `/auctions` | المسار يفتح empty state، لكن authenticated bid/deep-link flow غير مثبت |

## ترتيب الإصلاح حسب الخطورة

1. منع انهيار الشاشات: API base/config، response-shape guards، AppErrorBoundary recovery، ثم Map/Register/Post.
2. إصلاح BottomNav computed color وإزالة Tailwind alpha syntax غير المولدة، وتوحيد StandaloneFloatingTabBar مع palette.
3. إصلاح اللغة الافتراضية والـruntime translation resolution.
4. إكمال route/deep-link matrix للقصص والمزادات والخريطة والعروض والإشعارات.
5. توحيد Reels API source وفتح/رفع/تشغيل الفيديو، ثم bid flows وforms.
6. بعد ذلك فقط تتم مراجعة بقية الأزرار والترجمات والـresponsive/push/private flows.
