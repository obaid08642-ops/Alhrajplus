# إتمام جاهزية اكتشاف الوكلاء والذكاء الاصطناعي

**التاريخ:** 2026-08-23
**النطاق:** تنفيذ بنود ملف التقييم كاملة باستثناء DNS-AID وDNSSEC، بناءً على طلب مالك المشروع.

## النتيجة

تمت إضافة طبقة اكتشاف عامة ومقيدة بالقراءة فقط إلى المنصة. تعتمد رؤوس `Link` على نموذج Web Linking، ويعيد `/.well-known/api-catalog` مستند Linkset بصيغة `application/linkset+json` كما تتطلب مواصفة API Catalog. [1] [2]

| البند | التنفيذ | حالة الأمان |
|---|---|---|
| Link headers | الصفحة الرئيسية تروّج لـAPI Catalog وواجهة الوثائق و`llms.txt`، وتضيف صفحات الإعلان رؤوس اكتشاف ومحتوى Signals. | لا تشير إلى واجهات خاصة. |
| Markdown negotiation | صفحة البداية ومسارات الإعلان تعيد `text/markdown` عند `Accept: text/markdown`، مع `Vary: Accept` و`X-Markdown-Tokens`. | مقتصر على حقائق الإعلان العامة. |
| Content Signals | `robots.txt` يعلن `ai-train=no, search=yes, ai-input=yes` ويحجب الحسابات والمحادثات والمحفظة والإدارة. | تفضيل منشور؛ ليس بديلًا عن التحكم التقني بالوصول. |
| API Catalog | `/.well-known/api-catalog` مع Linkset وservice-desc وservice-doc وstatus. | يسرد القراءة العامة فقط. |
| Public OpenAPI | `/.well-known/public-openapi.json` لخمسة مسارات قراءة فقط. | لا يعرض وثيقة OpenAPI الداخلية الكاملة. |
| OAuth metadata | موارد discovery وProtected Resource و`auth.md` تصف بدقة عدم توفر OAuth grants أو تسجيل العملاء. | لا تصطنع authorization/token/JWKS أو scopes غير موجودة. |
| MCP | بطاقة MCP و`/api/mcp` تنفذ `initialize` و`tools/list` و`tools/call` لأداتين عامتين فقط. | البحث وجلب إعلان عام فقط؛ لا كتابة أو أموال أو دردشة. |
| Agent Skills | index v0.2.0 و`SKILL.md` وبصمة SHA-256. | لا scripts أو archives أو تعليمات تنفيذ. |
| ARD | `/.well-known/ai-catalog.json` مع API/MCP/Skill واستعلامات تمثيلية. | لا يقدم أي قدرة خاصة. |
| WebMCP | تسجيل تدريجي عبر `navigator.modelContext.provideContext()` إن توفرت واجهة المعاينة. | خامد في المتصفحات غير الداعمة ويعرض الأداتين العامتين فقط. |

> لا يجوز تفسير مستندات OAuth المنشورة باعتبارها خدمة OAuth تشغيلية. تُظهر الحقول الفارغة عمدًا أن المنصة لا تصدر OAuth grants أو OAuth client credentials حتى تنفذ دورة authorization-code مع PKCE والموافقة وسحب الصلاحيات فعليًا. تنص RFC 8414 وRFC 9728 على أن بيانات الاكتشاف يجب أن تصف endpoints وقدرات حقيقية. [3] [4]

## نقاط النشر

تتولى إعدادات Vercel تمرير موارد `.well-known` و`auth.md` و`llms.txt` والوثائق إلى Backend. كما يوجد Rewrite مشروط بقبول `text/markdown` لتمثيل الصفحة العامة، فلا يتأثر عرض HTML الاعتيادي في المتصفحات.

## نتائج التحقق

| البوابة | النتيجة |
|---|---|
| اختبار عقود موارد الوكلاء HTTP | 6 passed |
| بوابة اختبارات Backend الكاملة | 127 passed |
| اختبارات Web | 21 passed |
| بناء Web الإنتاجي | ناجح |
| حارس التعريب | ناجح |
| `git diff --check` | ناجح |
| JSON الخاص بـVercel | صحيح عبر `python -m json.tool` |

## الاستثناءات المقصودة

لم يُنفذ DNS-AID أو DNSSEC، كما طلب المالك. لا يمكن لتغيير المصدر وحده إنشاء سجلات DNS أو توقيع منطقة DNS؛ سيظل ذلك منفصلًا عند اتخاذ قرار تفعيله. لا ينشر هذا التغيير عمليات ترويج أو مزاد أو دفع أو رسائل أو ملفات شخصية عبر MCP أو WebMCP، لأن تلك عمليات حساسة تتطلب تفويضًا صريحًا ودورة موافقة قابلة للمراجعة.

## المراجع

[1] [RFC 8288 — Web Linking](https://www.rfc-editor.org/rfc/rfc8288)

[2] [RFC 9727 — API Catalog](https://www.rfc-editor.org/rfc/rfc9727)

[3] [RFC 8414 — OAuth 2.0 Authorization Server Metadata](https://www.rfc-editor.org/rfc/rfc8414)

[4] [RFC 9728 — OAuth 2.0 Protected Resource Metadata](https://www.rfc-editor.org/rfc/rfc9728)

[5] [Cloudflare — Markdown for Agents](https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/)

[6] [Content Signals](https://contentsignals.org/)

[7] [Agent Skills Discovery RFC v0.2.0](https://github.com/cloudflare/agent-skills-discovery-rfc)

[8] [Chrome — WebMCP early preview](https://developer.chrome.com/blog/webmcp-epp)
