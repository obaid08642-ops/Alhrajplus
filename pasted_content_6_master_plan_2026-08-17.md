# الخطة الكبرى المحدثة — Alhrajplus

**الحالة:** تدقيق وتخطيط فقط. لم يبدأ تنفيذ هذه الجولة، ولن يتم تعديل الكود أو قاعدة البيانات أو النشر قبل أمر المستخدم الصريح بالبدء.

هذه الوثيقة تُبقي جميع محاور الخطة السابقة، وتضيف المتطلبات التي ظهرت في `pasted_content_6.txt` والرسائل السابقة ولم تكن ممثلة بشكل كافٍ، خصوصًا: القص في الإشعارات، deep links، القص/التمركز، الترجمة الكاملة، التصميم والأيقونات والـemoji، الشريط السفلي، القصص والفيديو، المزادات، الخريطة والفلاتر، الحقول المتخصصة، 3D، حذف Cloudinary، CRM، تقارير الزوار والأجهزة، WebRTC، country isolation، SEO/Geo، ومصفوفة الاختبارات الحقيقية.

## قواعد صارمة قبل التنفيذ

لن تُعدّ أي ميزة مكتملة بسبب وجود واجهتها فقط. يجب تتبعها من **UI → API → Backend → Database → response → state → navigation → persistence → error/recovery → authorization/security → analytics**. كل بند سيحمل إحدى الحالات: **PASS** مكتمل ومختبر end-to-end، **PARTIAL** جزئي، **FAIL** مكسور أو غائب، **BLOCKED** يحتاج credential أو جهازًا أو خدمة خارجية، أو **UNVERIFIED** لم يُثبت بعد.

كل مرحلة لها أجزاء واضحة وبوابة اختبار مستقلة. لا يبدأ الجزء التالي قبل إغلاق الجزء السابق، ولا تبدأ مرحلة جديدة قبل نجاح بوابة المرحلة السابقة. عند وجود P0 أو P1، تتوقف الخطة ولا يُعلن النظام Production Ready. لا تُنشأ أنظمة موازية للمصادقة أو الإشعارات أو Wallet/Coins أو AI orchestration.

## المرحلة 1 — مراجعة الملف والرسائل وبناء سجل المتطلبات الموسع

### الأجزاء

1. قراءة `pasted_content_6.txt` كاملًا سطرًا بسطر.
2. إعادة قراءته مرة ثانية والتحقق من كل قسم من الأقسام 1–51.
3. مطابقة الملف مع الرسائل السابقة، بما فيها: مشاكل فتح الصفحات، الإشعارات التي تعود للرئيسية، قائمة الإشعارات المقصوصة، الترجمات الثابتة، country isolation، bottom navigation، chat، WebRTC، stories، auctions، maps، SEO/Geo، Admin/CRM، fake/mock data، 3D، Cloudinary، referral/Coins، وحذف 360 غير المرغوب.
4. تسجيل كل مطلب مع مصدره، ودرجة الأولوية P0/P1/P2/P3، وقبول واضح.

### بوابة الاختبار
يجب أن تكون المصفوفة شاملة لكل بند، ويجب ألا توجد فقرة في الملف أو الرسائل السابقة بلا رقم تتبع أو تصنيف.

## المرحلة 2 — التدقيق المعماري end-to-end

### الأجزاء

1. حصر Web وReact Native وBackend وDatabase وAdmin وshared contracts.
2. ربط كل شاشة بالـAPI والـmodel والـpermissions والـanalytics.
3. كشف routes المكررة، mock/placeholder data، hardcoded values، APIs غير المستخدمة، وحقول لا تصل إلى قاعدة البيانات.
4. مطابقة Web/Mobile للوظائف: auth، listings، search، favorites، profiles، chat، calls، notifications، referral، Coins، wallet، settings.
5. مراجعة API errors وloading states وnavigation fallbacks.

### بوابة الاختبار
تقرير architecture gap matrix، compile Backend، Web build، Mobile export، وفحص route/API parity دون تعديل إنتاجي.

## المرحلة 3 — UX audit الكامل لكل المسارات

### الأجزاء

