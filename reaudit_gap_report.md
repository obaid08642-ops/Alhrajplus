# تقرير إعادة تدقيق Alhrajplus

## الغرض

هذا التقرير يصحح الادعاء السابق بأن المشروع مكتمل. بعد فحص runtime فعلي للنسخة المبنية، ومراجعة مسارات Web وMobile، وقراءة مصفوفة المتطلبات، تبين أن عددًا من البنود كان منفذًا جزئيًا فقط، وأن بعض الشاشات تنهار بسبب أخطاء response-shape وتهيئة الـBackend.

> **قاعدة التقرير:** نجاح build لا يعني أن الشاشة تفتح أو أن المسار يعمل. الإغلاق يحتاج فتح route، استجابة API صحيحة، حالات loading/error/empty، تجربة guest/authenticated، ترجمة، وWeb/Mobile parity.

## الأعطال المثبتة في runtime

| ID | المسار/المكوّن | الدليل المباشر | الأولوية |
|---|---|---|---|
| C01 | Web BottomNav | computed style أعاد `background: rgba(0,0,0,0)` رغم وجود class للـprimary؛ ألوان العناصر أصبحت navy على خلفية شفافة | P0 |
| C02 | Web API config | console أعاد `[api] BACKEND_URL = (empty!)` في build المحلي | P0 |
| C03 | Web `/map` | AppErrorBoundary؛ console: `TypeError: a.map is not a function` | P0 |
| C04 | Web `/register` | AppErrorBoundary؛ console: `TypeError: X.find is not a function` | P0 |
| C05 | Web `/post` | AppErrorBoundary في نفس build، والحقول لا تظهر | P0 |
| C06 | Web language runtime | الصفحة الرئيسية عرضت `Sell, Buy, Rent, Hire` و`Home/Story/Chat/More` في جلسة الفحص | P0 |
| C07 | Mobile StandaloneFloatingTabBar | يستخدم `colors.primary` و`colors.primaryDeep` الثابتة، ولا يقرأ `palette` من ThemeModeProvider | P0 |
| C08 | Notification routing | لا توجد handlers صريحة لمسارات `/reels`, `/auctions`, `/map`, `/offers`, `/notifications` | P1 |
| C09 | Authenticated staging | اختبارات admin أعادت 401؛ chat/private notifications/admin/Redis/Cloudinary/push لم تُثبت | P1 |

## مصفوفة المطالب والحالة الحقيقية

