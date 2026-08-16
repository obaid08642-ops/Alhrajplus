# Alhrajplus — Feature Parity Gap Matrix

## الغرض

هذا المستند يصحح الفجوة بين الوعد السابق بالتكافؤ الكامل وبين ما هو موجود فعليًا في الفرع `production-readiness-premium`. وجود endpoint أو placeholder في الواجهة لا يُحسب كميزة مكتملة؛ الميزة لا تُعد **مكتملة** إلا إذا كان لها نموذج بيانات صحيح، صلاحيات، واجهة ويب وموبايل عند الحاجة، حالات loading/error/empty، قياس، واختبار تكامل.

## الحالة التنفيذية الحالية

| المجال | موجود فعليًا | الحالة | الفجوة الرئيسية |
|---|---|---|---|
| الحسابات والهوية | تسجيل، OAuth، refresh، حذف الحساب، التحقق بالبريد | جزئي قوي | 2FA، إدارة الجلسات والأجهزة، سجل أمان، استرداد أكثر وضوحًا |
| الإعلانات | إنشاء/تعديل/إيقاف/إعادة نشر/بيع، صور، SEO، اقتراح سعر، autofill | جزئي قوي | drafts متعددة الأجهزة، bulk edit، duplicate detection مرئي، جدول مواصفات أعمق لكل vertical، جودة الصور، inspection workflow |
| البحث | filters، اقتراحات، trending، history، saved search، map | جزئي قوي | alerts كاملة، sort/relevance explainability، saved filters متعددة، search analytics، compare، map clusters، pagination/cursor محسّن |
| التفاعل | likes، favorites، views، comments، similar، follow seller/category | موجود جزئيًا | reactions متعددة، comment moderation/replies، share attribution، collections، blocking/report UX موحد |
| العروض | إنشاء offer، inbox، قبول/رفض | موجود جزئيًا | counter-offer، expiry، negotiation timeline، reserve/deposit، audit وpush لكل انتقال |
| الشات | WebSocket، presence، typing، reactions، location، offline outbox، idempotency | قوي قبل الإنتاج | media upload، voice notes، read receipts موثقة end-to-end، conversation search، archive/pin/mute، spam controls، load test |
| الثقة | Trust Graph، verification، ratings، seller page | جزئي قوي | identity/business verification provider، transaction-based reviews، dispute resolution، review replies، badges قابلة للتفسير بالكامل |
| المتاجر | seller listings/profile فقط | ناقص | storefront branding، catalog، followers، business hours، inventory، storefront analytics، bulk listing tools، verified business profile |
| السيارات | brands/models/trims وحقول أساسية | جزئي | VIN decoder/provider، history/accident report، valuation، financing، inspection، compare cars، dealer CRM، lead routing |
| العقار | country/city/district وlisting عام | ناقص | property schema عميق، floor plan، amenities، mortgage/rent calculator، valuation، availability، agent profile، map polygons، lead CRM |
| الوظائف | category عامة/حقول إعلان | ناقص | employer profile، structured job schema، salary range، skills، screening questions، CV/profile، apply pipeline، saved jobs، employer dashboard |
| الخدمات/الرحلات/المنتجات | صفحات أو حقول متفرقة | جزئي | vertical schemas، booking/availability، quote workflow، reviews مرتبطة بالخدمة، vendor tools |
| الإعلانات المدفوعة | ads وboost وwallet placeholders | جزئي | billing provider، invoices، packages، campaign targeting، budget/pacing، attribution، fraud controls |
| الإحالات | `/referral/me` وleaderboard وتسجيل referral code | جزئي | attribution موثوق، منع self-referral/fraud، reward ledger، milestones/config من admin، share links/deep links، payout/credit rules، analytics |
| الإشعارات | Web Push، Expo، preferences، scheduling، deep links | جزئي قوي | APNs/FCM/HMS device verification، notification center filtering، deduplication، delivery receipts، campaign segmentation |
| الإدارة | stats، CRM overview، moderation، users، reports، finance summary، SEO، ads، notifications، geo، logs، theme | جزئي | cohort/retention، realtime visitors، device/browser/OS، session duration، funnels حسب source/country/device، user 360، audit/RBAC، exports، dashboards محفوظة، anomaly alerts، CRM cases، referral controls |
| SEO/Geo | sitemap، robots، IndexNow، listing SEO، geo detection/reverse/search | جزئي قوي | SSR/prerender multilingual، hreflang validation، canonical governance، structured data per vertical، content quality scoring، search console ingestion، geo landing pages |
| القياس | analytics events وoverview | جزئي | event contract، consent، anonymous/session identity، source attribution، duration/heartbeat، device/browser/OS، retention، export، data retention policy |

