# خط أساس المرحلة 1 — حوكمة التنفيذ والتكافؤ

**التاريخ:** 2026-08-19
**الغرض:** تثبيت حالة المشروع قبل تنفيذ مراحل التوحيد، ومنع خلط آثار تدقيق قديمة أو بيانات إنتاج مع تغييرات البرنامج الجديد.

## حالة المستودع

| البند | الحالة |
|---|---|
| الفرع المرجعي | `main` |
| آخر commit عند بداية المرحلة | `cd09a0e` |
| بيانات الإنتاج | لم تُقرأ أو تُعدّل أو تُنشأ أثناء المرحلة. |
| نطاق المرحلة | `docs/unification/EXECUTION_GOVERNANCE.md` وسجل baseline فقط. |
| آثار تدقيق سابقة غير متتبعة | موجودة في `audit_artifacts/` و`mockups/` قبل هذه المرحلة؛ لا تدخل تلقائيًا في commits البرنامج الجديد. |

## نتائج الاختبار

| الفحص | النتيجة | ملاحظات |
|---|---|---|
| Backend deterministic suite | **91 passed** | توجد 7 warnings: `multipart` و`regex` وFastAPI startup/shutdown deprecated، ومفتاح JWT اختباري قصير في اختبار فقط. |
| Web unit tests | **19 passed** / 5 suites | لم تظهر أخطاء. يوجد تحذير Node deprecation لـ`punycode`. |
| Web production build | ناجح | الحزمة الرئيسية gzip نحو 398 kB. |
| Mobile web export | ناجح | bundle واحد نحو 4.9 MB؛ يدخل ضمن هدف الأداء في المرحلة 12. |
| `git diff --check` | ناجح | لا توجد مسافات لاحقة أو أخطاء diff في التغييرات المتتبعة. |

## قرارات الحوكمة المتحققة

1. Backend وعقود API هما مصدر الحقيقة المشترك، ولا تقاس الميزة على مجرد وجود شاشة.
2. كل مرحلة تتطلب checklist مراجعة، اختبارات، evidence، وخطة rollback قبل الانتقال.
3. لا تستخدم أسرار TURN أو Push أو Maps أو البريد داخل الكود أو docs المتتبعة.
4. لا يدمج أي أثر تدقيق سابق غير مقصود؛ يستهدف كل commit الملفات المرتبطة بالمرحلة فقط.
5. ميزات النظام الأصلية لا تنسخ إلى Web بصورة وهمية؛ تحصل على fallback متصفح مناسب ومقاس.

## قائمة انتقال المرحلة 1

| بند القبول | النتيجة |
|---|---|
| وثيقة حوكمة التنفيذ موجودة | مكتمل |
| خط أساس للاختبارات والتبعيات والأداء مسجل | مكتمل |
| قاعدة بيانات الإنتاج لم تُمس | مكتمل |
| حدود آثار التدقيق غير المتتبعة موثقة | مكتمل |
| فحوص القنوات الثلاث ناجحة | مكتمل |

## المراجع التشغيلية

- `docs/unification/EXECUTION_GOVERNANCE.md`
- `audit_artifacts/unification/test_logs/phase1_backend.txt`
- `audit_artifacts/unification/test_logs/phase1_web.txt`
- `audit_artifacts/unification/test_logs/phase1_web_build.txt`
- `audit_artifacts/unification/test_logs/phase1_mobile_export.txt`
