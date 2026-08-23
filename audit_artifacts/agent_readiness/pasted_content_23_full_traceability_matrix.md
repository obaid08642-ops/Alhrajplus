# مصفوفة التتبع الكاملة لملف `Pasted_content_23.txt`

**تاريخ المراجعة:** 2026-08-23  
**قاعدة المراجعة:** جرى تفكيك كل Goal وIssue وFix وSkill وDocs الواردة في الملف، ثم إضافة المتطلبات التفصيلية التي تفرضها المهارات نفسها. لا تعني خانة «موجود» أن الفاحص الخارجي سيمر؛ بل إن التحقق الحي جزء مستقل من الخطة.

## مفتاح الحالة

| الحالة | المعنى |
|---|---|
| موجود في المصدر | متاح في Web/Backend لكنه يحتاج فحص الدومين العام. |
| فجوة مؤكدة | غير موجود أو لا يحقق العقد المطلوب. |
| قرار بنية مطلوب | لا يصح إعلان الميزة قبل توافر مزود/صلاحيات/خدمة تشغيلية حقيقية. |
| غير منطبق Native | مورد يتطلب أصل نطاق HTTP أو DNS ولا يمكن أن ينشره تطبيق React Native؛ يغطيه Backend المشترك. |

## A. DNS for AI Discovery — الملف: الأسطر 1–9

| المتطلب الذري | مصدره | حالة المشروع الآن | المنصة المسؤولة | مرحلة التنفيذ المصححة | اختبار القبول |
|---|---|---|---|---|---|
| نشر entrypoint تحت `_agents`، على الأقل `_index._agents.alhraj.online` | Goal/Fix السطران 1 و5 | فجوة مؤكدة | DNS | A1 | استعلام DoH يعيد RRset صحيحًا. |
| إعلان وكيل MCP عام عبر اسم خدمة مستقل، مثل `_mcp._agents.alhraj.online`؛ وA2A فقط عند وجود endpoint A2A حقيقي | Fix السطر 5 ومهارة DNS-AID | فجوة مؤكدة | DNS + Backend | A1/A2 | سجل لكل بروتوكول حقيقي فقط؛ لا إعلان عن A2A قبل تشغيله. |
| استخدام ServiceMode SVCB أو HTTPS بـpriority غير صفري و`alpn` و`port` وendpoint صحيح | Fix السطر 5 ومهارة DNS-AID وRFC 9460 | فجوة مؤكدة | DNS | A1 | SVCB صالح لا يكرر مفاتيح ويعيد endpoint حقيقي. |
| استخدام `keyNNNNN` فقط للـSvcParam التجريبي الخاص بـDNS-AID عند الحاجة | مهارة DNS-AID | فجوة مؤكدة | DNS | A1 | مراجعة zone file وعدم اختراع مفاتيح مسماة غير مسجلة. |
| ربط الـdescriptor ببطاقة MCP/ARD المنشورة وبصمة SHA-256 عند دعم صيغة المزود | مسودة DNS-AID | فجوة مؤكدة | DNS + Backend | A2 | URI قابل للجلب والبصمة تطابق الوثيقة canonical. |
| توقيع منطقة الاكتشاف بـDNSSEC، مع DS صحيح عند المسجل | Fix السطر 5 ومهارة DNS-AID | قرار بنية مطلوب | DNS registrar + DNS provider | A3 | تحقق DNSSEC من محللين مستقلين وعدم إتلاف البريد/الموقع. |
| نشر `_catalog._agents` TXT الذي يشير إلى ARD و`_search._agents` SRV فقط عند توفر بحث دلالي حقيقي | مهارة ARD | فجوة مؤكدة جزئيًا | DNS | A4 | تحقق scanner من `_catalog`؛ لا نشر `_search` بدون خدمة. |
| تشغيل فحص DoH الخارجي وتسجيل نتيجة `checks.discoverability.dnsAid` | مهارة DNS-AID | فجوة مؤكدة | QA | A8 | حالة pass من scanner ومحلات DoH مستقلة. |