1. تدقيق Home، Search، results، filters، categories، cards، details.
2. تدقيق Create/Edit/Publish، profiles، favorites، watchlist، saved searches.
3. تدقيق notifications، chat، calls، wallet، Coins، referral، settings.
4. تدقيق registration/login/recovery/phone verification/onboarding/sharing/deep links.
5. اختبار loading/empty/error/retry/recovery، RTL/LTR، responsive، accessibility، touch targets، keyboard، screen reader، reduced motion.
6. تدقيق أدوار visitor/buyer/seller/power seller/admin/mobile/web/Arabic/English/SA/other-country/slow-network/new-device/returning-user.

### بوابة الاختبار
Journey matrix مصور ومُرقم، ونتيجة لكل رحلة: واضح، قابل للإتمام، قابل للتعافي، سريع، متوافق، ومتاح.

## المرحلة 4 — Design system وPremium UI

### الأجزاء

1. فحص اللون الأساسي الحالي وعدم استبداله عشوائيًا.
2. تعريف Primary/Secondary/Accent/Success/Warning/Error/Info/Neutral/Surface/Background/Text/Border.
3. تعريف tokens مركزية للألوان، typography، الأحجام، الأوزان، spacing، radius، shadows، elevation، icons، buttons، inputs، cards، modals، bottom sheets، navigation، animation.
4. ضبط الشريط العلوي، الشريط السفلي، selected/unselected state، وتطابقهما مع اللون الأساسي.
5. تحويل الأيقونات والإيموجي غير المناسبة إلى vector/premium icon system، وتوفير أيقونات للفئات والـsubcategories.
6. توحيد خط Web مع الخط المعتمد للموبايل قدر الإمكان، مع دعم العربية واللاتينية.
7. ضبط Light/Dark/System theme، contrast، RTL/LTR، responsive، safe area، notification popup، modal، filter، chat، Admin.

### بوابة الاختبار
Token/static scan، contrast audit، screenshots لمقاسات Web، Android/iOS، light/dark، RTL/LTR، keyboard/focus، وعدم وجود overflow أو clipping.

## المرحلة 5 — Listing cards وتفاصيل الإعلان والوسائط

### الأجزاء

1. ListingCard: image، price، title، location، time، category، seller، verified، sponsored، boost، favorite، share، view count، likes.
2. ترتيب hierarchy بحيث يفهم المستخدم الإعلان خلال ثانية دون ازدحام.
3. Listing Detail: gallery، fullscreen، video، seller profile، similar listings، ratings/reviews، comments/replies، report/block، chat/call/offer.
4. إضافة stories/videos حيث تكون مطلوبة، مع states ورفع وتشغيل ومشاركة.
5. مراجعة 360: لا يُعاد تفعيل نظام 360 غير المرغوب؛ أي 3D حقيقي يجب أن يمر عبر GLB/GLTF أو مزود واضح، مع بوابة قدرة/تكلفة قبل اعتماده.
6. 3D gate: تحديد قبول ملفات GLB/GLTF، viewer آمن، حدود الحجم، فحص الملف، fallback، أو رابط خارجي موثق دون ادعاء تحويل محلي غير موجود.

### بوابة الاختبار
فتح كل CTA، تشغيل الصور والفيديو، fullscreen، swipe، view/like/favorite/share، comments، profile، responsive، file validation، وعدم كسر listing detail.

## المرحلة 6 — الفئات والحقول والـvertical workflows

### الأجزاء

1. جرد الفئات والـsubcategories والأيقونات.
2. تصميم حقول متخصصة للسيارات، العقار، الوظائف، الأجهزة، الخدمات، المنتجات، وغيرها.
3. تحويل الحقول الثابتة إلى dropdown/radio/multi-select/date/number/location حين يكون ذلك أفضل من الكتابة الحرة.
4. قواعد required/optional حسب الفئة والدولة.
5. منع خلط حقول أو فلاتر دولة/فئة بأخرى.
6. دعم auction fields: minimum bid، duration بحد أقصى أسبوع حسب requirement، expiry، archive، وإخفاء الإعلان من auction feed بعد الانتهاء مع بقائه في profile وفق السياسة.

### بوابة الاختبار
Create/Edit/Preview/Publish لكل vertical، validation، persistence، API schema، search filters، auction expiry/archive، Web/Mobile parity.

## المرحلة 7 — إنشاء وتعديل ونشر الإعلان والمسودات وCloudinary

### الأجزاء