| المطلب | الحالة بعد إعادة التدقيق | ما يلزم لإغلاقه |
|---|---|---|
| إزالة mock/demo/stale data | **جزئي** | scan نهائي للواجهات والـfallbacks، وحذف التعريفات الوهمية غير المستخدمة دون حذف metadata الحقيقية |
| توحيد لون TopBar/BottomNav/FloatingTabBar/FAB | **غير مغلق** | إصلاح C01، توحيد Standalone، computed-style test في light/dark/system وعلى Web/Mobile |
| المزادات العامة | **جزئي** | Web/Mobile يفتحان empty state، لكن bid من كل CTA وnotification وopenBidFor وحساب الحد الأدنى يحتاج regression/auth test |
| تفاصيل المزاد والمزايدة | **جزئي** | إثبات history/current price/min increment/expiry/bid/counter على بيانات staging وحسابين |
| القصص والفيديو | **جزئي** | Web مصدره `/listings?limit=30` ويصفّي videos، Mobile يستخدم buckets تشمل `subcategory=story`; يلزم توحيد المصدر واختبار upload/play/back/close على جهاز |
| carousel/swipe للبطاقات | **منفذ جزئيًا** | اختبار favorite/open/card touch على Web وAndroid/iOS، وتأكيد عدم تعارض swipe مع scroll والدقة |
| روابط تحميل التطبيقات | **بنية جاهزة فقط** | وضع روابط حقيقية في Render/EAS، build فعلي، اختبار disabled state وعدم وجود placeholder |
| صفحة الإعلان | **جزئي** | اختبار seller/actions/reviews/views/favorites/comments/share/call/chat/3D في guest/authenticated وRTL/LTR |
| الدولة التلقائية | **منفذ جزئيًا** | إعادة اختبار locale/IP failure/manual override/persistence على Web/Mobile؛ SA fallback موجود في الكود |
| الترجمات | **غير مغلق** | runtime matrix لكل اللغات، إزالة الثوابت والـalerts وaccessibility strings، وفحص النصوص الإنجليزية/العربية الثابتة |
| Profile والـphone | **منفذ جزئيًا** | اختبار permission/validation/visibility/status/counts على staging بحساب فعلي |
| Vector/Emoji | **منفذ جزئيًا** | inventory موجود لكن بقيت مواضع Emoji/alerts/metadata، ويجب إغلاق كل عنصر مرئي أو توثيق استثناءه |
| Hero headline | **منفذ جزئيًا** | runtime language test؛ النص الإنجليزي ظهر في جلسة العربية، ويجب إصلاح initialization/translation resolution |
| TopBar/safe areas | **جزئي** | responsive matrix على viewport وأجهزة فعلية، مع مراجعة stack screens وkeyboard/notch |
| Deals | **API حقيقي لكنه فارغ** | إبقاء empty state، اختبار بيانات فعلية عند توفرها، وعدم إضافة mock cards |
| Home | **جزئي** | API failure guards، pagination/performance، sections/filters، والترجمة runtime |
| Flights | **واجهة/روابط جزئية** | اختبار provider links، validation، fallback واضح، وترجمة tooltips/labels |
| Chat list | **جزئي** | WebSocket/authenticated test، unread/search/presence/deep links، وعدم الاعتماد على polling وحده |
| Chat thread | **جزئي** | حسابان staging، reconnect/read/typing/media/voice/reactions/push/cold-start |
| الاختبارات الشاملة | **غير مغلق** | route matrix، forms، error states، Web/Mobile/device/RTL/LTR/light/dark |
| staging Render | **عام فقط** | public endpoints نجحت، لكن private integrations والـadmin ما زالت blocked بسبب 401 |
| GitHub/report | **غير نهائي لهذه الجولة** | لا رفع بعد إعادة التدقيق؛ يُرفع فقط بعد إغلاق البنود أو وسمها blocked بوضوح |

## أسباب الجذور الظاهرة حتى الآن

أولًا، `frontend/src/lib/api.js` يسمح بأن يكون `BACKEND_URL` فارغًا، ثم يكوّن `API_BASE` على `/api`؛ في بيئة misconfigured يؤدي ذلك إلى response غير متوقع من خادم الواجهة. ثانيًا، MapPage وRegisterPage وPostListing تثق في أن response دائمًا array وتستدعي `.map` أو `.find` بلا validation. ثالثًا، BottomNav يستخدم صيغة Tailwind alpha مع CSS variable لم تنتج background فعليًا في build، بينما StandaloneFloatingTabBar يتجاوز palette الديناميكية. رابعًا، وجود قاموس ترجمة لا يضمن أن النص الذي يمر إلى `tr()` له entry أو أن اللغة المختارة فعليًا هي لغة الجهاز عند أول render.

## خطة التنفيذ الجديدة ومعايير القبول

### المرحلة 1 — تثبيت البيئة ومنع الشاشات المنهارة

يتم توحيد `BACKEND_URL` عبر runtime config موثق، وإظهار شاشة إعداد واضحة عند غيابه، ثم إضافة `Array.isArray`/object guards لكل endpoint يستخدم `.map/.find`، مع loading/error/empty states. معيار القبول: `/map`, `/register`, `/post`, `/category`, `/listing` تفتح بدون AppErrorBoundary مع backend صحيح وخاطئ.

### المرحلة 2 — إصلاح اللغة والثيم والتنقل المشترك

يتم إصلاح اللغة قبل أول render، وإضافة reset-to-system، واختبار العربية والإنجليزية وRTL/LTR. يتم تحويل BottomNav إلى style يعتمد CSS variables مباشرة، وتوحيد Mobile FloatingTabBar وStandalone مع palette واحدة. معيار القبول: computed background ليس شفافًا، يساوي primary الحقيقي، وactive/inactive contrast صحيح في light/dark/system.

### المرحلة 3 — route and deep-link matrix

