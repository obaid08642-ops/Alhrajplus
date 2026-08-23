# تنفيذ المرحلة الأولى: موارد origin الآمنة لملف `Pasted_content_23.txt`

**التاريخ:** 2026-08-23  
**الحالة:** جاهز للرفع والنشر؛ التحقق الحي بعد النشر مطلوب قبل إعلان نجاحه على الدومين.

## ما نُفذ

جرى تنفيذ البنود التي لا تتطلب صلاحية DNS أو خادم OAuth/OIDC أو مزود دفع. أصبح `/openapi.json` عقد OpenAPI عامًا محدودًا بالقراءة بدلاً من surface FastAPI الافتراضي؛ كما عُطلت تلقائيًا واجهة OpenAPI وSwagger وRedoc الافتراضية كي لا يكشف الدومين العام endpoints الخاصة. يصف العقد فقط health والبحث في الإعلانات العامة وتفاصيلها والتصنيفات والدول، ويحتوي `x-service-info` وروابط الوثائق العامة.

تم تصحيح ARD في `/.well-known/ai-catalog.json` إلى `specVersion: "1.0"`، مع `host.displayName` و`host.identifier`، وإضافة `identifier` بصيغة `urn:air:alhraj.online:...` لكل entry. أبقي حقل `id` مؤقتًا للتوافق الخلفي، وضبطت MCP media type إلى `application/mcp-server-card+json`، وثبتت شرط واحد فقط من `url` أو `data`، وعدد representative queries بين 2 و5.

تم جعل `/auth.md` يبدأ بالعنوان `# Auth.md — Haraj Plus agent authentication`، مع إبقاء النص صادقًا: تسجيل OAuth أو إصدار credentials غير متاح بعد. لم تُضف claims أو scopes أو issuers وهمية.

تمت إضافة `Agentmap: https://<domain>/.well-known/ai-catalog.json` إلى robots الافتراضي، وإلحاقه بالـrobots المخصص إذا كان صالحًا لكنه يفتقده. كما أضيفت إشارات `rel="ai-catalog"` وMarkdown alternate في HTML، ووسعت Link header ليشمل ARD وOpenAPI العام.

في Vercel، استبدلت مطابقة الجذر regex غير الفعالة بمسار الجذر المدعوم `/` مع شرط `Accept: text/markdown`، وأضفت `Vary: Accept`. كان التحقق الحي قبل التعديل يثبت أن الإنتاج، رغم نشر commit السابق بنجاح، ما زال يعيد HTML لطلب Markdown؛ لذلك تبقى نتيجة هذا التصحيح غير مؤكدة حتى اكتمال النشر الجديد والاختبار الحي.

## الاختبارات المنفذة

| البوابة | النتيجة | ملاحظة |
|---|---|---|
| `backend/tests/test_agent_discovery_contract.py` و`test_phase10_seo_model_unit.py` | نجحت: 21 اختبارًا | تشمل ARD، OpenAPI الجذرية، Auth.md، headers، robots، Vercel policy، وإخفاء الواجهات الخاصة. |
| اختبارات Web | نجحت: 6 suites / 21 tests | تشمل i18n/WebMCP واختبارات الواجهة الحالية. |
| بناء Web الإنتاجي | نجح | CRA/CRACO build اكتمل بنجاح. |
| `vercel.json` JSON validation و`git diff --check` | نجحا | قبل محاولة بوابة Backend الكاملة. |
| بوابة Backend الكاملة | غير حاسمة في sandbox | يوجد جزء من الاختبارات القديمة يطلب خدمة HTTP محلية وMongo؛ نجح تشغيل الخادم في dev، لكن suite الكاملة تتضمن اختبارات integration تعتمد على بيانات/خدمات خارجية غير متاحة وتستغرق طويلًا مع failures غير مرتبطة بعقود الوكلاء. لم تُستخدم هذه النتيجة للادعاء بالنجاح العام. |

## ما لم يُنفذ عمدًا

لا توجد تغييرات DNS-AID أو DNSSEC لأن مزود DNS وصلاحية المنطقة لم يُؤكدا. ولا يوجد OAuth تشغيلي أو Agent Registration لأن authorization server لم يُختر بعد. ولا يوجد MPP أو `x-payment-info` أو HTTP 402 مدفوع لأن مزود Sandbox والعملية المدفوعة والسعر لم يحددوا؛ لم تُنشأ أي عملية مالية أو credentials أو مفاتيح دفع.

## شرط الانتقال

بعد commit وpush، يتحقق النشر الحي من `/` بقبول Markdown، و`/openapi.json`، و`/.well-known/ai-catalog.json`، و`/auth.md` و`/robots.txt` على `www.alhraj.online`. لا يعلن أي بند ناجحًا في الإنتاج قبل هذه النتائج.