1. flow: Create → Category → Details → Images → Location → Contact → Price → Preview → Publish.
2. progress indicator، grouping، upload ordering/editing، crop/compression، retry، pause/resume.
3. autosave drafts واستعادتها بعد refresh/close/network failure.
4. contact phone source: account/custom/hidden، validation، privacy.
5. delete listing من المستخدم/Admin مع حذف database records والوسائط Cloudinary حسب policy، ومراقبة orphan assets.
6. mock/seed/fake data inventory واستبدالها أو وسمها بوضوح في test-only.

### بوابة الاختبار
Upload failure/retry، draft recovery، publish/delete permissions، Cloudinary staging folder، orphan cleanup، audit logs، وعدم فقدان البيانات.

## المرحلة 8 — AI listing assistant وجودة الإعلان والبحث

### الأجزاء

1. AI optional: title، description، category، image extraction، missing fields، price suggestion، duplicate detection، prohibited content، quality improvement.
2. Listing Quality Score مع اقتراحات photos/location/price/condition/specifications.
3. Voice search state machine: permission → listening → processing → searching → results → error/retry.
4. Image search: permission/pick → uploading → analyzing → matching → results → error/retry.
5. Search text/filters/saved searches/alerts/recommendations/trending/nearby/recently viewed.
6. country-scoped search وpagination/cache/prefetch.

### بوابة الاختبار
Contract tests، invalid input، provider unavailable، states المرئية، no silent failures، search results، Mobile/Web parity، وموافقة المستخدم قبل تطبيق اقتراح AI.

## المرحلة 9 — AI orchestration والمراقبة

### الأجزاء

1. provider registry، models، rotation، primary/fallback، cooldown، error classification، max attempts.
2. quota safety وprovider-specific limits دون hardcode قديم، usage/token/error/latency tracking.
3. Admin controls للترتيب والتفعيل والـweights والحدود والأوضاع دون تخزين الأسرار في DB.
4. تكامل Gemini مع providers مناسبين مثل Grok/xAI وغيرهم بعد فحص official quota/terms، وعدم وصف أي خدمة بأنها unlimited free دون دليل رسمي.
5. timeout/circuit breaker، fallback، audit logs، redaction، budget alerts.

### بوابة الاختبار
Unit/contract tests، simulated provider failures غير إنتاجية، live provider staging بمفاتيح حقيقية، Admin audit، secrets scan، ونتائج telemetry.

## المرحلة 10 — Referral وCoins وpromotion economy

### الأجزاء

1. referral click بلا Coins، registration tracking، qualification قابلة للضبط: verified/phone/non-fraud/min activity/legitimate action.
2. منع self-referral، duplicate، fake، infinite، farming، manipulation.
3. conservative reward/cost configuration من Admin لا من الكود.
4. scarcity وعدم إفساد organic ranking.
5. منتجات Boost/Featured/Sponsored/Top/Repost/Highlight/Premium/Packages/Business.
6. cost/duration/placement/category/country/max quantity/eligibility، وتمييز promoted بصريًا.

### بوابة الاختبار
Atomic ledger، unique indexes، idempotency، concurrent requests، rollback، insufficient balance، Admin config، ranking pollution، وWeb/Mobile parity.

## المرحلة 11 — Wallet والدفاتر والعروض

### الأجزاء

1. فصل Coins عن fiat wallet.
2. grant/spend/refund ledger، audit trail، idempotency.
3. offers/replies/negotiation، promotion receipt/status/expiry.
4. business profiles/storefronts، seller analytics/views/leads/calls/messages/promotion/repost.

### بوابة الاختبار
Balance invariants، authorization، replay، refunds، expiry، reporting، وعدم تمكين العميل من تغيير التكلفة أو الرصيد.

## المرحلة 12 — Profiles والتفاعل والثقة

### الأجزاء

1. seller/buyer profiles، listings أخرى، follow، favorite، like، views، ratings، reviews، verified badges.
2. comments، replies، nested/threaded structure، listing owner replies، mentions إن كانت مدعومة.
3. report، block، safety center، fraud detection، seller badges.

### بوابة الاختبار
Ownership، moderation visibility، notifications، count consistency، pagination، Web/Mobile parity، وprivacy.

## المرحلة 13 — Chat realtime

### الأجزاء