يتم اختبار كل route من Home وTopBar وBottomNav وProfile وNotification وURL، وإضافة routing صريح لـReels/Auctions/Map/Offers/Notifications، مع back/close. معيار القبول: كل route يفتح من كل entrypoint ولا يسقط إلى fallback.

### المرحلة 4 — Reels/Stories وAuctions

يتم توحيد مصدر القصص بين Web/Mobile، ثم اختبار upload/play/mute/scroll/back/close/favorite/share/chat وempty/error. للمزادات يتم اختبار active list/detail/history/min increment/expiry/bid/counter/openBidFor من الإعلان والإشعار. معيار القبول: بيانات حقيقية أو empty state واضحة، ولا يوجد CTA dead.

### المرحلة 5 — إنشاء الإعلان والحقول والملف الشخصي

تُراجع كل الفئات والـsubcategories والحقول وقوائم الاختيار، ثم guest/authenticated/edit/republish/delete/media/GLB flows. يراجع Profile phone visibility/counts/status/reviews/referrals. معيار القبول: submit error لا يسقط الشاشة، وكل field validation مترجم ومطابق للـbackend schema.

### المرحلة 6 — Chat/Notifications/Deals/Flights/Wallet/Admin

يتم اختبار حسابين staging للشات والـread/typing/reconnect/media/voice/reactions، ثم push foreground/background/cold-start، وإغلاق Cloudinary، Redis، admin analytics، referrals، bulk cleanup. Deals وFlights وWallet تظهر only real data أو unavailable state واضحًا. معيار القبول: كل زر يملك handler حقيقي أو disabled state موثق.

### المرحلة 7 — Vector/translation/accessibility sweep

يُعاد scan parser-based لكل Emoji والـraw strings والأزرار، وتستبدل العناصر المرئية بـLucide/SVG/vector، بينما Emoji user-content تُترك فقط داخل message data. تُراجع labels وARIA وscreen-reader strings. معيار القبول: لا نص UI غير مترجم في اللغات المدعومة ولا رمز بصري غير مبرر.

### المرحلة 8 — Regression وstaging وrelease gate

تُشغل Web build، Expo export، backend syntax، API smoke، route matrix، authenticated tests، responsive viewport matrix، ثم تُحدّث مصفوفة المتطلبات. معيار القبول النهائي هو 100% من البنود إما `PASS` بدليل أو `BLOCKED` بسبب صلاحية/خدمة خارجية موثقة؛ لا توجد حالة `نفذناها` بلا دليل.

## متطلبات staging اللازمة لإغلاق الجزء المحجوب

نحتاج حساب staging صالحًا أو access token لاستخدام auth flows. كما يجب التأكد من وجود قيم Cloudinary وRedis وpush provider وروابط المتاجر في Render/EAS. لن يتم اختلاق أي بيانات أو تجاوز صلاحيات.

## ملفات الأدلة

- `reaudit_runtime_findings.md`
- `reaudit_gap_report_draft.md`
- `reaudit_visible_strings.md`
- `requirements_traceability_pasted_12.md`

## سجل التنفيذ — 16 أغسطس 2026

تم تنفيذ وإعادة بناء حزمة إصلاحات P0 التالية:

| البند | الإصلاح | دليل التحقق |
|---|---|---|
| Web BottomNav | أصبح لون الخلفية يقرأ `var(--primary)` مباشرة، مع active/inactive styles واضحة بدل alpha utility التي أنتجت شفافية في build | `frontend/src/components/layout/BottomNav.js` + Web production build ناجح |
| Web API config | أصبح `API_BASE` يقبل host أو host/api، ينظف trailing slash، ويعود إلى same-origin `/api` عند غياب المتغير | `frontend/src/lib/api.js` + build ناجح |
| Web Map | guards على array/object response وحالات loading/error، ومنع `.map` غير الآمن | `frontend/src/pages/SearchAndMap.js` |
| Web Register | guards على countries، fallback سعودي آمن، وحماية cities من response غير مصفوفة | `frontend/src/pages/Auth.js` |
| Web Post | guards على categories/countries و`.find/.map`، مع رسائل خطأ قابلة للعرض | `frontend/src/pages/PostListing.js` |
| Web Deals | تحويل response إلى array، error state، وعدم استخدام mock cards | `frontend/src/pages/DealsPage.js` |
| Mobile tab bar | استخدام palette الديناميكية في StandaloneFloatingTabBar بدل colors الثابتة | `mobile/src/components/StandaloneFloatingTabBar.js` |
| Mobile notifications | handlers صريحة لـ Reels/Stories وAuctions/Map/Offers/Deals | `mobile/src/notifications.js` |

