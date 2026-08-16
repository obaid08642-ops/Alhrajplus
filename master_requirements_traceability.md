# Alhrajplus — Master Requirements Traceability

## قواعد الحالة

- **PASS**: منفذ ومثبت بدليل runtime أو اختبار مناسب.
- **PARTIAL**: جزء من الواجهة أو المنطق موجود، لكن parity أو المسار الكامل أو الاختبار ناقص.
- **FAIL**: عطل مثبت أو المسار لا يعمل.
- **BLOCKED**: يحتاج حسابًا أو خدمة خارجية أو قيمة بيئية حقيقية لا يمكن اختلاقها.
- **UNVERIFIED**: لم يثبت بعد، ولا يجوز وصفه بأنه منفذ.

> لا يُغلق أي بند بسبب وجود JSX أو endpoint فقط. يلزم اختبار المسار، وحالات النجاح والفشل والفراغ، وWeb/Mobile parity، والترجمة، ومصدر بيانات حقيقي.

## A. الأعطال الحرجة الحالية

| ID | المتطلب/العطل | الحالة الحالية | دليل/معيار القبول |
|---|---|---|---|
| A01 | Web `/map` يفتح بدون crash | FAIL | runtime سجل `TypeError: a.map is not a function`; الإصلاح يحتاج response guard وenv صحيح |
| A02 | Web `/register` يفتح ويعرض النموذج | FAIL | runtime سجل `TypeError: X.find is not a function` عند `/meta/countries` |
| A03 | Web `/post` يفتح ويعرض خطوات إنشاء الإعلان | FAIL | AppErrorBoundary في build المحلي؛ يجب اختبار كل فئات/حقول النشر |
| A04 | Web BottomNav يستخدم primary الحقيقي | FAIL | computed background فعليًا `rgba(0,0,0,0)` بدل primary |
| A05 | Mobile StandaloneFloatingTabBar موحد مع palette الحية | FAIL/PARTIAL | يستخدم `colors.primary` الثابتة ولا يقرأ `palette` من ThemeModeProvider |
| A06 | Web runtime backend config | FAIL in local baseline | console: `BACKEND_URL = (empty!)`; يجب error واضح وعدم انهيار الصفحات |
| A07 | Web runtime language follows device | FAIL/PARTIAL | runtime عرض English `Sell, Buy, Rent, Hire` و`Home/Story/Chat/More` في جلسة الفحص |
| A08 | Notification deep links لكل الشاشات | PARTIAL | router لا يعالج Reels/Auctions/Map/Offers/Notifications صراحة |
| A09 | Authenticated staging | BLOCKED | admin tests 401؛ يحتاج حساب/token staging صالح |

## B. متطلبات المستخدم المباشرة من بداية المحادثة

### B1. Marketplace parity and competitor features

| ID | المطلوب | الحالة | معيار القبول |
|---|---|---|---|
| B01 | parity مع Haraj/Dubizzle/OpenSooq/OLX | UNVERIFIED | benchmark feature-by-feature مع traceability؛ تنفيذ ما يلزم قانونيًا وتقنيًا |
| B02 | إعجاب الإعلان Like | UNVERIFIED/PARTIAL | toggle حقيقي، عداد، persistence، Web/Mobile |
| B03 | المشاهدات views counter | UNVERIFIED/PARTIAL | increment موثوق، منع التكرار/abuse، عرض العدد |
| B04 | تعليقات عامة على الإعلان | UNVERIFIED | create/list/delete/report، moderation، Web/Mobile |
| B05 | المفضلة | PARTIAL | toggle موجود في بعض المسارات؛ اختبار persistence وlist وnotification |
| B06 | متابعة البائع | UNVERIFIED/PARTIAL | follow/unfollow، قائمة المتابعين، إشعارات الإعلانات الجديدة |
| B07 | صفحة البائع وإعلاناته الأخرى | PARTIAL | seller profile حقيقي، counts/status/reviews/listings/pagination |
| B08 | إعلانات مشابهة | UNVERIFIED | endpoint وترتيب relevance وcountry/category isolation |
| B09 | مشاركة الإعلان | PARTIAL | Web Share/clipboard، Mobile share، deep link يعمل |
| B10 | الاتصال والواتساب والشات من الإعلان | PARTIAL | phone visibility/permissions، call intent، WhatsApp URL، in-app chat |
| B11 | التقييمات والمراجعات | UNVERIFIED/PARTIAL | buyer/seller review بعد transaction، منع التلاعب، عرض المتوسط |
| B12 | عروض البيع وcounter-offers | PARTIAL | offer lifecycle، قبول/رفض/counter/expiry، إشعارات، Web/Mobile |
| B13 | بحث متقدم وفرز وفلاتر | PARTIAL | category/subcategory/region/price/date/condition/distance/sort، query persistence |
| B14 | حفظ البحث والتنبيهات | UNVERIFIED/PARTIAL | save search، alert، إدارة وحذف، deep link |
| B15 | إعلانات ممولة/ترقية/featured | UNVERIFIED | إن كانت ضمن النموذج: payment-independent state أو بوابة حقيقية بلا CTA وهمي |
| B16 | تبليغ ومكافحة الاحتيال | UNVERIFIED/PARTIAL | report/block, moderation queue, rate limiting, audit log |
| B17 | توثيق الحساب/البائع | PARTIAL | email/phone verification، badge حقيقي، منع referral fraud |
| B18 | مشاركة خارجية وdeep links | PARTIAL | روابط Web/App تفتح الإعلان/البائع/المحادثة/المزاد correctly |

