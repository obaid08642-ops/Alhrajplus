# الخطة المصححة الكاملة لتنفيذ `Pasted_content_23.txt`

**حالة الخطة:** جاهزة للموافقة قبل البدء بالتنفيذ الجديد.  
**قاعدة العمل:** لا يعلن النظام عن DNS-AID أو OAuth agent registration أو MPP كقدرة تشغيلية إلا بعد أن تصبح جميع endpoints والمفاتيح والاختبارات المرتبطة بها حقيقية. لا تسجل أو تنقل أي أموال في بيئة live قبل موافقة صريحة مستقلة.

## 1. نطاق التنفيذ الكامل

تنفذ الخطة جميع المحاور الستة في الملف: DNS-AID وDNSSEC، تفاوض Markdown، OAuth Protected Resource Metadata، Auth.md وتسجيل الوكلاء، ARD/AI Catalog، وMPP. ويجري التنفيذ على Web وBackend حيث تنتمي موارد النطاق، وعلى Mobile حيث يلزم التعامل مع API أو 402؛ لا تُكرر ملفات `.well-known` أو `robots.txt` أو DNS أو WebMCP داخل React Native لأنها غير قابلة للنشر أو الاكتشاف من التطبيق الأصلي.

| المحور | Web | Backend | Mobile | شرط البدء |
|---|---|---|---|---|
| DNS-AID/DNSSEC | رابط/إشارة فقط | descriptor وMCP card/ARD | غير منطبق Native | تحديد مزود DNS وصلاحية المنطقة. |
| Markdown | edge negotiation وHTML link | Markdown آمن للموارد العامة | لا يتفاوض Native على صفحات HTML | تحقق النشر الحي. |
| OAuth/PRM/Auth.md | origin routing | metadata وOAuth resource server | يستخدم access token الصادر فقط | اختيار/توفير authorization server. |
| ARD | origin/CORS/HTML link/robots | catalog وMCP/API/skills | يستهلك Backend المشترك فقط | لا يحتاج خدمة خارجية. |
| MPP | OpenAPI root فقط | 402/challenge/receipt/replay protection | يعالج 402 بلا أسرار | اختيار مزود sandbox وpayable operation. |

## 2. المرحلة التمهيدية — قرارات البنية وحماية الإنتاج

تحدد هذه المرحلة ثلاثة خيارات لا يمكن للكود اتخاذها من تلقاء نفسه. أولًا، نثبت أين تُدار منطقة `alhraj.online`، ثم نفعّل اتصال مزود DNS المخول فقط أو نستخدم لوحة المزود الحالي. ثانيًا، نختار خادم OAuth/OIDC تشغيليًا: مزود مُدار هو المسار الموصى به لأنه يوفر issuer وPKCE وJWKS وrotation وrevocation، بينما البناء الداخلي يؤجل حتى مراجعة أمنية مستقلة. ثالثًا، نختار MPP sandbox عبر Stripe أو Tempo، ونحدد **عملية API جديدة فقط** تكون مدفوعة؛ لا تُحوّل الرسائل أو المكالمات أو المحفظة أو الترويج أو المزاد إلى مسارات مدفوعة.

| القرار | الخيارات | معيار الاختيار | ناتج المرحلة |
|---|---|---|---|
| DNS | Cloudflare أو مزود DNS الحالي | دعم SVCB/HTTPS وDNSSEC وإمكان rollback | المنطقة والـregistrar وخطة التراجع. |
| هوية الوكلاء | OAuth/OIDC مُدار أو بناء داخلي | سرعة التشغيل مقابل مسؤولية الأمن | issuer حقيقي وscopes أولية. |
| MPP sandbox | Stripe أو Tempo | توفر الحساب والاختبار والعملة | profile/secret sandbox وrail واحد فقط. |
| API مدفوعة | تصدير/تحليل عام جديد فقط | لا تمس حالة مستخدم أو عملة داخلية | schema وسعر sandbox وlimit. |

## 3. المرحلة الأولى — تصحيح الاكتشاف HTTP الموجود وفحوص المصدر والنطاق

سأثبت أولًا تفاوض Markdown على نطاق Web بعد النشر، لا على Render فقط. يشمل ذلك `Accept: text/markdown` للصفحة الرئيسية وصفحة الإعلان وأي صفحة عامة مشمولة، مع `Content-Type: text/markdown; charset=utf-8` و`Vary: Accept` و`x-markdown-tokens` وحفاظ رؤوس الأمن والتخزين وContent-Signal. سيظل HTML التمثيل الافتراضي، ولن يُصدر Markdown من المحادثات أو الحسابات أو الإدارة أو المدفوعات الخاصة.