**التحقق التجميعي:** Web `craco build` نجح مع عدم وجود compile errors، وExpo `export --platform web` نجح. لم تُغلق بعد اختبارات staging الخاصة بالحسابات، WebSocket/push، Cloudinary، Redis، Admin، والأجهزة الفعلية؛ لذلك ما زالت هذه البنود `BLOCKED/PARTIAL` حتى تتوفر صلاحية staging وأدلة تشغيل فعلية.

## قواعد الإغلاق الحالية

لا يُعتبر أي feature مكتملًا لمجرد وجود component أو endpoint. الإغلاق يحتاج مسارًا قابلًا للفتح، API حقيقيًا أو empty state واضحًا، حالات loading/error، ترجمة، guest/authenticated behavior، deep-link، واختبار Web/Mobile مناسب. لا توجد بيانات demo جديدة في الإصلاحات الحالية.

### نتيجة الجولة الثانية

أُضيف handler صريح لمسار `/notifications` في Mobile، مع دعم الروابط المطلقة التي يرسلها backend وتطبيعها إلى path داخلي، ثم أُعيد تشغيل Expo export بنجاح. كما تم التأكد من أن backend يملك endpoints فعلية لـ`/notifications`, `/push/register`, `/auctions`, و`/listing-offers`، وأن تسجيل Expo token يعتمد على user authentication.

اختبارات `pytest` الخاصة بالbackend لم تستطع تنفيذ integration لأنها مبرمجة افتراضيًا على `127.0.0.1:8000` والخادم المحلي غير مشغّل في البيئة الحالية؛ هذا **ليس فشلًا مثبتًا في الكود** ولا يجوز اعتباره نجاح staging. يلزم تشغيل backend أو استخدام URL staging صالح مع حسابات اختبار قبل إغلاق chat/push/admin/Cloudinary/Redis.

### منع البيانات الوهمية في الإدارة

تم تعديل `DataIntegrityPanel` بحيث لا يعرض أصفارًا افتراضية عند فشل `/admin/data-integrity`. أصبحت النتيجة حالة خطأ صريحة، لأن عرض «لا توجد مشاكل» عند تعذر الاتصال كان قد يعطي انطباعًا مضللًا عن سلامة البيانات. كما تم إغلاق آخر ESLint warning في Auth، ونجح Web production build بـ`Compiled successfully` دون تحذيرات.

### جولة البحث والخريطة

تمت حماية `SearchPage` من استجابة `/listings` غير المصفوفية، مع الحفاظ على empty state الحقيقي وعدم اختلاق نتائج. كما تمت تصفية markers التي لا تملك lat/lng رقمية وتحويل الإحداثيات قبل تمريرها إلى Leaflet. نجح Web production build بعد التعديل.

### حماية صفحة الإعلان

تم تطبيع response صفحة الإعلان قبل عرضه: `listing.images`, `listing.videos`, `custom_fields`, `similar`, `categories`, `comments`, و`watches` أصبحت تمر عبر guards حقيقية. كما تمت حماية Leaflet/search سابقًا من malformed data. نجح Web production build بعد ذلك. هذا يغلق crash class على مستوى الكود، لكنه لا يغلق اختبار المسار authenticated أو Cloudinary/3D أو تزامن التعليقات دون staging حقيقي.

### حماية Web Chat

تم تطبيع responses الخاصة بالمحادثات والرسائل والتحميل الأقدم إلى arrays قبل استخدام `find`, `map`, أو تحديث state. هذا يمنع crash عند اختلاف envelope بين backend والإصدارات القديمة، مع الإبقاء على WebSocket/typing/read flow كما هو. نجح Web production build بعد التعديل؛ اختبار حسابين فعليين وإعادة الاتصال وpush ما زال يحتاج staging authenticated.

