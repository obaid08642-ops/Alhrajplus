# تقرير إغلاق Phase 2 التمهيدية — التحكم الإداري، MFA، الجلسات، وStory Viewer

**تاريخ الإغلاق:** 17 أغسطس 2026  
**الحالة النهائية:** **PASS WITH BLOCKERS**  
**قاعدة الإيقاف:** لم يبدأ أي عمل من Phase 3.

> أُغلق العائق السابق: خدمة Render أصبحت تشغّل نسخة الـBackend التي تحتوي مسار MFA الجديد؛ وأصبح `GET /api/auth/mfa/status` للزائر يعيد `401 Not authenticated` بدل `404`.

## نطاق التنفيذ الذي تم التحقق منه

| المجال | التنفيذ المتحقق |
|---|---|
| Admin/RBAC | إظهار زر لوحة الإدارة بناءً على `user.role === "admin"` فقط، وحارس Web لمسار `/admin`، وحد Backend بـ`require_admin`، وشاشة Admin حقيقية في Mobile. |
| MFA | TOTP فعلي، أسرار مشفرة، recovery codes مجزأة، challenge لتسجيل الدخول، حد محاولات، أحداث أمان، وتدفق Web/Mobile. |
| الجلسات | سجلات `auth_sessions`، JWT refresh يحمل `sid` و`jti`، تدوير refresh، قائمة جلسات، revoke، وlogout-all. |
| Cash وCoins | إيقاف مكافأة الرصيد النقدي نهائيًا؛ أي مكافأة ترحيبية تصبح Coins فقط وبشروط server-side. |
| Reels/Stories | Viewer immersive بارتفاع `100dvh` وsafe areas، progress، تشغيل/إيقاف، انتقال، mute، auto-advance، وإجراءات الإعلان. |

## التسلسل المرجعي للـcommits

| Commit | الوصف | حالة النشر |
|---|---|---|
| [`be038a1`][1] | التحصين التمهيدي: RBAC، فصل Cash/Coins، سلامة البيانات، وشفافية ICE/relay. | منشور ضمن النسخة التي تحقق منها Backend. |
| [`463c353`][2] | MFA TOTP، جلسات/refresh rotation، شاشة MFA Web/Mobile، وتحسينات Story. | منشور على Render؛ ثبت ذلك بسلوك endpoint MFA. |
| [`1539092`][3] | إصلاح crash في progress الخاص بـReels. | منشور على Vercel؛ تغير bundle العام ونجح smoke test في المتصفح. |

## الخلل المكتشف والمصحح أثناء الإغلاق

كان مسار `https://www.alhraj.online/reels` يصل إلى Error Boundary عام. تم استخراج الاستثناء من حالة React الفعلية، وكان:

> `TypeError: Cannot read properties of null (reading 'duration')`

السبب هو قراءة `event.currentTarget.duration` داخل functional state updater مؤجل في `onTimeUpdate`. بعد أن تعيد React استخدام synthetic event يصبح `currentTarget` فارغًا. الإصلاح يلتقط عنصر الفيديو وقيمتي `duration` و`currentTime` بصورة متزامنة، ثم يمرر نسبة منتهية ومحصورة بين `0` و`1` إلى state. لا يوجد وصول مؤجل إلى event داخل updater.

## مصفوفة الاختبارات المنفذة

