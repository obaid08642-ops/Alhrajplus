# حالة Render بعد نشر إصلاحات Hardening

**التاريخ:** 2026-08-23  
**الخدمة:** `haraj-api` على Render.

## النتيجة

تم الوصول إلى النسخة المنشورة بنجاح، وأعادت نقاط الصحة والموارد العامة استجابات صحيحة. لكن فحص الجاهزية عبر `GET /api/health/ready` أعاد `{"mongo":"ok","redis":"fallback"}`؛ لذلك لا تزال المنصة تستخدم cache داخل ذاكرة العملية بدل Redis مشترك.

| البند | الحالة | الدليل |
|---|---|---|
| Backend | يعمل | `GET /health` أعاد `200` و`status: ok`. |
| MongoDB | سليم | `GET /api/health/ready` أعاد `mongo: ok`. |
| Redis | غير سليم | `GET /api/health/ready` أعاد `redis: fallback`. |
| OAuth Protected Resource | منشور وصادق | يعيد 200 ويعلن عدم وجود authorization servers أو scopes لأن OAuth غير مشغّل. |
| Auth.md | منشور | يعيد 200 وMarkdown ويفرض أن التسجيل غير متاح حاليًا. |
| انتقال MFA | منشور في الكود | commit `06d328c` يتضمن fallback متوافقًا للمفتاح السابق؛ لا يمكن تأكيد وجود secret من HTTP العام. |

## تفسير التنبيه

الـ405 الذي قد يظهر مع `HEAD /api/health/ready` لا يعني فشل الجاهزية؛ المسار يعرّف GET فقط، وطلب GET الفعلي أعاد نتيجة الصحة أعلاه. لم تُطبع URI Redis أو أي مفاتيح في دليل التحقق.

## الإجراء المطلوب

يجب مراجعة متغير `REDIS_URL` داخل Render في خدمة `haraj-api`: مصدره، البروتوكول (`rediss://` عند استخدام TLS)، hostname، المنفذ، وحالة خدمة Redis نفسها. بعد حفظ التعديل وإعادة النشر، معيار القبول هو `redis: on` في `GET /api/health/ready`.