### حماية Mobile Chat

تم توحيد تطبيع conversations/messages/history وForwardPicker في `mobile/src/screens/ChatScreen.js` إلى arrays قبل العرض، دون إزالة WebSocket أو outbox أو read receipts. نجح `npx expo export --platform web` بعد التعديل. لا يزال اختبار Android/iOS/Huawei الحقيقي، background push، cold-start، وإعادة الاتصال بحاجة أجهزة/حسابات staging فعلية.

### حماية Web Auctions

تم تطبيع قائمة المزادات النشطة وbid history إلى arrays مع error handling، وتطبيع `top_bid` قبل الحساب، مع بقاء تحديثات WebSocket الحية وفتح BidDialog من query param. نجح Web production build. لا يزال إثبات bid lifecycle، minimum increment، expiry، history، notifications، وحسابين فعليين ضمن اختبار staging المطلوب.

### حماية Profile وOffers

تم تطبيع `/listings/me/mine`, `/favorites`, و`/offers/mine` إلى arrays قبل tabs والعرض، مع empty state حقيقي بدل crash. نجح Web production build في إعادة المحاولة بعد أن علقت محاولة أولى بسبب عملية build transient وتم إيقافها؛ لا يوجد compile failure مثبت. تبقى صحة دورة accept/reject/counter والـnotifications بحاجة staging authenticated.

### حماية Mobile Post

تم تطبيع categories metadata وحماية edit listing من response غير object، مع تحويل images/videos/custom_fields إلى أنواع آمنة قبل دمجها في form. نجح Expo export بعد التعديل. يبقى اختبار upload/permission/Cloudinary/preview/publish على Android وiOS وHuawei بحاجة staging وأجهزة فعلية.

### حماية Mobile Offers/Auctions

تم تطبيع `/offers/mine` و`/auctions/active` وbid history في Mobile إلى arrays قبل العرض، مع الحفاظ على accept/reject/counter وpolling/live refresh. نجح Expo export بعد التعديل. تبقى اختبارات lifecycle الحقيقية والإشعارات والـbackground على staging والأجهزة الفعلية.

### حماية Web Notifications

تم تصحيح fallback قائمة الإشعارات في `NotificationsPage` و`NotificationBell` بحيث لا يتم قبول object كقائمة، مع الحفاظ على unread count وmark-read وWebSocket subscription. نجح Web production build بلا تحذيرات بعد التعديل. يلزم staging authenticated لإثبات push خارج الصفحة، background/cold-start، والـdeep-link من payload حقيقي.

### حماية قوائم الإدارة

تم تطبيع قوائم المستخدمين والبلاغات والبنرات الإعلانية في AdminPage إلى arrays قبل العرض، مع fallback فارغ حقيقي عند فشل endpoint بدل تمرير object إلى map. نجح Web production build بلا تحذيرات. صحة الصلاحيات، pagination، bulk actions، Cloudinary cleanup، وسجلات analytics ما زالت تحتاج اختبار staging بحساب admin فعلي.

### عزل الإعلانات حسب الدولة وإصلاح الشريط السفلي

تمت إضافة `public_listing_filter_for_country` في backend مع fallback صارم إلى `SA` عند غياب الاختيار، وتطبيقه على feed الإعلانات، البحث، المقترحات، trending، deals، auctions، map، تفاصيل الإعلان بالـID/slug، وsimilar listings. أصبح كل query عامًا يشترط تطابق `country_code` الدقيق؛ الإعلان المصري لا يدخل feed السعودية والعكس. كما تم تعديل Web BottomNav ليستخدم `var(--primary-hover)` وخلفية/ظل صريحين للحالة النشطة بدل opacity شفافة، وتعديل Mobile StandaloneFloatingTabBar لإظهار active pill من `palette.primaryHover` مع border/shadow. الأدلة: `py_compile` نجح، `test_public_visibility_policy.py` نجح (4/4)، Web production build نجح، وExpo export نجح. اختبار staging الفعلي بين دولتين ما زال مطلوبًا بعد deployment.
