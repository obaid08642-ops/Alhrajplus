# إطار الوصول إلى مستوى 9.8+ — Alhrajplus

## مبدأ التقييم

الوصول إلى **9.8/10** لا يمكن إثباته بإضافة عدد كبير من الشاشات أو نسخ كل زر لدى المنافسين. يجب قياس المنتج على محاور قابلة للملاحظة، مع بيانات استخدام واختبارات أداء وأجهزة حقيقية. لذلك سيكون رقم 9.8 **هدفًا مشروطًا** لا نتيجة معلنة مسبقًا.

## الأوزان المقترحة

| المحور | الوزن | معيار 9.8 |
|---|---:|---|
| اكتمال الوظائف وعمق الـ verticals | 15% | كل workflow الأساسي مكتمل للسيارات والعقار والوظائف والسلع والخدمات والمزادات، مع حالات الخطأ والاسترجاع |
| سهولة الاستخدام والتحويل | 15% | نشر إعلان أول مرة خلال 90 ثانية للسلع و180 ثانية للـ verticals، مع تقليل الخطوات دون فقدان البيانات |
| البحث والاكتشاف | 12% | فهم العربية والإنجليزية والمرادفات والسعر والموقع، ونتائج قابلة للتفسير مع saved search وتنبيهات |
| الثقة والسلامة | 12% | توثيق تدريجي، fraud signals، report/dispute، سجل بائع، وشرح سبب تقييم الثقة |
| الشات والتواصل | 10% | realtime متعدد الأجهزة، delivery/read، reconnect، offline outbox، media retry، block/report، ومراقبة فقد الأحداث |
| الأداء والاعتمادية | 12% | p95 API ضمن SLO، Core Web Vitals جيدة، graceful degradation، وload tests متعددة النسخ |
| SEO/Geo | 8% | صفحات URL حقيقية متعددة اللغة، structured data صحيحة، sitemap segmentation، lifecycle، وقياس Search Console |
| تطبيقات المنصات | 6% | Android/iOS/Huawei على أجهزة فعلية، deep links، push، safe areas، offline، وإتاحة الوصول |
| الإدارة والبيانات | 5% | audit log، صلاحيات دقيقة، bulk jobs، exports، observability، وPII controls |
| التصميم والهوية | 5% | نظام design موحد، vector assets دلالية، حالات تحميل/فراغ/خطأ، dark mode، وaccessibility |

## بوابات تمنع إعلان 9.8

لا يُسمح بإعلان 9.8 إذا فشل أي شرط حرج: وجود ثغرة عالية الخطورة، فقدان رسائل أو مزايدات، تعطل نشر إعلان، عدم وجود backup/restore مجرب، فشل readiness، تجاوز SLO في حمل متوقع، أو فشل تدفقات login/payment/verification على منصة مدعومة.

## كيف نصل إليه فعليًا

نبدأ بـ parity matrix لكل feature لدى Haraj وDubizzle وOpenSooq وOLX حيث تتوفر الميزة، ثم ننفذ الميزة عبر عقد API ومكوّن UI واختبار workflow ومراقبة metrics. لا ننفذ features سطحية لمجرد زيادة العدد؛ كل ميزة يجب أن تقلل زمن المهمة أو تزيد الثقة أو التحويل أو الاحتفاظ.

الأولوية العملية هي: **بحث دلالي عربي/إنجليزي، Trust Graph، Price Passport، seller storefront وlead CRM، vertical workflows عميقة، شات موثوق مع offline queue، notifications مركزية، SEO server-side متعدد اللغات، ثم load/device QA**. بعد ذلك فقط يمكن قياس النتيجة، والهدف الواقعي المرحلي هو 7.5–8.2 في vertical محدد، ثم 8.5–9.2 على مستوى المنصة، و9.8 فقط بعد إثبات البيانات التشغيلية.

## سياسة تنفيذ ميزة جديدة

لا تُعتبر الميزة مكتملة إلا إذا وُجد لها: schema/API موثق، صلاحيات، empty/loading/error states، ترجمة عربية وإنجليزية، responsive/mobile implementation، analytics event، unit/contract/E2E test، migration أو backward compatibility، وrunbook تشغيل.