| الاختبار | النتيجة | الدليل العملي |
|---|---|---|
| Web unit tests | **PASS** | 3 suites و11 اختبارًا ناجحًا. |
| Web production build | **PASS** | `craco build` نجح بعد إصلاح Reels. |
| Backend compile + Phase 2 tests | **PASS** | `compileall` ناجح، و6 اختبارات مستهدفة نجحت. ظهرت تحذيرات deprecation قديمة لا تفشل الاختبار. |
| Expo export | **PASS** | تم export حالي لـWeb وAndroid وiOS بنجاح. |
| Render health | **PASS** | `/api/health` أعاد `200` مع MongoDB متصلة. [4] |
| MFA للزائر | **PASS** | `/api/auth/mfa/status` أعاد `401`، وهذا دليل النشر المطلوب. [5] |
| Admin API للزائر | **PASS** | `/api/admin/stats` أعاد `401`. |
| Admin API لمستخدم عادي | **PASS** | حساب اختبار بدور `user` تلقى `403 Admin access required`. |
| MFA status لمستخدم مصدّق | **PASS** | أعاد `200` وحالة MFA الصحيحة قبل الاختبار وبعد تنظيفه. |
| Cash welcome bonus | **PASS** | `POST /api/wallet/claim-welcome-bonus` أعاد `410` قبل أي تعديل على الرصيد. |
| Coins boundary | **PASS** | المسار يتطلب مصادقة وتحقق الحساب قبل أي mint؛ لم تُطالب Coins في الاختبار. |
| MFA end-to-end على staging | **PASS** | enrollment، TOTP verification، password login challenge، ثم TOTP challenge completion نجحت. |
| session revoke | **PASS** | قائمة الجلسات حددت الجلسة الحالية، revoke نجح، ثم refresh token الخاص بها أعاد `401`. |
| cleanup اختبار MFA | **PASS** | تم تعطيل MFA بعد الاختبار وإبطال الجلسات؛ والتحقق النهائي أعاد `enabled:false`. |
| Admin route للزائر | **PASS** | `/admin` في Web أعاد الزائر إلى `/login`. |
| Admin UI/route لمستخدم عادي | **PASS** | Profile المنشور لم يعرض زر Admin Dashboard، وزيارة `/admin` أعادت المستخدم إلى `/profile`. ثم تم logout للجلسة الاختبارية. |
| Reels المنشور | **PASS** | تغير bundle Vercel من `main.8786f7f2.js` إلى `main.beec21cc.js`؛ Viewer ظهر بلا Error Boundary، ونجحت أزرار pause وnext. [6] |

لم تُحفظ كلمة مرور، رمز TOTP، recovery code، أو access/refresh token في Git. ملف اختبار MFA المؤقت حُذف فور إتمام الاختبار، كما أن حساب الاختبار عاد إلى MFA-disabled.

## القيود والحواجز المتبقية

| البند | الأثر | ما يلزم لإغلاقه |
|---|---|---|
| اختبار نجاح administrator الحقيقي | لم يتم اختبار ظهور زر Admin وفتح `/admin` و`/admin/stats` بحساب إداري فعلي؛ الاختبارات السلبية وطبقة Backend اجتازتا. | توفير حساب admin مخصص للاختبار أو اعتماد جلسة إدارية آمنة؛ لا يلزم أو يُفضَّل مشاركة كلمة مرور الحساب الأساسي. |
| اختبار جهاز فعلي | لم تُجرَ MFA/Story على Safari iOS وAndroid Chrome على أجهزة مادية؛ export فقط اجتاز. | اختبار يدوي على جهاز iOS وجهاز Android بعد تثبيت build أو Expo Go مناسب. |
| مفتاح تشفير MFA المخصص | تدفق MFA يعمل عبر staging، لكن لا يمكن قراءة إعدادات Render السرية من التطبيق للتحقق من وجود `MFA_ENCRYPTION_KEY` مستقل عن `JWT_SECRET`. | التأكد من وجود `MFA_ENCRYPTION_KEY` قوي ومخصص في Render، مع بقاء fallback الحالي كحماية توافقية فقط. |
| WebRTC relay مادي | طبقة ICE تصف حالة relay بصدق، لكن جودة المكالمات خلف شبكات NAT المقيدة تتطلب جهازين وشبكتين حقيقيتين. | إجراء call smoke بين Web وMobile على شبكتين مختلفتين قبل إعلان الاتصال إنتاجيًا. |

هذه القيود لا تبرر بدء Phase 3 تلقائيًا. Phase 2 أُغلق بـ**PASS WITH BLOCKERS** لأن تدفقات MFA والجلسات وRBAC السلبية وواجهة Reels نُفذت واختُبرت فعليًا، بينما نجاح administrator والجهاز الحقيقي يحتاجان أدوات/حسابات لا تُفترض ولا تُنشأ ببيانات المستخدمين.

## المراجع

[1]: https://github.com/obaid08642-ops/Alhrajplus/commit/be038a1 "Commit be038a1"
[2]: https://github.com/obaid08642-ops/Alhrajplus/commit/463c353 "Commit 463c353"
[3]: https://github.com/obaid08642-ops/Alhrajplus/commit/1539092 "Commit 1539092"
[4]: https://alhrajplus.onrender.com/api/health "Render health endpoint"
[5]: https://alhrajplus.onrender.com/api/auth/mfa/status "Render MFA status endpoint"
[6]: https://www.alhraj.online/reels "Deployed Reels viewer"
