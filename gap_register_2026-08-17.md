# Alhrajplus — Gap Register (إعادة التدقيق)

**الحالة:** مسودة تدقيق، وليست إعلانًا بالجاهزية.

## ملاحظة منهجية

وجود endpoint أو component لا يساوي اكتمال الميزة. كل ميزة يجب أن تُثبت من الواجهة إلى API ثم قاعدة البيانات ثم الاستجابة والحالة والتنقل والصلاحيات والتعافي والاختبار على Web وMobile. لذلك تستخدم هذه الوثيقة حالات: **PASS** مثبتة، **PARTIAL** جزئية، **FAIL** مكسورة/غير موصولة، **BLOCKED** تحتاج Mongo أو جهازًا أو credential، و**UNVERIFIED** لم تُختبر end-to-end بعد.

## مؤشرات الجرد الأولي

| المؤشر | النتيجة الحالية |
|---|---:|
| صفحات Web المصدرية | 23 |
| شاشات Mobile المصدرية | 19 |
| ملفات Backend tests | 26 |
| ملفات تحتوي mock/demo/fake/placeholder/TODO أو مؤشرات مشابهة | 58، وتحتاج مراجعة يدوية لأن بعض النتائج قد تكون تعليقات أو اختبارات فقط |
| Web i18n smoke | PASS، اختباران ناجحان |
| Web production build | PASS |
| Mobile Expo web export | PASS |
| Backend integration suite | BLOCKED/FAIL في البيئة المحلية عند محاولة التشغيل؛ تحتاج Mongo/بيئة تكامل حقيقية |

## فجوات مؤكدة أو غير مثبتة حتى الآن

| المجال | الحالة | الدليل/المشكلة | المطلوب التالي |
|---|---|---|---|
| Backend integration | BLOCKED | اختبارات التكامل تعتمد على MongoDB وبدأت أخطاء التسجيل بإجابة 500 في البيئة المحلية | تشغيل Mongo disposable أو staging isolation وإعادة الاختبارات من البداية |
| Country data quality | PARTIAL | العزل حسب `country_code` يعمل في endpoints العامة، لكن staging يحتوي إعلانًا موسومًا SA بمدينة الإسكندرية، وإعلانات EG بعملة ر.س | migration/validation تمنع عدم توافق الدولة والمدينة والعملة، وتنظيف legacy records |
| WebRTC | BLOCKED | source/bridge checks ناجحة، لكن لا يوجد دليل اختبار جهازين فعليين مع permission/network switching | اختبار Web↔Mobile وMobile↔Mobile على جهازين حقيقيين، وتوثيق STUN/TURN |
| Admin MFA/CRM | UNVERIFIED | توجد markers ومسارات متفرقة، لكن لم تُثبت مصفوفة role/MFA/CRM end-to-end في staging | تدقيق لوحة Admin والمسارات والتقارير والتصدير والـaudit logs بحسابات أدوار حقيقية |
| Mock/demo markers | UNVERIFIED | يوجد 58 ملفًا يحتوي markers؛ بعضها tests أو comments وبعضها قد يكون data تجريبية ظاهرة للمستخدم | فرز كل نتيجة إلى production/test-only وإزالة أي data تجريبية من feeds |
| Auction lifecycle | PARTIAL/UNVERIFIED | توجد auction endpoints وحقول، لكن لم يثبت end-to-end: minimum bid، حد أسبوع، expiry، archive، الإخفاء من feed، والإبقاء في profile | mutation test بإنشاء مزاد قصير، انتهاء، أرشفة، وقراءة feed/profile على Web/Mobile |
| 3D | PARTIAL | GLB/GLTF viewer ورفع/إزالة موجودان؛ لا يوجد تحويل محلي موثوق من صور/فيديو إلى 3D | تثبيت حدود النوع والحجم والفحص وfallback، وعدم وصف التحويل المحلي كميزة موجودة |
| Chat | PARTIAL/UNVERIFIED | توجد REST/WebSocket وlisteners، لكن matrix حسابين Web↔Mobile مع reconnect/offline/read receipts لم تُثبت بالكامل | اختبار حسابين مع reload ممنوع، duplicate/order/delete/read/reconnect |
| Notifications | PARTIAL/UNVERIFIED | resolver وcold-start payloads عولجت، لكن كل ntype وكل locale وcomment focus لم تُختبر على push حقيقي | اختبار push payloads الحقيقية على Web/Mobile والتأكد من عدم fallback إلى Home |
| Localization | PARTIAL | auto language وRTL/LTR عولجا، وWeb smoke ناجح، لكن sweep كامل للنصوص الثابتة في كل صفحات Web/Mobile/Admin غير مثبت | static scan + screenshots/route matrix لكل لغة مدعومة |
| Performance/scalability | PARTIAL | metrics وrate limiter موجودان، وmetrics memory cap أضيف، لكن لا توجد load test/backup restore drill أو Core Web Vitals measured | staging load test، cache/slow network، backup/restore، ومراقبة alerts |
| Cloudinary cleanup | PARTIAL | cleanup عند update/delete أضيف، لكن orphan scan وstaging folder mutation لم يثبتا end-to-end | اختبار رفع ثم حذف/استبدال والتحقق من Cloudinary وDB/audit |
| Delete/permissions | UNVERIFIED | بعض المسارات موجودة، لكن mutation matrix owner/admin/other-user لكل listing/comment/media لم تُغلق | تشغيل authorization negative suite على staging |