## B. Markdown for Agents — الملف: الأسطر 13–21

| المتطلب الذري | مصدره | حالة المشروع الآن | المنصة المسؤولة | مرحلة التنفيذ المصححة | اختبار القبول |
|---|---|---|---|---|---|
| قبول `Accept: text/markdown` | Goal/Fix السطران 13 و17 | موجود جزئيًا: Backend وRewrite جذري؛ الفحص الحي السابق أظهر HTML قبل التصحيح الأخير | Web + Backend | B1 | Curl للنطاق الرئيسي بعد النشر يعيد Markdown. |
| تمثيل Markdown لكل صفحة عامة ذات قيمة: الصفحة الرئيسية، الإعلان العام، الصفحات العامة الثابتة | Fix السطر 17 ومهارة Markdown | موجود جزئيًا: home وlisting؛ الفجوة في تغطية الصفحات العامة الأخرى | Web + Backend | B2 | مصفوفة URL/تمثيل؛ لا Markdown للحساب/المحادثة/الإدارة. |
| `Content-Type: text/markdown; charset=utf-8` | Fix السطر 17 | موجود في Backend، غير مثبت حيًا للدومين | Web + Backend | B1 | رأس صحيح لكل URL تفاوضي. |
| إبقاء HTML افتراضيًا بلا Accept Markdown | Fix السطر 17 | موجود في التصميم | Web | B1 | طلب عادي يعيد `text/html`. |
| `Vary: Accept` وعدم مشاركة cache بين HTML وMarkdown | وثيقة Cloudflare | موجود في Backend Markdown؛ يحتاج تحقق edge | Web + Backend | B1 | يظهر `Vary: Accept` مع الحفاظ على Cache-Control. |
| `x-markdown-tokens` وحساب صحيح | Fix السطر 17 ووثيقة Cloudflare | موجود في Backend | Backend | B3 | عدد موجب ومتوافق مع النص المنشور. |
| الحفاظ على رؤوس الأمن/CORS/cache وContent-Signal في التمثيل المتفاوض | وثيقة Cloudflare | موجود جزئيًا | Web + Backend | B3 | مقارنة الرؤوس في HTML/Markdown. |
| خيار Cloudflare managed converter للمنطقة عند توفرها | مهارة Markdown ووثيقة Cloudflare | قرار بنية مطلوب؛ اتصال Cloudflare معطّل حاليًا | DNS/CDN | B4 | تفعيل مباشر أو إبقاء تنفيذ التطبيق بعد قياس التكلفة/التوافق. |
| تشغيل فاحص `checks.contentAccessibility.markdownNegotiation` | مهارة Markdown | فجوة تحقق | QA | B5 | pass على الدومين الأساسي. |

## C. OAuth Protected Resource Metadata — الملف: الأسطر 25–33

| المتطلب الذري | مصدره | حالة المشروع الآن | المنصة المسؤولة | مرحلة التنفيذ المصححة | اختبار القبول |
|---|---|---|---|---|---|
| `/.well-known/oauth-protected-resource` من أصل النطاق مع HTTP 200 وJSON | Fix السطر 29 ومهارة OAuth | موجود | Web + Backend | C1 | الدومين الأساسي وBackend يعيدان المستند نفسه. |
| `resource` يطابق resource identifier حرفيًا | RFC 9728 | موجود جزئيًا؛ يحتاج فصل مورد MCP عن موارد API الخاصة | Backend | C2 | اختبار path-derived metadata ومطابقة `resource`. |
| `authorization_servers` يتضمن issuers حقيقية | Fix السطر 29 ومهارة OAuth | فجوة مؤكدة: القائمة فارغة بصدق | Identity + Backend | C3 | issuer قابل للجلب ومتطابق في AS metadata. |
| `scopes_supported` و`bearer_methods_supported: ["header"]` | Fix السطر 29 ومهارة Auth.md | فجوة مؤكدة | Identity + Backend | C3 | أقل scopes ممكنة وتفويض فعلي لكل scope. |
| 401 يحمل `WWW-Authenticate: Bearer resource_metadata=...` للمورد المحمي | RFC 9728 ومهارة OAuth | فجوة مؤكدة | Backend | C4 | طلب بلا token لمسار محمي يعيد 401 وmetadata صحيحين. |
| مسارات well-known path-specific لموارد متعددة عند الحاجة | RFC 9728 | فجوة تصميم | Backend | C2 | metadata لكل resource identifier محمي. |
| فحص `checks.discovery.oauthProtectedResource` | مهارة OAuth | فجوة تحقق | QA | C5 | pass دون إعلان issuer أو scope وهمي. |

