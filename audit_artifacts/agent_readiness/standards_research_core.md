# ملاحظات مواصفات جاهزية الوكلاء

**تاريخ الجمع:** 2026-08-23

## RFC 8288 — Web Linking

يعرّف حقل HTTP `Link` لتمثيل روابط ذات علاقة محددة. يحتوي كل link-value على هدف بين `<...>` وعلى `rel` إلزامي. يمكن استخدام علاقات مسجلة أو علاقة امتدادية URI. ستستخدم المنصة العلاقة المسجلة `api-catalog` عند نشرها، وتضيف روابط وصف الخدمة فقط عندما تكون الموارد الفعلية منشورة.

## RFC 9727 — API Catalog

يعرّف `/.well-known/api-catalog` وعلاقة `api-catalog`. يتطلب أن يدعم المورد `GET` و`HEAD`، وأن يقدم Linkset بصيغة `application/linkset+json`. يُوصى بنشر روابط API والوصف وسياسة الاستخدام وOpenAPI، مع تدقيق أمني يمنع إدراج APIs داخلية أو حساسة.

## RFC 8414 — OAuth Authorization Server Metadata

يعرّف `/.well-known/oauth-authorization-server` كمستند JSON يعلن issuer ونقاط المصادقة/الرمز والقدرات الفعلية. الحقول المعلنة يجب أن تطابق تطبيق المصادقة ولا يجوز الإعلان عن grant أو dynamic registration أو JWKS غير مدعوم.

## RFC 9728 — OAuth Protected Resource Metadata

يعرّف `/.well-known/oauth-protected-resource` كمستند JSON للمورد المحمي. يتطلب `resource` مطابقًا لمعرف المورد، ويمكنه إعلان authorization servers وطرق Bearer وscopes والوثائق. لا ينبغي نشر نطاقات لا تنفذها الخدمة فعليًا.

## قرارات التصميم الأولية

1. الكتالوج العام سيشير إلى واجهات القراءة العامة فقط وإلى وثائق الاستخدام وOpenAPI العامة.
2. حسابات المستخدمين، المحادثات، العمليات المالية، الترويج، والعمليات الإدارية لن تظهر كقدرات وكالة عامة.
3. مستندات OAuth ستعكس مسارات JWT الحالية بصفتها metadata توافقية فقط ما لم تكن المنصة توفر Authorization Code أو Dynamic Client Registration فعليًا.
4. جميع موارد الاكتشاف JSON ستكون عبر HTTPS مع `Cache-Control` محدود و`X-Content-Type-Options: nosniff` وCORS عام للموارد الوصفية فقط.

## المصادر

- https://www.rfc-editor.org/rfc/rfc8288
- https://www.rfc-editor.org/rfc/rfc9727
- https://www.rfc-editor.org/rfc/rfc8414
- https://www.rfc-editor.org/rfc/rfc9728

## مراجع إضافية وقرارات التنفيذ

### Markdown for Agents

توثق Cloudflare تفاوض المحتوى `Accept: text/markdown` عبر طبقة الحافة. عند تفعيله، تستخدم الاستجابة `Content-Type: text/markdown; charset=utf-8` وتضيف `Vary: Accept` وتحافظ على رؤوس الأمان من المصدر. هذه ميزة ضبط Cloudflare منفصلة عن كود التطبيق، لذلك سينفذ التطبيق fallback آمنًا على الصفحات العامة عبر مسارات Markdown ثابتة، مع توثيق الحاجة لتفعيل Cloudflare الاختياري لاحقًا.

### Content Signals

تعمل Content Signals كتفضيلات منشورة في `robots.txt`، ولا تمثل آلية حجب تقنية. ستختار المنصة سياسة `ai-train=no, search=yes, ai-input=yes` للصفحات والإعلانات العامة فقط، وتستبعد الحسابات والمحادثات والإدارة عبر `Disallow`.

### Agent Skills discovery

مسودة Cloudflare Agent Skills v0.2.0 تتطلب index في `/.well-known/agent-skills/index.json` مع `$schema`، و`name` و`type` و`description` و`url` وSHA-256 digest لكل artifact. سننشر مهارة Markdown واحدة تصف البحث في الإعلانات العامة فقط، من دون scripts أو قدرات تنفيذ أو وصول بيانات خاصة. تُعامل المواصفة كمسودة تجريبية.

### WebMCP

توضح Chrome أن WebMCP ما زال Early Preview في 2026-02-10. لذلك سيكون التنفيذ progressive enhancement لا يغير سلوك التطبيق عند عدم توفر `navigator.modelContext`: سياق يعرّف قدرات القراءة العامة فقط، من دون شراء أو ترويج أو مراسلة أو تعديل إعلان.

## مصادر إضافية

- https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/
- https://contentsignals.org/
- https://github.com/cloudflare/agent-skills-discovery-rfc
- https://developer.chrome.com/blog/webmcp-epp