1. send/receive/read/replies، REST fallback وWebSocket، reconnect، offline behavior.
2. delete message حسب policy، delete-for-me conversation، block/report، notification/deep link.
3. fixed chat background، stable scroll، optimistic/pending/error states، performance مثل WhatsApp/Messenger دون ادعاء parity غير مثبتة.

### بوابة الاختبار
Two-account Web↔Mobile matrix، reconnect، duplicate messages، ordering، read receipts، auth/ownership، no reload requirement.

## المرحلة 14 — Voice calls WebRTC

### الأجزاء

1. App→App، Web→App، App→Web ضمن ما تدعمه البنية.
2. initiate/incoming/accept/reject/end/reconnect/network switch/background.
3. microphone/speaker/camera permissions، STUN/TURN، signaling على Render، token expiry/cleanup/history.
4. لا يُستخدم paid voice provider؛ أي TURN خارجي يجب توثيق تكلفته/بديله وعدم تسميته مجانيًا بلا تحقق.

### بوابة الاختبار
أجهزة حقيقية وحسابان، شبكة Wi-Fi/mobile، background، permission denial، Android/iOS/Web، وتسجيل evidence. غير القابل للاختبار يصنف BLOCKED.

## المرحلة 15 — Notifications وdeep links

### الأجزاء

1. structured payload لكل chat/comment/search/auction/follow/admin/call.
2. resolver موحد Web/Mobile، notification popup centered وغير مقصوص.
3. cold start، app closed، Web fallback، فتح listing/chat/search/comment thread/auction/follower بدل Home.
4. comment highlight وreply focus حيث يمكن.

### بوابة الاختبار
كل ntype، كل payload shape، click من bell/page/push، cold start، locale، RTL/LTR، no fallback to `/` إلا عند غياب target صالح مع رسالة واضحة.

## المرحلة 16 — Stories والفيديو والمزادات والخريطة والسحب

### الأجزاء

1. stories upload/view/expiry/visibility/replies إن كانت ضمن المتطلبات.
2. video upload/playback/thumbnail/limits/moderation.
3. auction lifecycle والـarchive والحد الزمني.
4. map by country/region/nearby/category، filters، clustering، privacy.
5. swipe بين إعلانات نفس مصدر القائمة مع state persistence وعدم خلط الدول.

### بوابة الاختبار
Media permissions، expiry، map filters، auction transitions، touch gestures، performance، Web/Mobile parity.

## المرحلة 17 — Multi-country وGeo وSEO

### الأجزاء

1. automatic country detection من IP/browser/device/region مع fallback SA وعدم اعتبار IP حقيقة مطلقة.
2. canonical country codes، city-region ownership، server-side isolation.
3. switching: feed/search/categories/locations/currency/promotions/recommendations/cache.
4. dynamic listing/category/country/city SEO، canonical/OG/schema/sitemap/robots/internal links/indexability/duplicates/pagination.
5. stable shareable listing URL، Web→listing، Mobile app link، Web fallback.

### بوابة الاختبار
SA/EG وجميع الدول المدعومة، API negative tests، stale cache، crawler/HTML، deep-link app installed/not installed.

## المرحلة 18 — Localization والثيم والتوافق

### الأجزاء

1. auto language من الجهاز/browser، Arabic/English، اللغات المدعومة فعليًا، persistence وعدم overwrite manual choice.
2. system Light/Dark أوليًا، manual override محفوظ.
3. full translation sweep للنصوص الثابتة، relative time، numbers، currency، errors، buttons، profile/admin/listings.
4. Web/mobile font parity، RTL/LTR.
5. download app buttons، روابط environment، safe fallback.

### بوابة الاختبار
Locale/theme matrix، storage reload، كل النصوص الأساسية، Web/Mobile، Android/iOS، وعدم ظهور نص عربي ثابت في الإنجليزية.

## المرحلة 19 — Admin وCRM والبيانات والتقارير

### الأجزاء

1. Admin web-only architecture، role guard، MFA/2FA حقيقي، session lifetime، refresh rotation، revoke، device list، logout-all، suspicious login، reauth.
2. user/listing/comment/chat/referral/Coins/wallet/AI/promotion/notification moderation.
3. CRM: users، visitors، sessions، duration، devices، sources، countries، most visited screens، retention، leads، calls، messages، reports.
4. dashboards، filters، exports، audit logs، bulk actions، expiry/archive cleanup.

