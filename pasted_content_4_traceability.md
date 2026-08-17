# سجل تتبع pasted_content_4.txt

هذا السجل يحصر أقسام الملف من السطر 1 حتى 1791. الحالة الأولية لكل مطلب هي **يحتاج تدقيقًا** ما لم يثبت التنفيذ باختبار end-to-end موثق. وجود مكوّن أو route أو handler لا يُعد نجاحًا بحد ذاته.

| القسم | نطاق الأسطر | نطاق التدقيق والتنفيذ | الحالة الأولية |
|---|---:|---|---|
| 1. Mandatory workflow | 36–62 | تدقيق Web وMobile وBackend وDB وAuth وNotifications وDeep Links وSearch وAI وReferral وWallet وI18n وAdmin، مع TODO/mock/dead code وparity | يحتاج تدقيقًا شاملًا |
| 2. Multi-AI architecture | 64–86 | تعدد providers/models/credentials references، عدم hardcode للحصص، توثيق رسمي حديث | يحتاج تحققًا |
| 3. Provider manager | 88–134 | سجل provider/model/capabilities/limits/usage/failure/health/cooldown/fallback | يحتاج تحققًا |
| 4. Automatic rotation | 136–177 | priority/weighted selection، quota، health، capability، cooldown، عودة provider السليم | يحتاج اختبار سيناريوهات |
| 5. Automatic failover | 179–217 | تصنيف الأخطاء، retries محدودة، backoff، منع التكرار، fallback الحقيقي | يحتاج اختبار سيناريوهات |
| 6. AI Admin control center | 219–251 | لوحة فعلية للusage/quota/errors/priority/rotation/health/cooldown | يحتاج تحقق UI/API/DB |
| 7. AI token accounting | 253–282 | request/user/task/provider/model/timing/tokens/actual-vs-estimated/fallback lineage | يحتاج تحقق schema وقراءة Admin |
| 8. AI admin controls | 284–327 | automatic/priority/manual-primary+fallback، retries/quota/cooldown/configuration | يحتاج اختبار حفظ وتطبيق |
| 9–10. Quota safety and health | 329–367 | threshold قابل للضبط وحالات healthy/degraded/rate-limited/quota/auth/outage/disabled/cooldown | يحتاج تحققًا |
| 11. Voice search | 368–424 | permission/listening/recognition/edit/search/results، Arabic/English/mixed/errors/retry | يحتاج اختبار جهاز/متصفح |
| 12–13. Image search | 426–490 | camera/gallery/state/progress/upload/vision/OCR/similarity/results/no-match/fallback | يحتاج تحقق end-to-end |
| 14. Referral program | 492–523 | code/link/attribution/deep-link/existing-new/duplicate/self/fraud/status/count/levels/rewards | يحتاج تدقيق كامل |
| 15–18. Coins and promotion | 525–633 | monetary separation، ledger، configurable rewards، auditable transactions، boost/promotion products/rules | يحتاج تحقق end-to-end |
| 19. Referral links | 634–655 | Web/iOS/Android، open/background/closed/not-installed، logged in/out، new/existing | يحتاج اختبار أجهزة حقيقية |
| 20–21. Phone identity and listing phone | 657–708 | add/validate/OTP if supported، no-phone state، verified account phone، dynamic post flow | فجوة Web معروفة وتحتاج إصلاح |
| 22. Notification panel | 710–749 | responsive width/safe areas/RTL/LTR/no clipping، fallback full page | جزئي؛ الصفحة موجودة وتحتاج i18n/routing audit |
| 23–26. Notifications and deep links | 751–912 | structured payload، exact search/chat/listing/comment/auction/offer target، cold start/auth initialization، invalid IDs | يحتاج اختبار شامل |
| 27–30. Localization | 913–1045 | hardcoded strings، Arabic/English/RTL/LTR، pluralization، dates/relative time/currency/units/errors/forms/admin | فجوة مؤكدة في ListingCard/NotificationsPage |
| 31. Listing card visual hierarchy | 1047–1079 | price/title/location/status/boost/time/category، dark/light، accessibility | يحتاج مراجعة بصرية |
| 32. AI banner | 1081–1111 | تقليل vertical space مع بقاء AI Powered والوضوح | يحتاج مراجعة بصرية |
| 33–37. Swipe navigation | 1113–1243 | same result set، controlled gestures، conflicts، end-of-set/back/pagination/prefetch/cache/performance | جزئي؛ Web neighbor موجود ويحتاج result-context audit وMobile parity |
| 38–40. Competitor audit | 1245–1417 | Haraj/OLX/Dubizzle/OpenSooq/Facebook وغيرها، تحويل الفجوات إلى feasibility/DB/API/UI/Admin/security/performance ثم تنفيذ القابل | يحتاج بحث حديث وتنفيذ |
| 41. Performance audit | 1419–1453 | startup/navigation/search/feed/detail/images/chat/notifications/API/DB/indexes/rendering/cache/pagination/bundle | يحتاج قياس |
| 42. Cross-platform consistency | 1455–1473 | Web/iOS/Android/Backend/Admin business rules and feature parity | يحتاج matrix |
| 43. Security | 1475–1502 | secret isolation، referral/coin/wallet/notification/deep-link/ownership/chat/admin authorization | يحتاج security audit |
| 44. Transaction safety | 1504–1518 | atomic/idempotent rewards/spend/boost/referrals، race/double-spend prevention | جزئي؛ يحتاج اختبار race/idempotency |
| 45. Error handling | 1520–1536 | loading/success/empty/error/retry/timeout/offline، no silent buttons | يحتاج grep ومسارات UI audit |
| 46. Analytics/observability | 1538–1563 | AI/search/referral/coins/boost/notifications/deep-link/swipe event tracking | يحتاج event inventory وAdmin verification |
| 47. Testing | 1565–1657 | AI, voice, image, referral, phone, notifications, i18n, swipe scenarios | يحتاج test matrix وتنفيذ ما يمكن |
| 48. Verification rule | 1659–1681 | عدم إعلان النجاح دون evidence، توثيق unavailable services/devices | قاعدة قبول إلزامية |
| 49. Final audit report | 1683–1751 | Completed/Fixed/New/Backend/Web/Mobile/Admin/DB/AI/Test/Remaining/Next features | سيُحدّث في التسليم |
| 50. Final rule | 1753–1791 | لا placeholders، لا omissions، fix underlying implementation، تقرير صادق | قاعدة قبول نهائية |

## بوابة قبول كل مرحلة

لا تنتقل المرحلة إلا بعد وجود ثلاثة أدلة على الأقل: قراءة المسار والكود، اختبار آلي أو staging مناسب، وتسجيل واضح لما تعذر اختباره وسببه. العناصر التي تحتاج جهازًا أو خدمة خارجية ستُصنّف إلى **مُنفذ ومختبر جزئيًا** بدل ادعاء نجاح كامل.

## ملاحظات فجوات مؤكدة من الفحص السابق

ملف Web `PostListing.js` لا يملك parity كاملة لاختيار account/custom phone ولا verified-phone gating، رغم وجود منطق أوسع في Mobile. `ListingCard.js` ما زال يعرض relative time ووصف verified بالعربية داخل الإنجليزية. `NotificationsPage.js` يستخدم `dir="rtl"` و`toLocaleString("ar")` دائمًا، كما أن route helper فيه أضيق من خرائط الإشعارات الأخرى. هذه ليست افتراضات؛ ستُعاد قراءتها واختبارها في المرحلة المعمارية قبل تعديلها.