## قواعد عدم الإعلان عن الاكتمال

لا يُعلن **Production Ready** قبل إغلاق أي P0/P1، وتشغيل integration suite على Mongo، واختبار جهازين للمكالمات، والتحقق من عدم وجود mock data ظاهرة، وتنظيف تناقضات الدولة/المدينة/العملة، وإكمال mutation matrix للإعلانات والتعليقات وChat والإشعارات والمزادات وCoins/Wallet.

## الملفات المرجعية المستخدمة

تمت المطابقة مع `pasted_content_6_master_plan_2026-08-17.md` و`Pasted_content_09.txt` ونتائج الجرد البرمجي الحالية. هذا السجل سيُحدّث بعد كل اختبار وإصلاح، ولن يتحول إلى تقرير نهائي إلا بعد إغلاق النتائج أو تصنيفها BLOCKED بأدلة واضحة.

### Staging route smoke — auctions

مسار `https://www.alhraj.online/auctions` فتح فعليًا بعد انتظار lazy load، وعرض صفحة `Live Auctions` ومزادًا نشطًا وزر `Create auction`. لم يعد إلى الصفحة الرئيسية ولم يظهر خطأ عام. ما زال يلزم اختبار الضغط والمزايدة الفعلية وحالة انتهاء المزاد، لذلك الحالة التشغيلية الكاملة للمزاد تبقى UNVERIFIED.

### Staging route smoke — reels and map

مسار `/reels` فتح، لكن ظهرت في الواجهة رسالة `No videos are available right now` بينما احتوى المحتوى المستخرج على روابط فيديو/إعلانات موجودة. هذا تناقض مؤكد بين state المرئي والبيانات، ويُصنف **P1 / FAIL** إلى أن يُحدد سبب race/loading أو شرط country filter ويُختبر بعد الإصلاح.

مسار `/map` فتح عناصر الفلاتر وعنوان `Ads on the map`، لكنه بقي مرئيًا على حالة `Loading map...` مع spinner أثناء الاختبار ولم يظهر markers/قائمة إعلانات. يُصنف **P1 / UNVERIFIED أو FAIL** ويحتاج فحص API وtimeout/error/retry وcountry/category filters.

### Staging route smoke — notifications and listing detail

مسار `/notifications` يفتح للزائر ويعرض `Log in to view notifications`؛ هذا سلوك متوقع للزائر، لكن اختبار الحساب الموثق وclick لكل notification type ما زال مطلوبًا.

مسار الإعلان `/listing/5981a27f-f722-4290-bf77-b808426873ef` يفتح ويعرض العنوان والصورة والسعر والموقع والمشاهدات والتعليقات والبائع والاتصال وWhatsApp والعرض والرسائل والإبلاغ والمزايدة. أثناء screenshot بقيت الواجهة المرئية على `Loading...` رغم أن المحتوى النصي المستخرج يحتوي التفاصيل؛ هذا يشير إلى مشكلة توقيت/رندر أو اختلاف screenshot state ويحتاج اختبارًا متكررًا، كما ظهرت بيانات legacy غير مكتملة مثل `Description: زر رزا تا` واسم بائع مختصر `n`، وقسم Specifications فارغ. هذه ليست مشكلة route فقط، بل جودة بيانات/عرض يجب تصنيفها وإصلاحها أو منع نشرها.

### Map API contract check

`GET https://alhrajplus.onrender.com/api/listings/map/nearby?country_code=SA&limit=200` أعاد 7 عناصر صحيحة مع `country_code=SA` وإحداثيات lat/lng صالحة. لذلك مشكلة MapPage التي ظهرت على شكل `Loading map...` ليست بسبب غياب بيانات API في هذه الحالة؛ يجب إعادة اختبار الواجهة مع انتظار أطول، ثم فحص Leaflet/rerender وstates، وإضافة timeout/retry واضح إذا استمر التعليق.