### بوابة الاختبار
Role matrix، MFA staging، audit entries، PII redaction، report correctness، no mobile admin exposure.

## المرحلة 20 — Security/privacy/environment inventory

### الأجزاء

1. Auth/JWT/refresh/OTP/password/phone/admin/API/object permissions/IDOR.
2. injection/XSS/CSRF/CORS/rate limiting/brute force/enumeration.
3. uploads/image/malicious file/path traversal/SSRF/webhooks/API/chat/notification/referral/Coins/wallet/listing abuse.
4. secrets/logs/env vars، client exposure، separation dev/test/prod.
5. privacy للهواتف/email/location/messages/images/voice/AI/payments/admin logs وعدم التسريب في responses/logs/notifications/URLs/deep links.
6. table لكل environment variable: purpose/required/used by/status/secret-public/safe format، ومفقود/unused/duplicate/incorrect.

### بوابة الاختبار
Negative security suite، dependency/config scan، secrets scan، privacy fixtures، rate-limit tests، authorization tests، env inventory review.

## المرحلة 21 — Performance/scalability/production readiness

### الأجزاء

1. Web initial load/bundle/images/CDN/API/search/listing/SEO/Core Web Vitals/cache/lazy/code split/SSR.
2. RN startup/navigation/render/FlatList/FlashList/image memory/animations/gestures/chat/notifications/calls/search/offline/battery.
3. Backend latency/queries/index/N+1/cache/pool/jobs/queues/rate limits/WebSocket/realtime.
4. monitoring: health/API/queue/notification/AI/crash/performance/security/admin audit.
5. backup/restore، disaster recovery، data cleanup، Cloudinary cleanup، deployment rollback.

### بوابة الاختبار
Measured budgets، staging load tests، slow network، low-memory، cache hit/miss، queue failure، monitoring alerts، backup restore drill.

## المرحلة 22 — Competitor audit وfeature parity

### الأجزاء

1. فحص Haraj وOLX وDubizzle وOpenSooq وFacebook Marketplace ومنافسين إقليميين/عالميين من مصادر رسمية وتجارب حالية مناسبة.
2. مصفوفة Feature × competitor × Alhrajplus × priority.
3. تصنيف Must Have/High Value/Differentiator/Future.
4. تنفيذ الميزات العالية القيمة القابلة للتنفيذ فقط بعد قرار scope، دون نسخ proprietary implementation.

### بوابة الاختبار
مصدر رسمي لكل claim، screenshots/notes، matrix review، acceptance tests لأي feature جديدة.

## المرحلة 23 — الاختبارات الشاملة وstaging

### الأجزاء

1. Backend unit/integration/e2e، Web build/test، Mobile export/build.
2. Web viewport matrix، Android/iOS device matrix، Huawei فقط إذا كانت HMS مدعومة فعليًا.
3. staging منفصل: Mongo disposable، حسابان، Cloudinary test folder، AI credentials، push credentials، TURN عند الحاجة.
4. اختبار mutation الحقيقي: auth، listings، comments، chat، calls، notifications، referrals، Coins، wallet، boost، upload/delete.
5. اختبار slow network، offline، cold start، background، network switch، permissions.

### بوابة الاختبار
لا تُقبل عبارة “build ناجح” كبديل عن mutation أو device tests. لكل فشل سبب وتصنيف وإصلاح أو BLOCKED واضح.

## المرحلة 24 — التقرير النهائي وRelease Gate

### الأجزاء

1. UX/UI/design/color/listing/competitor/gap/implemented/security/performance/compatibility/country/localization/AI/env/chat/calls/notifications/referral/API/DB/tests/remaining.
2. scorecard من 0–100 مع تفسير لكل محور.
3. P0/P1/P2/P3 priority matrix.
4. قرار صريح: NOT READY أو READY WITH BLOCKERS أو PRODUCTION READY.
5. git diff clean، commit، push إلى main، deploy checklist، rollback plan.

## شرط البدء

**لن يبدأ أي تنفيذ من المرحلة 2 وما بعدها في هذه الجولة قبل أمر المستخدم الصريح بالبدء.** عند صدور الأمر، سيبدأ التنفيذ من المرحلة الأولى في هذه الوثيقة، وليس من مرحلة لاحقة، وسيتم إرسال نتيجة كل جزء وبوابة الاختبار قبل الانتقال.