## D. Auth.md Agent Registration — الملف: الأسطر 37–45

| المتطلب الذري | مصدره | حالة المشروع الآن | المنصة المسؤولة | مرحلة التنفيذ المصححة | اختبار القبول |
|---|---|---|---|---|---|
| خدمة `/auth.md` من root وMarkdown | Fix السطر 41 | موجود | Web + Backend | D1 | 200 و`text/markdown`. |
| H1 يتضمن نص `auth.md` حرفيًا | Issue السطر 39 ومهارة Auth.md | فجوة مؤكدة: العنوان الحالي لا يتضمن النقطة | Backend | D1 | يبدأ الملف بـ`# Auth.md` أو عنوان يحتويها. |
| شرح الجمهور، التسجيل، الاعتمادات، والاستخدام في الملف نفسه | مهارة Auth.md | موجود جزئيًا | Backend | D2 | يُميّز public read-only عن protected operations. |
| AS metadata في كل issuer معلن مع `issuer` صحيح | Fix السطر 41 ومهارة Auth.md | قرار بنية مطلوب | Identity + Backend | D3 | issuer في PRM وAS metadata متطابقان. |
| `agent_auth.skill` و`register_uri` وطريقة تسجيل كاملة واحدة | Fix السطر 41 ومهارة Auth.md | فجوة مؤكدة | Identity + Backend | D3 | endpoint حقيقي، لا مجرد نص وثائقي. |
| دعم ID-JAG أو verified-email أو anonymous مع identity/credential/claim endpoints المناسبة | مهارة Auth.md ومرجع WorkOS | قرار بنية مطلوب | Identity + Backend | D4 | flow اختباري يعمل مع consent وPKCE/claim. |
| token endpoint وPKCE وJWKS وrotation وrevoke/introspection وscope enforcement | RFCs ومرجع Auth.md | فجوة مؤكدة | Identity + Backend | D4 | اختبارات token/revoke/expiry وعدم تصعيد scope. |
| عدم تنفيذ POST registration في الفحص السلبي | ملاحظة مهارة Auth.md | متطلب أمان | QA | D5 | فاحص GET فقط؛ اختبار منفصل sandbox للتسجيل. |

## E. ARD / AI Catalog — الملف: الأسطر 49–57