### Re-test after waiting

بعد إعادة فتح `/reels` وترك دورة الطلب تكتمل، ظهرت واجهة الفيديو فعلًا مع عناصر `Upload Story` و`View Ad` و`Contact seller` و`Favorite` و`Message` و`Share`. الحالة السابقة كانت loading race/لقطة مبكرة وليست غيابًا نهائيًا للبيانات، لكن يلزم تحسين loading state كي لا تعرض رسالة `لا توجد فيديوهات` قبل اكتمال الطلب.

بعد إعادة فتح `/map` واكتمال الطلب، ظهرت خريطة Leaflet و7 markers وفلاتر الفئات وموقع المستخدم. لذلك نحتاج إصلاحًا UX لحالة التحميل/timeout، لا تغيير عقد API الأساسي.

### Code audit — account collections

`AccountCollectionPage.js` يجمع `/favorites` و`/my-listings` و`/offers` و`/following` و`/saved-searches` في wrapper واحد. المفضلة وإعلاناتي تستخدمان ListingCard، لكن العروض والمتابعات والأبحاث المحفوظة تتحول غالبًا إلى صف نصي عام. هذا يثبت أن تكافؤ الميزات وتجربة كل شاشة ليست كاملة بعد، ويحتاج تصميم/سلوك مخصص لكل نوع، خصوصًا offer negotiation وsaved-search actions وfollowing profile links.

### API/Admin scan clarification

فحص API الثابت أظهر 47 unmatched candidates، لكن التدقيق اليدوي أكد أن معظمها false positives بسبب `admin_router = APIRouter(prefix="/admin", dependencies=[Depends(require_admin)])` وبسبب parser لا يتعامل مع router prefixes. لذلك لا تُسجل هذه النتائج كـ404 أو فجوة أمنية. تبقى الحاجة لاختبار Admin فعليًا بمصفوفة الأدوار، لكن الحماية على مستوى router موجودة في المصدر.

### Backend contract/staging check

`GET /api/health` على Render أعاد HTTP 200 و`db: connected`. OpenAPI متاح على `/openapi.json`، بينما `/api/openapi.json` يعيد 404؛ هذا ليس بالضرورة خللًا لأن التطبيق يستخدم prefix `/api` داخل OpenAPI نفسه، لكنه يجب أن يطابق روابط التوثيق/الـproxy.

اختبار `/api/listings?country_code=SA` و`...country_code=EG` أعاد مجموعتين منفصلتين. لكن إحدى نتائج EG تحمل `currency: ر.س`، وهو تناقض مؤكد مع عزل العملة/الدولة. يلزم قرار data migration أو طبقة canonical currency قبل إعلان عزل الدولة مكتملًا؛ لا ينبغي تغيير سعر المستخدم تلقائيًا دون سجل تدقيق.

### Confirmed fix — Reels loading race

تم تعديل `frontend/src/pages/ReelsPage.js` لإضافة حالة loading حقيقية، حالة خطأ مع إعادة المحاولة، AbortController لمنع race عند تبديل الدولة، واستخراج متوافق من `videos` و`video_url`/`video`. بعد التعديل نجح Web build، و`python3 -m compileall -q backend`، وMobile Expo web export.

### Auction contract clarification

تدقيق Backend أكد أن إنشاء المزاد يفرض مدة مستقبلية لا تتجاوز 7 أيام عبر `_normalize_auction_submission`، و`place_bid` يفرض الحد الأدنى للزيادة، يمنع مزايدة صاحب الإعلان، ينهي المزاد عند انتهاء الوقت، ويدعم anti-snipe لمدة 60 ثانية مع WebSocket broadcast. هذه النقاط موجودة في الكود وليست فجوة تنفيذية، لكنها ما زالت تحتاج اختبارًا end-to-end بمستخدمين على staging.

### Staging public contract smoke

على الإعلان `5981a27f...` في SA: detail/comments/similar/neighbors/auctions active/bids أعادت HTTP 200 بعقود قابلة للقراءة، وneighbors أعاد `next:null/previous:null` بشكل صحيح. `/listings/{id}/offers` و`/notifications/unread-count` أعادا HTTP 401 لأنهما مساران محميان ويتطلبان مصادقة، وهذا متوقع وليس فشلًا عامًا. بيانات المزاد الحالية legacy تحتوي `custom_fields.end_date` قديمًا بينما المنطق الحديث يعتمد `end_time/auction_end_at`؛ هذا يستحق migration/compatibility check لأن active endpoint اعتبر المزاد نشطًا رغم أن end_date الظاهر قديم.

