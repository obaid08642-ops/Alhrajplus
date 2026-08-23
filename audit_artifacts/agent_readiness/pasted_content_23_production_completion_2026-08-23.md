# إتمام التحقق الإنتاجي لمتطلبات `Pasted_content_23.txt`

**التاريخ:** 2026-08-23  
**حالة النشر:** تم التحقق حيًا من طبقة Web/Backend العامة بعد نشر Render وVercel.  
**Commit إصلاح تفاوض Markdown:** `d760831` — `fix: serve root markdown before static index`.

## النتيجة الحية

| المورد أو السلوك | النتيجة الفعلية على `www.alhraj.online` | الحالة |
|---|---|---|
| `GET /` مع `Accept: text/markdown` | `200`، `Content-Type: text/markdown; charset=utf-8`، `Vary: Accept`، `X-Markdown-Tokens: 73`، وMarkdown يبدأ بـ`# Haraj Plus`. | ناجح |
| `GET /` دون طلب Markdown | `200` و`Content-Type: text/html; charset=utf-8` مع `Vary: Accept`. | ناجح |
| `/openapi.json` | وثيقة OpenAPI 3.1 مقيدة للقراءة، تحمل `x-service-info` ولا تحتوي مسارات cron أو chat أو wallet أو admin. | ناجح |
| `/.well-known/ai-catalog.json` | `specVersion: "1.0"` و`host.identifier: did:web:alhraj.online` و`entries[].identifier`. | ناجح |
| `/auth.md` | يبدأ بـ`# Auth.md`، ويصرح بصدق بعدم توفر OAuth/Agent Registration تشغيليًا. | ناجح |
| `/robots.txt` | يحوي Content Signals و`Agentmap: https://alhraj.online/.well-known/ai-catalog.json`. | ناجح |
| `/.well-known/api-catalog` | `200` و`Content-Type: application/linkset+json`. | ناجح |
| WebMCP | يبقى محصورًا في `search_public_listings` و`get_public_listing` للقراءة العامة. | محمي ومختبر محليًا |

استخدمت Routing Middleware في Vercel لمسار `/` لأن ملفات CRA الثابتة كانت تتجاوز الـrewrite التقليدي وتعيد `index.html` قبل اختيار Markdown. تعمل Middleware قبل filesystem/cache، وتستدعي `/agent/home.md` فقط عندما يعلن العميل صراحة تفضيل `text/markdown`، ثم يمر طلب HTML الطبيعي إلى الموقع الثابت. [1]

## الاختبارات التي نجحت

| البوابة | النتيجة |
|---|---|
| اختبارات عقود Backend الخاصة بالاكتشاف وSEO | `21 passed` |
| اختبارات Web | `6 suites / 21 tests passed` |
| بناء Web الإنتاجي | نجح |
| JSON validation لـ`vercel.json` و`git diff --check` | نجحا قبل الرفع |
| Expo Android export | نجح؛ bundle بحجم 7.39 MB |
| تحقق HTTP الحي بعد النشر | اجتاز تفاوض Markdown وOpenAPI وARD وAuth.md وrobots وAPI catalog |

## حدود مقصودة وعناصر مؤجلة

> **لا يوجد ادعاء بأن DNS-AID أو DNSSEC أو OAuth Agent Registration أو MPP مدفوع أصبحت تعمل.** هذه عناصر تشغيلية تحتاج خدمات وصلاحيات وأسرار لا يمكن استبدالها بملفات وصفية.

| العنصر | الحالة | ما يلزم قبل التنفيذ |
|---|---|---|
| DNS-AID وDNSSEC | مؤجل بطلب المستخدم لتخطي Cloudflare. | تحديد مزود DNS وصلاحية المنطقة، ثم إنشاء/فحص SVCB/HTTPS وDS مع خطة rollback. |
| OAuth Protected Resource وAgent Registration | metadata وصفية فقط للموارد العامة؛ لا grants أو issuer أو registration وهمية. | اختيار authorization server فعلي مع PKCE وJWKS وconsent وscopes وrevoke/claim واختبارات. |
| MPP وHTTP 402 | غير منفذ؛ لا `x-payment-info` ولا endpoint مدفوع صوري. | مزود Sandbox، endpoint عام محدود، سعر اختبار، مفاتيح خادم، receipt/replay/idempotency واختبار end-to-end بلا أموال حية. |
| تعامل Mobile مع 402 | مؤجل، لأن Mobile لا يجب أن يعرض تجربة دفع قبل وجود 402 موثق من Backend. | يضاف بعد نشر MPP وتشغيل Sandbox بنجاح. |

## مراجع

[1]: https://vercel.com/docs/routing-middleware "Vercel Routing Middleware"

## أدلة قابلة للمراجعة

- `live_verification_after_render_2026-08-23.txt`: يسجل ظهور العقود الجديدة في Backend بعد نشر Render؛ ويكشف فشل rewrite الجذري السابق بوضوح.
- `root_markdown_middleware_verification_2026-08-23.txt`: يسجل نجاح تفاوض Markdown النهائي بعد Middleware.
- `render_deployment_blocker_2026-08-23.md`: يسجل سبب عدم تطابق Render قبل النشر اليدوي.
- `github_main_public_verification_2026-08-23.md`: يسجل مطابقة main العام وSHA وروابط commits.