| المتطلب الذري | مصدره | حالة المشروع الآن | المنصة المسؤولة | مرحلة التنفيذ المصححة | اختبار القبول |
|---|---|---|---|---|---|
| `/.well-known/ai-catalog.json` على origin root | Fix السطر 53 ومهارة ARD | موجود | Web + Backend | E1 | 200 من الدومين الأساسي. |
| `Content-Type: application/json` و`Access-Control-Allow-Origin: *` | Fix السطر 53 ومهارة ARD | Content-Type موجود؛ CORS يحتاج إثبات/تثبيت | Web + Backend | E1 | headers صريحة حيًا. |
| `specVersion` غير فارغ | Fix السطر 53 ومهارة ARD | موجود (`0.1`) لكن يجب مواءمته مع ai-catalog (`1.0`) | Backend | E2 | string غير فارغ ومختبر بالفاحص. |
| `host.displayName` و`host.identifier` ثابت مثل DID | مهارة ARD | فجوة مؤكدة: host الحالي يملك name/url فقط | Backend | E2 | host يحقق schema. |
| كل entry له `identifier` URN | Issue السطر 51 وFix السطر 53 ومهارة ARD | فجوة مؤكدة: يستخدم `id` بدل `identifier` | Backend | E2 | `urn:air:alhraj.online:<namespace>:<name>`. |
| كل entry له displayName ونوع IANA Media Type | Fix السطر 53 ومهارة ARD | موجود جزئيًا؛ نوع MCP الحالي عام جدًا | Backend | E3 | `application/mcp-server-card+json` حيث يلزم. |
| exactly one of `url` أو `data` | Fix السطر 53 ومهارة ARD | موجود غالبًا؛ يجب تثبيت schema test | Backend | E3 | JSON schema/conformance test. |
| 2–5 representativeQueries لكل entry | Fix السطر 53 ومهارة ARD | موجود (3) | Backend | E3 | لا يقل ولا يزيد عن المدى. |
| إعلان API/MCP/Skills فقط عند وجودها فعليًا؛ لا إعلان A2A بلا Agent Card وendpoint | Goal السطر 49 ومهارة ARD | MCP/API/Skill موجودة؛ A2A غير موجود ولا يعلن | Backend | E4 | إما Agent Card وA2A read-only حقيقي أو الاستمرار بعدم الإعلان. |
| `Agentmap` في robots و`link rel="ai-catalog"` وDNS catalog TXT كمسارات إضافية | مهارة ARD | فجوة جزئية | Web + DNS | E5 | اكتشاف متعدد المسارات دون تغيير private paths. |
| فحص `checks.discovery.ard` | مهارة ARD | فجوة تحقق | QA | E6 | pass، وخاصة identifier. |

## F. MPP Payment Discovery and Runtime — الملف: الأسطر 61–69

| المتطلب الذري | مصدره | حالة المشروع الآن | المنصة المسؤولة | مرحلة التنفيذ المصححة | اختبار القبول |
|---|---|---|---|---|---|
| `/openapi.json` من site root مع HTTPS و`application/json` | Fix السطر 65 ومهارة MPP ومسودة Payment Discovery | فجوة مؤكدة: يوجد public OpenAPI باسم well-known مختلف | Web + Backend | F1 | 200 مع OpenAPI 3.x وCache-Control مناسب. |
| لا كشف للواجهات الخاصة؛ ملف OpenAPI المدفوع منفصل ومقيد | اعتبارات أمن Payment Discovery | متطلب أمان | Backend | F1 | لا chat/wallet/admin/private endpoints. |
| `x-service-info` مع categories وروابط docs/homepage/llms | مسودة Payment Discovery | فجوة مؤكدة | Backend | F2 | schema صحيح وURLs عامة فقط. |
| `x-payment-info` لكل payable operation | Fix السطر 65 ومهارة MPP | فجوة مؤكدة | Backend | F2 | لا يمتد إلى endpoints مجانية. |
| payment offers تستخدم intent `charge` أو `session` وmethod وamount كسلسلة أصغر وحدة وcurrency/description | Fix السطر 65 ومسودة Payment Discovery | فجوة مؤكدة | Backend | F2 | multi-offer schema صالح. |
| 402 response declaration وinput schema | مسودة Payment Discovery | فجوة مؤكدة | Backend | F2 | OpenAPI يصف 402 وrequest body. |
| 402 runtime هو authoritative وليس OpenAPI | مسودة Payment Discovery | فجوة مؤكدة | Backend | F3 | أي تعارض يخضع لـChallenge runtime. |
| دمج `pympp` في FastAPI، secret server-side، challenge/credential/receipt | Fix السطر 65 ووثائق MPP Python | فجوة مؤكدة | Backend | F3 | sandbox transaction كاملة. |
| منع replay/idempotency، logging بلا credentials، rate limits | اعتبارات أمن MPP | فجوة مؤكدة | Backend + DB | F3 | إعادة credential نفسها تفشل بأمان. |
| اختيار method: Stripe أو Tempo أو Lightning أو card؛ عدم تعدد rails بلا حاجة | Fix السطر 65 | قرار بنية مطلوب | Payment provider + Backend | F0 | مزود واحد sandbox موثق. |
| بدء sandbox فقط ثم موافقة منفصلة لـlive وتحويل الأموال | سياسة السلامة ووثائق Stripe/MPP | قرار إلزامي | Payment provider | F4 | لا live keys أو تسوية قبل موافقة صريحة. |
| معالجة Mobile لاستجابة 402 وإظهار حالة دفع دون أسرار داخل التطبيق | اتساق المنصة | فجوة مستقبلية | Mobile | F5 | لا retry أعمى ولا credentials في bundle. |
| فحص `checks.commerce.mpp` وroundtrip sandbox | مهارة MPP ووثائق MPP | فجوة تحقق | QA | F6 | scanner pass وtest payment sandbox. |

