# مانع التحقق الحي: Backend على Render لم ينتقل إلى commit `fe39307`

**التاريخ:** 2026-08-23  
**الحالة:** يتطلب نشر Backend على Render قبل إعلان نجاح التعديلات في الإنتاج.

## الدليل

نجح نشر Vercel للـcommit `fe39307`، لكن التحقق الحي أظهر أن كل المسارات التي تُعاد كتابتها إلى Backend ما زالت تخدم إصدارًا أقدم من Render. لذلك أعاد طلب `Accept: text/markdown` إلى `https://www.alhraj.online/` HTML بدل Markdown، وأعاد `/openapi.json` مخطط FastAPI الافتراضي الكامل بدل الوثيقة العامة المحدودة، كما بقي ARD على `specVersion: "0.1"` وبقي عنوان `auth.md` القديم، ولم يظهر `Agentmap` في robots.

هذا ليس فشلًا في Vercel أو في اختبار المصدر المحلي؛ هو عدم تطابق بين commit الموجود في GitHub/Vercel وبين الإصدار الفعلي لخدمة `haraj-api` في Render. وتعرّف `render.yaml` خدمة `haraj-api` بــ`autoDeploy: true`، لكن نتيجة HTTP الحية تؤكد أن النسخة المستهدفة لم تصل بعد إلى هذه الخدمة.

> **أثر أمني مهم:** لا ينبغي اعتبار `/openapi.json` آمنًا أو مناسبًا للاكتشاف العام حتى يكتمل نشر Backend؛ فهو يعرض حاليًا مخطط FastAPI الافتراضي من الإصدار القديم، بما فيه وصف endpoints تشغيلية. لا يتضمن هذا التقرير أي أسرار أو قيم headers حساسة.

## الإجراء المطلوب على Render

افتح خدمة **haraj-api** المتصلة بمستودع `obaid08642-ops/Alhrajplus`، ثم نفّذ **Manual Deploy → Deploy latest commit** وتأكد أن commit هو:

```text
fe39307 — feat: complete public agent discovery origin contracts
```

بعد أن يصبح deploy `Live`، يعاد تنفيذ التحقق الحي للروابط التالية:

| الرابط | النتيجة المطلوبة |
|---|---|
| `https://www.alhraj.online/` مع `Accept: text/markdown` | `200`، `Content-Type: text/markdown`، `Vary: Accept`، `X-Markdown-Tokens`، وجسم Markdown. |
| `https://www.alhraj.online/openapi.json` | وثيقة قراءة عامة فقط، بلا paths خاصة، وبـ`x-service-info`. |
| `https://www.alhraj.online/.well-known/ai-catalog.json` | `specVersion: "1.0"` و`host.identifier` و`entries[].identifier`. |
| `https://www.alhraj.online/auth.md` | عنوان يبدأ بـ`# Auth.md` مع وصف صادق لعدم توفر OAuth التشغيلي حاليًا. |
| `https://www.alhraj.online/robots.txt` | سطر `Agentmap: https://alhraj.online/.well-known/ai-catalog.json`. |

## العناصر المؤجلة عمدًا

| العنصر | سبب عدم التنفيذ الآن | شرط البدء |
|---|---|---|
| DNS-AID وDNSSEC | طلب المستخدم تخطي Cloudflare حاليًا، ولا توجد صلاحية DNS بديلة مؤكدة. | مزود DNS محدد وصلاحية تعديل المنطقة وDNSSEC. |
| OAuth وAgent Registration | لا يوجد authorization server أو issuer أو JWKS أو consent/PKCE حي. | اختيار مزود OIDC أو اعتماد تصميم داخلي ومفاتيح خادم آمنة. |
| MPP وHTTP 402 | لا يوجد مزود Sandbox أو endpoint مدفوع أو سعر اختبار أو مفاتيح backend. | تحديد مزود Sandbox والعملية العامة والسعر، ثم تنفيذ اختبار end-to-end بلا أموال حية. |
| Mobile 402 | لا توجد استجابة 402 شرعية ليتعامل معها التطبيق. | يضاف فقط بعد نشر MPP فعلي ومختبر؛ لا توجد واجهة دفع تجميلية الآن. |

## ما تحقق بلا اعتماد خارجي

اختبارات عقود Backend المستهدفة نجحت بـ21 اختبارًا، واختبارات Web نجحت بـ6 suites/21 tests، وبناء Web نجح، وتصدير Expo Android نجح وأنتج bundle بحجم 7.39 MB. راجع سجل التحقق الحي في `live_verification_fe39307_2026-08-23.txt` لإثبات الفرق بين نسخة المصدر ونسخة Render القائمة.