## ميزات المنافسين التي يجب إضافتها كدفعات

| الدفعة | المخرجات | الأولوية |
|---|---|---|
| Admin Intelligence | visitor live board، sessions، duration، device/OS/browser، source/campaign، funnels، cohorts، top screens، user 360، exports، anomaly alerts | P0 |
| Referral & Growth | referral ledger، anti-fraud، milestone rules، reward wallet، campaign links، admin controls، attribution dashboard | P0 |
| Seller Storefront | صفحة متجر، branding، catalog filters، hours، verification، follow، seller analytics، bulk actions | P1 |
| Vertical Cars | VIN/history/valuation/inspection/compare/financing/dealer leads | P1 |
| Vertical Real Estate | schema كامل، amenities، floor plans، calculators، agent CRM، availability، map enhancements | P1 |
| Vertical Jobs | structured job post، employer page، applications، CV/profile، screening، pipeline | P1 |
| Commerce & Trust | checkout/payment provider، invoices، deposits، disputes، transaction reviews، escrow-ready abstraction | P1 |
| Discovery | compare، collections، richer saved search alerts، recommendations، duplicate/quality scoring | P1 |
| Messaging parity | media/voice، search، archive/pin/mute، read receipts، anti-spam، delivery telemetry | P1 |

## Admin dashboard المطلوب

يجب أن تتحول لوحة الإدارة من مجموعة panels إلى **Admin Operating System** يتكون من: لوحة تنفيذية؛ Live Visitors؛ Users 360؛ Listings & vertical quality؛ Moderation/Trust & Safety؛ CRM Leads؛ Messaging health؛ Growth/Referral؛ Revenue/Ads؛ SEO/Geo؛ Notifications/Campaigns؛ Data/Exports؛ Audit/RBAC؛ System Health.

| مساحة الإدارة | البيانات المطلوبة | الإجراء الإداري |
|---|---|---|
| Live Visitors | anonymous/user id، session، current route، referrer، country/city، device، OS، browser، last seen، duration | مشاهدة مباشرة، filter، فتح user/session، حظر IP أو rate-limit review |
| Product analytics | DAU/WAU/MAU، retention، funnels، search terms، top screens، CTR، listing conversion | date range، country/device/source، compare periods، CSV export |
| Users 360 | profile، verification، trust، listings، offers، chats، reports، referrals، wallet، sessions، devices | verify/ban/unban، revoke session، reset push، notes، case assignment |
| Listing intelligence | views، unique viewers، CTR، leads، saves، offer rate، response time، quality score | approve/reject/edit metadata، boost، quarantine، duplicate merge |
| CRM | lead source، seller/buyer، listing، stage، owner، next action، notes، SLA | assign، tag، status، reminders، bulk actions |
| Referral | inviter/invitee، source، conversion، reward status، fraud signals، campaign | configure rewards/milestones، hold/release reward، invalidate، export |
| Trust & safety | reports، blocked users، content risk، repeated devices/IPs، spam patterns | moderation queue، evidence، appeal، audit trail |

## سياسة الصدق في القياس

لا يجوز عرض **مدة الزيارة** أو **الجهاز** أو **المتصفح** على أنها دقيقة ما لم يسجل العميل session start وheartbeat وsession end/timeout، مع سياسة موافقة وخصوصية. لا يجوز بناء تقارير ملايين الزوار من Mongo aggregation غير مفهرسة؛ يجب event collection منفصلة، TTL/retention، indexes، rollups يومية، وRedis فقط للقراءات الحية لا كمصدر تاريخي.

## القرار التنفيذي

لن نقول إن Alhrajplus يملك كل ميزات المنافسين قبل إغلاق بنود P0 وP1 أعلاه. التنفيذ التالي يبدأ بـ **Admin Intelligence + Referral Ledger/Anti-fraud** لأنهما طلب مباشر من المستخدم ويمثلان فجوة بنيوية يمكن إعادة استخدامها لباقي verticals. بعدهما تُنفذ Storefront وCars/Real Estate/Jobs على دفعات مستقلة.