## خريطة التنفيذ المعدلة

| المرحلة | النطاق | المتطلبات التي تغطيها |
|---|---|---|
| 0 | تثبيت الدومين ومزود DNS والهوية ومزود MPP والـsandbox | A، C، D، F قرارات البنية. |
| 1 | إصلاح موارد origin القابلة للتنفيذ فورًا: Markdown، Auth.md heading، ARD schema/CORS/identifier/host، Agentmap وHTML link وOpenAPI root غير مدفوع | B، D1، E1–E5، F1. |
| 2 | DNS-AID وDNSSEC وDNS catalog بعد ربط مزود DNS، مع rollback plan | A1–A8. |
| 3 | OAuth/OIDC وAgent Registration التشغيلي | C2–C5، D2–D5. |
| 4 | MPP sandbox وendpoint API جديد فقط | F2–F6. |
| 5 | توافق Mobile لـ402 واختبارات Web/Mobile/Backend/حماية الأسرار | B–F. |
| 6 | نشر تدريجي، فحص scanner الحي، توثيق، وموافقة مستقلة قبل MPP live | A–F. |

## جميع المراجع المقروءة

[1] [ملف المستخدم Pasted_content_23.txt](/home/ubuntu/upload/Pasted_content_23.txt)

[2] [DNS-AID Skill](https://isitagentready.com/.well-known/agent-skills/dns-aid/SKILL.md)

[3] [Markdown Negotiation Skill](https://isitagentready.com/.well-known/agent-skills/markdown-negotiation/SKILL.md)

[4] [OAuth Protected Resource Skill](https://isitagentready.com/.well-known/agent-skills/oauth-protected-resource/SKILL.md)

[5] [Auth.md Skill](https://isitagentready.com/.well-known/agent-skills/auth-md/SKILL.md)

[6] [ARD Skill](https://isitagentready.com/.well-known/agent-skills/ard/SKILL.md)

[7] [MPP Skill](https://isitagentready.com/.well-known/agent-skills/mpp/SKILL.md)

[8] [DNS-AID Internet-Draft](https://datatracker.ietf.org/doc/draft-mozleywilliams-dnsop-dnsaid/)

[9] [RFC 9460](https://www.rfc-editor.org/rfc/rfc9460)

[10] [RFC 9728](https://www.rfc-editor.org/rfc/rfc9728)

[11] [Cloudflare Markdown for Agents](https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/)

[12] [Auth.md Documentation](https://workos.com/auth-md/docs)

[13] [Auth.md Reference Implementation](https://github.com/workos/auth.md)

[14] [ARD Specification](https://agenticresourcediscovery.org/)

[15] [ARD Source Repository](https://github.com/ards-project/ard-spec)

[16] [AI Catalog Source Repository](https://github.com/Agent-Card/ai-catalog)

[17] [MPP Documentation](https://mpp.dev)

[18] [Payment Discovery Internet-Draft](https://paymentauth.org/draft-payment-discovery-00.txt)