### Confirmed auction legacy fix

تم اكتشاف أن المزاد staging يستخدم `custom_fields.end_date` القديم، بينما `_auction_end_datetime` لم يكن يقرأه؛ هذا كان يسمح ببقاء مزادات منتهية في `/auctions/active`. أضيف fallback يفسر `YYYY-MM-DD` كنهاية اليوم UTC. اختبار `tools/test_auction_end_compat.py` نجح، و`py_compile` نجح. ظهر تحذير محلي بأن Redis غير مضبوط، وهو تحذير production-readiness منفصل وليس فشلًا في الإصلاح.

### Confirmed fix — Mobile Reels parity

`mobile/src/screens/ReelsScreen.js` كان يقرأ `AsyncStorage` مرة واحدة، ويعتمد على `videos` فقط، ولا يميز فشل التحميل عن empty state. تم ربطه بـ`CountryContext`، إضافة fallback لـ`video_url`/`video`، وإضافة حالة خطأ وإعادة محاولة، مع إعادة التحميل عند تبديل الدولة. نجح Mobile Expo export وWeb build وBackend compile بعد التعديل.

### Phase 4 test evidence — 2026-08-17

- Web build passed (`npm run build`).
- Mobile Expo web export passed (`expo export --platform web`).
- Backend syntax compilation passed (`python -m compileall -q backend`).
- Local Backend integration suite is not green: local uvicorn reports `db=down`, and auth/listing tests receive HTTP 500. This proves the local MongoDB dependency is unavailable; it does not prove staging is broken.
- Render staging smoke passed: `https://alhrajplus.onrender.com/api/health` returned HTTP 200 with `db=connected`.
- Country isolation smoke passed for public listing feeds: SA checked 11/11 items with zero mismatches; EG checked 4/4 items with zero mismatches. Authenticated cross-account isolation still requires staging tests.
- Frontend domain smoke passed: `https://www.alhraj.online/` returned HTTP 200 and an Arabic RTL HTML shell.

### Authenticated staging smoke — 2026-08-17

Using the user-provided staging account in a read-only smoke test: `/api/auth/login` returned 200 with access/refresh tokens; `/api/auth/me` returned 200 and `country_code=SA`; authenticated listing queries returned 11 SA items and 4 EG items with zero country-code mismatches. No account, listing, comment, or wallet data was mutated. This is positive evidence for the public country filter, but not a substitute for two-account negative authorization, chat, push, or WebRTC tests.

### Deployed-vs-local discrepancy — 2026-08-17

Browser smoke on `https://www.alhraj.online/reels` still showed the old empty state, while direct browser fetches returned 11 SA listings including 4 video-bearing items and one story. The corrected `frontend/src/pages/ReelsPage.js` and `mobile/src/screens/ReelsScreen.js` are uncommitted changes on the local `production-readiness-premium` branch; therefore the deployed bundle has not yet proven the new Reels state handling. A new deploy is required before treating the browser result as a regression pass.

### Local runtime verification — 2026-08-17

The local rebuilt Web bundle rendered the new loading state and then the new translated retry/error state. Calling Render directly from `http://127.0.0.1:4173` failed with browser `TypeError: Failed to fetch` (CORS), while curl and same-origin staging browser fetches succeed. `frontend/public/config.js` was restored to its original empty runtime override after this temporary test. Final browser verification must be performed after deploying the branch to the real frontend origin, or with a local proxy configured for CORS.

### Confirmed P0 fix — Mobile notification routing

`mobile/src/screens/MoreScreens.js` previously handled only a subset of explicit `url` values and could silently fall through for `deep_link`, absolute URLs, reels, map, offers, auctions, or comment-focused listing links. It now normalizes payload/data/deep_link/link, routes the full top-level matrix, preserves comment focus, and supports auction `openBidFor`. Mobile Expo export passed after the change. Device push tap verification remains required.
### P0 regression evidence — 2026-08-17
- Web production build: PASS.
- Web i18n smoke: PASS (2 tests).
- Backend compileall: exit 0 (PASS when 0).
- Mobile Expo export after notification patch: PASS.
- Full backend integration remains blocked locally by MongoDB down; staging auth/country smoke passed separately.

### Notification deep-link unit evidence — 2026-08-17

Added `frontend/src/__tests__/notificationLinks.test.js`. Web tests now pass 2 suites / 9 tests, covering message, comment focus, auction, search alert, reels, absolute wrapped payload, and unknown-type fallback. This verifies the pure resolver contract; it does not replace real push tap testing on iOS/Android/Web.