بالتوازي، سأصحح `auth.md` ليبدأ بعنوان H1 يحتوي `Auth.md` حرفيًا مع تعليمات وصول عام واضحة. وأضيف في `robots.txt` توجيه `Agentmap` إلى `/.well-known/ai-catalog.json`، وفي HTML العام رابط `rel="ai-catalog"`، وأثبت CORS على catalog. كما أنشر `/openapi.json` عند الأصل بوثيقة OpenAPI عامة محدودة، منفصلة عن OpenAPI التشغيلي الكامل، مع cache مناسب وعدم كشف أي API خاصة.

**معيار القبول:** ينجح curl والفاحص الحي في Markdown و`auth.md` وCatalog وOpenAPI، ولا يظهر في أي ملف عام مسار حساب أو chat أو wallet أو promotion أو admin.

## 4. المرحلة الثانية — ARD / AI Catalog بأكمله

سأعيد بناء manifest بتركيب ai-catalog المتوقع: `specVersion` مناسب، و`host.displayName` و`host.identifier` ثابتان، وكل entry يحمل `identifier` بصيغة `urn:air:alhraj.online:<namespace>:<name>` و`displayName` وIANA media type صحيحًا، ويحتوي واحدًا فقط من `url` أو `data`، ويضم من 2 إلى 5 `representativeQueries`. سأحتفظ بـ`id` مؤقتًا للتوافق الخلفي إن لزم، لكن `identifier` هو الحقل المعتمد في الفاحص.

سيعرض catalog فقط موارد حقيقية: public OpenAPI، MCP العام المقيد بالقراءة، وAgent Skill العام. لن أضيف A2A إلى manifest أو DNS إلا بعد تنفيذ Agent Card وendpoint A2A read-only حقيقيين، لأن الإعلان عن قدرة غير موجودة يضر الاكتشاف بدلاً من تحسينه. سيشمل الاختبار Media Types خاصة ببطاقة MCP، CORS، schema، ونتيجة فاحص ARD.

## 5. المرحلة الثالثة — DNS-AID وDNSSEC وCatalog DNS

بعد اعتماد مزود DNS، سأضيف `_index._agents.alhraj.online` كـServiceMode SVCB/HTTPS للـindex العام، وأسجل اسم خدمة مستقل للـMCP العام فقط مع `alpn` و`port=443` وendpoint صحيح. عند الحاجة إلى معلمات DNS-AID التجريبية، ستستخدم أسماء `keyNNNNN` الرقمية فقط، ولن يضاف parameter اسمي غير مسجل. سيشير descriptor إلى MCP server card أو ARD catalog، مع digest SHA-256 متى كان المزود وصيغة السجل يدعمانها.

سأنشر أيضًا `_catalog._agents.alhraj.online` TXT الذي يدل على ARD. لن أضيف `_search._agents` SRV قبل وجود محرك بحث دلالي عام مستقل، ولن أضيف `_a2a` قبل تشغيل A2A فعلي. بعد نسخة اختبار من السجلات وخطة rollback، أفعل DNSSEC مع تحقق DS لدى المسجل، ثم أتحقق عبر Cloudflare DoH وGoogle DoH ومحلل DNSSEC مستقل، مع مقارنة سجلات البريد والموقع قبل وبعد التغيير.

**معيار القبول:** فحص DNS-AID يمر، DNSSEC authenticated، وكل سجل يشير إلى خدمة موجودة وحاصلة على TLS صحيح.

## 6. المرحلة الرابعة — OAuth Protected Resource وAuth.md التشغيلي

بعد اختيار issuer حقيقي، سأجعل `/.well-known/oauth-protected-resource` يصدر `resource` مطابقًا حرفيًا للمورد المحمي و`authorization_servers` و`scopes_supported` و`bearer_methods_supported: ["header"]`. وأضيف مسارات metadata المشتقة من الموارد عند وجود أكثر من protected resource، ثم أجعل الـ401 لمسار محمي يحمل `WWW-Authenticate` مع `resource_metadata` الصحيح.

سأبني أو أدمج Authorization Server metadata على issuer نفسه، مع `issuer` و`token_endpoint` و`revocation_endpoint` وJWKS وPKCE وscopes أصغر قدر ممكن. ثم أضيف `agent_auth` يحتوي `skill` و`register_uri` ومسار تسجيل كامل واحد على الأقل. المسار المختار يكون ID-JAG أو verified-email أو anonymous claim؛ أيًا كان الاختيار، يجب أن يتضمن identity/credential types ومسارات claim أو revocation المناسبة وسجل تدقيق لا يحفظ JWTs أو كلمات المرور. يظل MCP/API العام بلا اعتماد، وتُمنح scopes القراءة فقط افتراضيًا؛ العمليات المؤثرة تتطلب consent صريحًا وscope مستقلًا.

