# Phase 4 — مراجعة تمهيدية: الحساب، الإعلانات، الوسائط، العروض والمتابعات

**التاريخ:** 17 أغسطس 2026  
**الحالة:** مراجعة قبل التنفيذ؛ لم تُنفذ أي mutation على staging في هذه الخطوة.

## نطاق الخطة المعتمد

تغطي المرحلة collections الحساب المتخصصة، lifecycle العروض، المتابعة، البحث المحفوظ، التحقق من هاتف الحساب، رحلة إنشاء/تعديل الإعلان، جودة الإعلان والـAI hints، الوسائط وGLB/GLTF، وملفات البائع/المشتري. لا تُعامل شاشة أو endpoint موجودة وحدها كتنفيذ مكتمل.

## الموجود فعليًا

| المجال | Backend | Web | Mobile | القراءة الأولية |
|---|---|---|---|---|
| المفضلة | add/remove/check/list موجودة ومقيّدة بالمستخدم والدولة | Profile و`/favorites` يعرضان cards | Listing cards وOtherScreens | موجود، لكن ليس collection متخصصًا كاملًا في Web. |
| Watchlist | add/remove/list موجودة | موجودة في Listing Detail فقط | موجودة في Listing Detail | لا توجد صفحة collection متخصصة في Web أو Mobile. |
| العروض | create/list/mine/accept/reject/counter موجودة | Profile tab فقط | OffersScreen مستقل | lifecycle ناقص role transition الدقيق وidempotency client key وواجهة buyer لقبول/رفض counter. |
| متابعة البائع/الفئة | endpoints موجودة | Detail فقط؛ `/following` صفحة عامة لا تفكك `{categories,sellers}` | FollowingScreen موجودة | Web لا يعرض following فعليًا؛ Mobile لا يعرض unfollow للبائع. |
| Saved search | save/list/delete موجود | `/saved-searches` صفحة عامة بلا run/delete/filter actions | شاشة قائمة/حذف/فتح Search | backend لا يربط upsert بالبلد/filters كاملة، وواجهة Web ناقصة. |
| هاتف الحساب | profile يسمح بتخزين phone وتنسيقه | PhoneEditor مباشر بلا verified state | استخدام رقم الحساب في Post flow | لا يوجد SMS provider أو OTP endpoint أو `phone_verified` lifecycle حقيقي؛ لا يجوز ادعاء التحقق. |
| إنشاء/تعديل الإعلان | country/city/currency validation وdraft/media موجودة | PostListing متقدم | PostScreen متقدم | يلزم تدقيق false claims وprogress/preview/retry/cleanup لا بناء موازي. |
| 3D | يتحقق backend من URL GLB/GLTF | رفع وعارض `model-viewer` حقيقي | upload + WebView model-viewer | متاح لملف GLB/GLTF جاهز فقط؛ لا توجد خدمة توليد image/video-to-3D ولا ينبغي الادعاء بها. |

## فجوات مثبتة ستعالج في Phase 4

1. العروض تستقبل `country_code` كـquery فقط ولا تربطه بدولة الحساب الخادمية، وتسمح حاليًا للمشتري باتخاذ accept/reject على عرضه pending؛ ستفرض انتقالات seller/buyer وتعامل expiration بصورة موحدة.
2. لا يوجد idempotency key للعروض. سيضاف `client_offer_id` مع unique logical operation والتحقق من payload عند retry.
3. صفحات Web العامة `AccountCollectionPage` تفرغ نتائج following لأن API يرجع object لا array، ولا توفر actions متخصصة للـsaved search أو follow/unfollow أو offer lifecycle.
4. Saved search upsert لا يتضمن `country_code/category/min/max` في identity، فلا يضمن حفظ بحثين متشابهين لبلدين مختلفين، ولا ينفذ exact search server-side عند تشغيله.
5. الفئة follow لا تحمل `country_code`، ما يسمح بخلط اشتراك التصنيف بين الأسواق؛ seller follow لا يرجع card غنيًا أو unfollow في واجهة Mobile.
6. خيار `Use account phone` لا يستند إلى `phone_verified`. ستُطبق gate خادمية/واجهية واضحة، لكن SMS OTP الفعلي محجوب لعدم وجود provider/configuration في المشروع؛ لن يُنشأ OTP وهمي.
7. اختبارات Phase 4 تحتاج زوج حسابات معزولين للحصول على evidence كامل للعرض، ولا يُنشأ أو يُغيّر data حية قبل أن تكون الطلبات rejected أو cleanup قابلًا للتحقق.

## سياسة التنفيذ

سيُبنى عقد Backend موحدًا أولًا، ثم Web وMobile. أي OTP حقيقي يعتمد على مزود SMS وبيانات اعتماد سرية يبقى `BLOCKED` مع واجهة صادقة توجه المستخدم لإضافة رقم بدل إظهار أنه موثق. وسيظل 3D supported للملفات GLB/GLTF فقط، مع تعليمات خارجية صريحة بدل أي زر توليد مزيف.