### B2. إنشاء الإعلان والحقول والمسارات

| ID | المطلوب | الحالة | معيار القبول |
|---|---|---|---|
| B19 | workflow إنشاء إعلان لكل الفئات | FAIL for Web `/post`; Mobile unverified | guest/auth guard واضح، category → subcategory → fields → media → preview → publish |
| B20 | حقول سيارات | UNVERIFIED | make/model/year/mileage/condition/transmission/fuel/engine/registration، dropdowns |
| B21 | حقول عقارات | UNVERIFIED | type/area/rooms/bathrooms/furnishing/ownership/latitude/longitude |
| B22 | حقول وظائف | UNVERIFIED | employment type/salary/experience/education/location |
| B23 | حقول خدمات/إلكترونيات/مواشي/أثاث وغيرها | UNVERIFIED | category schemas driven by backend metadata |
| B24 | dropdowns بدل الكتابة حيث يلزم | UNVERIFIED | controlled lists، validation، localized labels |
| B25 | draft/save/resume/edit/republish | UNVERIFIED | persistence، recovery، permissions |
| B26 | الصور والفيديو والـ3D في الإعلان | PARTIAL | Cloudinary signed upload، validation، progress، delete/orphan cleanup |
| B27 | GLB/GLTF 3D viewer | PARTIAL | upload/store/view Web and Mobile، invalid model fallback، no retired 360 sequence |
| B28 | external 3D conversion guidance | UNVERIFIED | optional documented link/workflow، no fake conversion claim |
| B29 | SEO/GEO fields auto-generated on publish | UNVERIFIED/PARTIAL | Arabic/English title/description/meta/JSON-LD/slug/geo keywords generated from real fields |
| B30 | preview قبل النشر | UNVERIFIED | exact display parity with detail page |
| B31 | delete listing بالكامل | PARTIAL/UNVERIFIED | DB/backend record + Cloudinary assets + derived media removed, audit/soft-delete policy documented |
| B32 | expiration policy | PARTIAL | user/admin configurable duration; filters by age; renewal; no unexpected short expiry |

### B3. Home, cards, detail, stories, auctions

| ID | المطلوب | الحالة | معيار القبول |
|---|---|---|---|
| B33 | Home real data/no stale demo | PARTIAL | API sections, pagination, error/empty, no demo cards |
| B34 | Hero headline Sell/Buy/Rent/Hire | PARTIAL/FAIL runtime language | clean typography, localized, no malformed/AI-looking glyphs |
| B35 | ListingCard premium UI | PARTIAL | hierarchy, price/location/meta, seller/status, responsive |
| B36 | auto image carousel | PARTIAL | 2–3 sec configurable, pause/reduced motion, dots, swipe, no favorite/navigation conflict |
| B37 | listing detail premium UI | PARTIAL | gallery/video/3D, seller, actions, views/likes/comments/similar/SEO |
| B38 | Stories/Reels Web | PARTIAL | shared API with Mobile, video playback/mute/scroll/back/close/upload, translations |
| B39 | Stories/Reels Mobile | PARTIAL | real data, focus/play/pause, swipe exit, upload route, device test |
| B40 | Auctions public list | PARTIAL | active/error/empty, category/region filters, no mock |
| B41 | Auction detail | UNVERIFIED/PARTIAL | current price, history, min increment, expiry, live updates, bid validation |
| B42 | auction CTA/icon functionality | PARTIAL | every button tested; no dead icons |
| B43 | auction notifications/deep links | UNVERIFIED | notification opens auction detail/bid dialog |
| B44 | Deals/today deals | PARTIAL | `/deals/today` real data, empty state, discount calculation, no mock |
| B45 | Flights | PARTIAL | real provider links or explicit unavailable state, localized validation, no misleading booking CTA |
| B46 | Map | FAIL | fix response shape, filters by region/category/nearby/distance, markers/detail |

### B4. Account, chat, notifications, offers

| ID | المطلوب | الحالة | معيار القبول |
|---|---|---|---|
| B47 | Profile counts/status/phone | PARTIAL | real counts, active status, show/hide/edit phone, permission/validation |
| B48 | country detection/default SA | PARTIAL | IP/device locale fallback, SA on failure, manual override persists/syncs |
| B49 | device language auto | FAIL/PARTIAL runtime | first render locale, manual override, reset system, all supported languages |
| B50 | system light/dark | PARTIAL | first render system, listener, manual override/reset, all bars and screens |
| B51 | chat list | PARTIAL | real conversations, unread, online/last seen, search, deep links, no truncated text |
| B52 | chat thread real time | PARTIAL | WebSocket/reconnect/send/read/typing/media/voice/reactions, no reload |
| B53 | push notifications | PARTIAL/BLOCKED | foreground/background/cold-start, permission, payload, deep links, real devices |
| B54 | Offers screen | PARTIAL | incoming/outgoing, counter-offer, expiry, accept/reject, notifications |
| B55 | call functionality | UNVERIFIED | call intent or in-app voice/video provider; no false “implemented” claim |
| B56 | notifications center | PARTIAL | list/read/unread/filter/deep link/delete, Web/Mobile |
| B57 | referral/invite | PARTIAL | ledger, verified email, anti-fraud, reward state, admin controls |

