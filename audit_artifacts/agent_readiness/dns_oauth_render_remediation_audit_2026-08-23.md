# تدقيق DNS-AID وOAuth وRender

**التاريخ:** 2026-08-23  
**النطاق:** `alhraj.online` و`www.alhraj.online` وخدمة `haraj-api`.

## النتيجة التنفيذية

منصة الويب تنشر الآن موارد ARD وAuth.md وOAuth metadata وصيغة MCP العامة بنجاح، لكن ذلك لا يساوي تسجيل وكلاء أو تفويض OAuth فعلي. الفحص الحي يؤكد غياب سجلات DNS-AID وDNSSEC، كما يؤكد أن بيانات OAuth الحالية تصرح بصدق بعدم وجود issuer أو grants أو registration.

| المجال | النتيجة الفعلية | التصنيف |
|---|---|---|
| DNS-AID | لا يوجد SVCB/HTTPS في `_index._agents.alhraj.online` أو `_a2a._agents.alhraj.online`. | يحتاج سلطة DNS. |
| DNSSEC | لا توجد DS في نطاق `.online` ولا DNSKEY موقّع للنطاق. | يحتاج مزود DNS وRegistrar. |
| OAuth Protected Resource | `/.well-known/oauth-protected-resource` يعيد 200 و`resource` صحيحًا، لكن `authorization_servers` وscopes وbearer methods فارغة. | صادق حاليًا؛ لا يحقق تفويض OAuth. |
| Auth.md | يعيد Markdown وعنوان H1 صحيحين، لكنه يعلن عدم توفر agent registration. | صادق حاليًا؛ لا يحقق registration. |
| OAuth Authorization Server | يعيد issuer وصفياً بلا grants أو token endpoint أو register/claim/revocation endpoints. | لا يجوز تسويقه كخادم OAuth. |
| Redis | `REDIS_URL` موجود لكنه يرفض الاتصال على 6379؛ الكود ينتقل إلى in-memory cache. | خلل إعداد/خدمة تشغيلية. |
| MFA | لا يوجد `MFA_ENCRYPTION_KEY`؛ يوجد fallback مشتق من JWT لتجنب plaintext. | فجوة hardening تتطلب قيمة ثابتة في Render. |
| pip root | تحذير build من Dockerfile، وليس فشلًا أو خطأ runtime. | تحسين صورة تشغيل. |

## DNS-AID

DNS-AID في المرجع الحالي هو **Internet-Draft** وليس RFC نهائيًا؛ لذلك يجب نشره كمعلومات اكتشاف تجريبية قابلة للرجوع، لا باعتباره توافقًا معياريًا نهائيًا. يعتمد على SVCB ServiceMode، مع DNSSEC موصى به لتوثيق أصل البيانات وسلامتها. [1] [2]

في هذا المشروع يجب ألا تعلن سجلات DNS عن `a2a` أو endpoint كتابة أو OAuth غير موجود. الهدف الآمن الأول هو فهرس منظمة عام وقراءة فقط يصف نقاط الاكتشاف الموجودة أصلًا.

| سجل مقترح بعد اعتماد DNS | الغرض | شرط الصدق |
|---|---|---|
| `_index._agents.alhraj.online` SVCB | إدخال فهرس المنظمة ونقطة قراءة metadata. | لا يذكر بروتوكولًا أو capability غير مدعومين. |
| `_mcp._agents.alhraj.online` SVCB | نقطة MCP العامة للقراءة فقط. | يطابق MCP server card و`/api/mcp` العام. |
| `alhraj.online` DS/DNSKEY | سلسلة DNSSEC. | مفعل من DNS provider والـRegistrar مع تحقق AD/RRSIG. |

يجب تحديد صيغة SvcParams بحسب ما يدعمه مزود DNS فعلًا. لا تُدرج مفاتيح `keyNNNNN` أو digest descriptor قبل بناء capability descriptor ثابت، وحساب SHA-256 له، والتحقق عبر DNS-over-HTTPS. [1] [2]

## OAuth وAuth.md

