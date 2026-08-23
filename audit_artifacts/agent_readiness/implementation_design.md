# تصميم جاهزية اكتشاف الوكلاء

**النطاق:** كل بنود ملف التقييم باستثناء DNS-AID وDNSSEC، بناءً على طلب مالك المشروع.

## مبدأ الأمان

يقتصر الاكتشاف العام والوكلاء على المعلومات التي يستطيع زائر غير مسجل الوصول إليها: الإعلانات المعتمدة العامة، التصنيفات، الدول، وحالة الصحة. لا تظهر في الكتالوجات أو أدوات MCP أو WebMCP المحادثات أو الحسابات أو الإعلانات غير المنشورة أو المحفظة أو العملات أو الترويج أو الإدارة أو عمليات الشراء/المزاد.

| بند التقييم | المورد أو المكوّن | السلوك المخطط |
|---|---|---|
| Link headers | Middleware في Backend ورؤوس Vercel | إعلان `api-catalog` و`service-doc` و`alternate` للوثائق العامة فقط. |
| Markdown للـAgents | صفحة الإعلان server-side | `Accept: text/markdown` يعيد Markdown من بيانات الإعلان العامة مع `Vary: Accept`؛ الصفحة الرئيسية تحتاج تفعيل Cloudflare اختياريًا لأن Vercel يقدمها كملف ثابت. |
| Content Signals | `robots.txt` | `ai-train=no, search=yes, ai-input=yes`؛ حجب المسارات الخاصة. |
| API Catalog | `/.well-known/api-catalog` | Linkset RFC 9727 لواجهات القراءة العامة ووثائقها وOpenAPI العام فقط. |
| OAuth discovery | `/.well-known/oauth-authorization-server` وOpenID alias | يُنشر فقط بعد تنفيذ OAuth Authorization Code + PKCE وأمان redirect/client registry. |
| Protected resource metadata | `/.well-known/oauth-protected-resource` | يصف مورد أدوات الوكيل المقيد وقائمة scopes الفعلية. |
| auth.md | `/auth.md` | Markdown يشرح التسجيل والموافقة وPKCE وسحب التفويض من دون أسرار. |
| MCP server card | `/.well-known/mcp/server-card.json` | يعلن endpoint MCP streamable HTTP فعليًا وأدوات القراءة العامة. |
| Agent Skills | index و`SKILL.md` | مهارة واحدة لبحث الإعلانات العامة مع SHA-256 digest، بلا سكربتات. |
| ARD | `/.well-known/ai-catalog.json` | قائمة قدرات API/MCP/skills بوصف واستعلامات نموذجية فقط. |
| WebMCP | مكوّن React progressive enhancement | أدوات بحث وعرض إعلان عامة فقط؛ لا تغيّر شيئًا عند غياب API التجريبي. |

## اختبار القبول

1. جميع ملفات `.well-known` تعيد JSON صحيحًا مع نوع محتوى صحيح وCORS عام للبيانات الوصفية.
2. كتالوج API لا يسرد أي مسار كتابة أو مسار يحتاج صلاحية مستخدم أو إدارة.
3. `robots.txt` يسمح بفهرسة المحتوى العام ويمنع وصول العناكب إلى المسارات الخاصة.
4. طلب صفحة إعلان عامة مع `Accept: text/markdown` يعيد Markdown مع `Vary: Accept`، ولا يفصح عن بيانات البائع الخاصة.
5. MCP وWebMCP لا يحتويان إلا أدوات القراءة العامة ذات schema مقيد.
6. OAuth metadata لا يُنشر قبل أن تطابقه endpoints واختبارات PKCE فعلية.