**معيار القبول:** تدفق agent registration sandbox كامل من discovery إلى token إلى resource إلى revoke، مع فشل PKCE/scopes/replay بشكل آمن.

## 7. المرحلة الخامسة — MPP Discovery وMPP Runtime في Sandbox

سأضيف إلى `/openapi.json` امتداد `x-service-info` يصف categories وروابط API/homepage/llms، ثم أضيف `x-payment-info` **للعملية المدفوعة الجديدة فقط**. سيستخدم الامتداد multi-offer future-safe، ويحتوي intent `charge` أو `session`، method واحد في البداية، amount كسلسلة بأصغر وحدة، currency، وdescription. ستتضمن العملية schema للمدخلات وإعلان response `402` وCache-Control؛ ويبقى OpenAPI لا يكشف العمليات الخاصة.

أدمج `pympp` في FastAPI باستخدام secret في إعدادات الخادم فقط. المسار يعيد `402` Challenge عند غياب Credential، ويتحقق من credential، ويمنع replay بمطالبة ذرية منتهية الصلاحية، ويعيد Payment Receipt بعد النجاح. الـ402 التشغيلي يظل المرجع النهائي لقيمة الدفع حتى لو اختلفت عنه وثيقة OpenAPI. يُجرى اختبار end-to-end في sandbox فقط، مع اختبار invalid credential وduplicate credential وamount mismatch وnetwork failure وreceipt، ثم فحص MPP.

> لن أضع مفاتيح Stripe/Tempo في Git أو Web أو Mobile، ولن أنفذ payment live أو أمر تسوية أو تحصيل قبل أن تحدد أنت مزود live والسعر والعملة والعملية وتؤكد ذلك صراحة في هذه المحادثة.

## 8. المرحلة السادسة — توافق Mobile والأمان التشغيلي

لن يكرر تطبيق Mobile موارد DNS أو `.well-known`، لكنه سيحصل على معالجة موحدة لاستجابة `402`: حالة «الدفع مطلوب» مفهومة، منع إعادة المحاولة التلقائية، عدم تخزين credential، وعدم تضمين secret في bundle. لن تتغير تدفقات الرسائل أو المكالمات أو Coins أو الترويج الحالية. وسأضيف اختبارات تجعل تطبيق Web/Mobile يميز 402 من أي خطأ شبكة أو 401، ويحافظ على شاشة الإدخال من دون إرسال العملية مرتين.

## 9. المرحلة السابعة — اختبارات ونشر تدريجي وتحقق حي

سأضيف اختبارات Backend لعقود Markdown وARD وPRM/Auth/OAuth وMPP، واختبارات Web لمسارات edge وCatalog وWebMCP، وتصدير Android للتحقق من معالجة 402. ستنفذ بوابات Backend وWeb وMobile وحارس التعريب وفحص التنسيق. بعد كل نشر، أتحقق من الدومين العام وBackend وDNS، وأشغل فاحص agent-readiness على الموقع، وأوثق كل نتيجة مع commit المقابل.

| بوابة التحقق | DNS-AID | Markdown | OAuth/Auth | ARD | MPP | Mobile |
|---|---|---|---|---|---|---|
| اختبار عقد محلي | سجلات planned/schema | headers/variants | metadata/scopes | JSON schema | 402/receipt/replay | 402 state |
| اختبار خدمة | DoH/DNSSEC | curl `Accept` | discovery/token sandbox | origin+CORS | sandbox payment | Android export |
| فاحص خارجي | dnsAid pass | markdown pass | oauth/ authMd pass | ard pass | mpp pass | غير منطبق origin |

## 10. الاستثناءات الصريحة

لا يوجد استثناء من عناصر الملف نفسه. الاستثناء الوحيد هو **التفعيل الحي للمدفوعات قبل الموافقة الصريحة**؛ هذا ليس حذفًا للـMPP بل فصل مقصود بين sandbox وخطر التحصيل الحقيقي. وبالمثل، لا يعلن A2A أو semantic-search في ARD/DNS قبل تشغيل خدمة حقيقية لها؛ وسيضافان ضمن التنفيذ إذا اخترت بناءهما بعد المرحلة الأساسية.

## 11. ترتيب البدء بعد الموافقة

أبدأ مباشرة بالمرحلتين الأولى والثانية اللتين لا تحتاجان credentials خارجية: Markdown الحي، Auth.md heading، ARD schema/identifier/host/CORS، Agentmap/HTML link، وOpenAPI root المقيد. بالتوازي أطلب منك فقط تحديد مزود DNS ومسار OAuth ومزود MPP sandbox؛ ثم أنتقل إلى DNS، OAuth، وMPP بالترتيب المبيّن.