RFC 9728 يلزم تطابق قيمة `resource` حرفيًا مع resource identifier الذي اشتقت منه well-known URL؛ كما أن `authorization_servers` وscopes وطرق Bearer يجب أن تصف خادمًا قادرًا فعليًا على إصدار والتحقق من access tokens. [3]

لا يمكن إصلاح "No OAuth Protected Resource Metadata found" بإضافة issuer وهمي. يلزم أولًا اختيار Authorization Server حقيقي (مُدار أو داخلي) ثم تنفيذ Authorization Code + PKCE، JWKS، token validation، client/agent registration أو identity/claim flow، revocation، scopes، موافقة المستخدم وسجل تدقيق. مسار Auth.md المرجعي يتطلب metadata متسقة و`agent_auth` يشير إلى endpoints موجودة، لا عمليات فحص نشطة قد تنشئ حسابات أثناء الاكتشاف. [4] [5]

## أخطاء Render

### Redis

الرسالة `Connection refused` تعني أن التطبيق حاول الاتصال وواجه رفضًا من endpoint، وليست مجرد غياب مكتبة. السلوك الحالي لا يوقف التطبيق بل يخفض cache إلى in-memory؛ وهذا يظل خطرًا تشغيليًا على أكثر من instance لأنه لا يشارك invalidation أو state. السبب الفعلي لا يُحسم من السجل وحده: قد تكون خدمة Redis متوقفة أو endpoint/port خاطئًا أو عدم توافق TLS أو شبكة خدمة خاصة.

الإجراء الآمن هو الحصول من مزود Redis على URI الإنتاج الصحيح (غالبًا `rediss://` عندما يلزم TLS)، ووضعه في Render باسم `REDIS_URL`، ثم التحقق من `/api/health/ready` ومن سجل `Redis connected` من دون طباعة URI أو كلمة مرور. لا يُستبدل بقيمة تجريبية ولا يُدرج في Git.

### MFA_ENCRYPTION_KEY

الـfallback الحالي يحمي TOTP من التخزين النصي لكنه يربط تشفير MFA بمفتاح JWT. يجب توليد Fernet key واحد ثابت بصيغة URL-safe base64 ووضعه سرًا في Render باسم `MFA_ENCRYPTION_KEY`. لا يجوز توليده تلقائيًا داخل `render.yaml` لنشر قائم لأن تغيير المفتاح دون migration قد يجعل أسرار TOTP المخزنة غير قابلة للفك. ويجب الاحتفاظ بالقيمة الحالية في مخزن أسرار آمن قبل أي تدوير.

### تحذير pip

تحذير `Running pip as root` يصدر أثناء Docker build؛ لا يمنع التثبيت أو تشغيل الخدمة. يمكن تحسين Dockerfile باستخدام virtual environment ومستخدم non-root، ثم تشغيل Uvicorn بذلك المستخدم؛ وهذا يخفض التحذير ويحسن hygiene لكنه لا يصلح Redis أو MFA.

## الوصول والصلاحيات

تم العثور على موصلات Cloudflare وCloudflare API لكنها **معطلة**، ولا يوجد موصل Render. لا توجد صلاحية مؤكدة لتعديل DNS أو إعداد متغيرات خدمة Render. لذلك لا يمكن نشر DNS-AID أو تفعيل DNSSEC أو وضع أسرار Redis/MFA من دون موافقة وربط الحساب/المزود المناسبين.

## المراجع

[1]: https://datatracker.ietf.org/doc/draft-mozleywilliams-dnsop-dnsaid/ "DNS for AI Discovery Internet-Draft"
[2]: https://www.rfc-editor.org/rfc/rfc9460 "RFC 9460: Service Binding and Parameter Specification via the DNS"
[3]: https://www.rfc-editor.org/rfc/rfc9728 "RFC 9728: OAuth 2.0 Protected Resource Metadata"
[4]: https://isitagentready.com/.well-known/agent-skills/auth-md/SKILL.md "Auth.md Agent Registration Discovery Skill"
[5]: https://github.com/workos/auth.md "workos/auth.md reference implementation"