### B5. Admin, data, backend, infrastructure

| ID | المطلوب | الحالة | معيار القبول |
|---|---|---|---|
| B58 | admin dashboard full control | PARTIAL | users/listings/reports/moderation/content/settings/audit |
| B59 | visitor analytics | PARTIAL | sessions, duration, device/OS/browser, referrer, geography, consent/privacy |
| B60 | realtime visitor dashboard | PARTIAL | live sessions, refresh/stream, aggregation, scale limits |
| B61 | bulk cleanup by listing age | PARTIAL | filter 1m/2m/1y/5y, preview, bulk delete, audit, safe confirmation |
| B62 | Cloudinary deletion | UNVERIFIED | delete all original/derived assets on user/admin delete; retry/idempotency |
| B63 | MongoDB/Redis scaling | UNVERIFIED | indexes, cache strategy, queues, rate limits, load test, failure recovery |
| B64 | staging Render | PARTIAL | public health passed; auth/private Redis/Cloudinary/push blocked |
| B65 | remove demo/seed marketplace records | PARTIAL | cleanup migration run on staging, backup/rollback, metadata retained |
| B66 | environment variables | PARTIAL | documented backend/database/Redis/Cloudinary/push/store/SEO values, startup validation |
| B67 | app store buttons | PARTIAL | App Store/Play/AppGallery env URLs, real builds, disabled missing URL, no placeholder |
| B68 | deployment main | PASS for prior commit only | future changes must be tested then pushed; no force push without explicit confirmation |

### B6. Design, vector, translation, accessibility, performance

| ID | المطلوب | الحالة | معيار القبول |
|---|---|---|---|
| B69 | replace UI Emoji with premium vectors | PARTIAL | parser inventory and zero unexplained visible emoji; user content exceptions documented |
| B70 | premium icons/category illustrations | PARTIAL | all categories/subcategories mapped or fallback vector, consistent stroke/color |
| B71 | iPhone-style Web typography | PARTIAL | system font stack, tested Arabic/Latin, weights and line-height |
| B72 | TopBar dimensions/safe areas | PARTIAL | no clipping/overflow/notch/keyboard issues across viewport matrix |
| B73 | BottomNav color/design | FAIL | computed style fix and visual/runtime tests |
| B74 | translated UI/alerts/accessibility labels | FAIL/PARTIAL | no raw Arabic/English UI outside dictionaries; all supported languages |
| B75 | RTL/LTR parity | UNVERIFIED | route/form/layout tests for Arabic/English/Urdu/Hindi/Bengali/French |
| B76 | performance at scale | UNVERIFIED | bundle budgets, image lazy-load, API latency, pagination, load/concurrency tests |
| B77 | SEO modern | UNVERIFIED | SSR/prerender/indexable detail pages, canonical/OG/Twitter/JSON-LD/sitemap/robots |
| B78 | GEO/local SEO | UNVERIFIED | structured location/category content, localized URLs/meta, map consistency |
| B79 | privacy/security | UNVERIFIED | auth/session, XSS/upload validation, rate limits, PII/analytics consent, audit |
| B80 | Android/iOS/Huawei compatibility | UNVERIFIED | device/OS matrix, safe area, permissions, push/deep links, upload/camera/gallery |

## الترتيب الإجباري للتنفيذ

1. **P0 runtime blockers:** API/env guard، `/map`، `/register`، `/post`، BottomNav، language initialization، AppErrorBoundary recovery.
2. **P1 navigation and core journeys:** route matrix، Reels/Auctions/Map/Offers/Notifications deep links، create listing workflow، listing detail.
3. **P1 data integrity:** remove stale records، response schemas، error/empty states، Cloudinary deletion، expiry and bulk cleanup.
4. **P1 core engagement:** likes/views/comments/follow/similar/reviews/offers/chat/notifications.
5. **P2 admin and integrations:** analytics/CRM/referrals/Redis/Cloudinary/push/store links/flights/deals.
6. **P2 localization/design:** all translations, vectors, typography, safe areas, RTL/LTR, system theme/country.
7. **P2 SEO/GEO/performance:** metadata, structured data, indexing, caching, pagination, image optimization, load tests.
8. **Release gate:** Web/Mobile/backend/staging/device matrix, then final report and GitHub main.

## منع تكرار المشكلة

لكل ID سيضاف: الملفات والendpoint، الحالة قبل الإصلاح، patch، اختبار النجاح، اختبار الفشل، اختبار الفراغ، Web result، Mobile result، وقرار PASS/PARTIAL/BLOCKED. لن تُستخدم كلمة «منفذ» إذا كان المتاح مجرد واجهة أو build.
